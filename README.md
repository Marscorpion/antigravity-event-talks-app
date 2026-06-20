# BigQuery Release Notes Hub

A premium, modern web application built with Python Flask and plain vanilla HTML, JavaScript, and CSS that fetches Google Cloud's BigQuery release notes XML feed, parses the entries, and renders them into an interactive developer dashboard. It also features a custom slide-over drawer to customize and share specific updates on X (Twitter).

---

## Features

- **Live Synchronization**: Fetches the official Google Cloud BigQuery Atom XML feed in real time.
- **Granular Parsing**: Splits day-grouped updates into individual, category-coded cards (Features, Announcements, Issues, Deprecations, and General Updates).
- **Interactive Metric Dashboard**: Live counters displaying totals for each update category. Click a metric card to filter the stream.
- **Advanced Control Filters**: Instant keyword search, quick-select filters, and toggle sorting (Latest First / Oldest First).
- **X/Twitter Composer Drawer**: Slide-over panel featuring a character counter, interactive hashtag helper pills, and a real-time post mockup.
- **Responsive Dark Theme**: Glassmorphic headers, neon accent highlights, and custom visual effects.

---

## Architecture Breakdown

- **Backend**: Python Flask handles XML feed fetching, sanitizing, and chunking into a structured JSON API using `feedparser` and `BeautifulSoup4`.
- **Frontend**: Single-page application using CSS grid layouts, smooth transitions, custom color variables, and reactive state management in vanilla JS.

---

## Setup Instructions

### Prerequisites
Make sure you have Python 3.10+ installed on your system.

### 1. Initialize Virtual Environment & Install Dependencies
Navigate to the project root directory and set up the virtual environment:
```bash
# Create venv
python3 -m venv venv

# Activate venv (MacOS/Linux)
source venv/bin/activate

# Install required packages
pip install Flask requests feedparser beautifulsoup4
```

### 2. Run the Application
Start the Flask local development server:
```bash
python3 app.py
```

By default, the server runs on port `5001`.

### 3. Open the Dashboard
Navigate to the following address in your browser:
👉 **[http://localhost:5001](http://localhost:5001)**

---

## File Structure

```
bq-releases-notes/
├── app.py                # Flask application backend
├── README.md             # Project documentation
├── .gitignore            # Git exclusions
├── templates/
│   └── index.html        # Main dashboard HTML structure
└── static/
    ├── app.js            # Core interactive frontend logic
    └── style.css         # Styling system & dark theme design
```
