import logging
from flask import Flask, render_template, jsonify
import feedparser
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_html_content(html_content, date_str, link_url):
    soup = BeautifulSoup(html_content, 'html.parser')
    updates = []
    
    current_type = None
    current_paragraphs = []
    
    # Atom content XML usually has flat elements inside CDATA
    for element in soup.contents:
        if element.name == 'h3':
            # Save the previous update if we have one
            if current_type and current_paragraphs:
                desc_html = "".join([str(x) for x in current_paragraphs])
                desc_text = "".join([x.get_text() for x in current_paragraphs]).strip()
                # Clean up multiple whitespaces
                desc_text = re.sub(r'\s+', ' ', desc_text)
                updates.append({
                    'date': date_str,
                    'type': current_type,
                    'description_html': desc_html,
                    'description_text': desc_text,
                    'link': link_url
                })
            current_type = element.get_text().strip()
            current_paragraphs = []
        elif element.name is not None:
            if current_type:
                current_paragraphs.append(element)
            else:
                # If there are paragraph elements before any h3
                current_paragraphs.append(element)
                
    # Save the final update
    if current_paragraphs:
        # If we got elements but no h3 type was set, default to 'Update'
        if not current_type:
            current_type = 'Update'
        desc_html = "".join([str(x) for x in current_paragraphs])
        desc_text = "".join([x.get_text() for x in current_paragraphs]).strip()
        desc_text = re.sub(r'\s+', ' ', desc_text)
        updates.append({
            'date': date_str,
            'type': current_type,
            'description_html': desc_html,
            'description_text': desc_text,
            'link': link_url
        })
        
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        # Fetch the feed
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        # Parse feed
        feed = feedparser.parse(response.content)
        
        all_updates = []
        for entry in feed.entries:
            date_str = entry.title if 'title' in entry else 'Unknown Date'
            link_url = entry.link if 'link' in entry else 'https://cloud.google.com/bigquery/docs/release-notes'
            
            # Extract content html
            html_content = ""
            if 'content' in entry and len(entry.content) > 0:
                html_content = entry.content[0].value
            elif 'summary' in entry:
                html_content = entry.summary
                
            updates = parse_html_content(html_content, date_str, link_url)
            all_updates.extend(updates)
            
        return jsonify({
            'status': 'success',
            'updated': feed.feed.updated if hasattr(feed.feed, 'updated') else '',
            'updates': all_updates
        })
    except Exception as e:
        app.logger.error(f"Error fetching/parsing feed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
