// State Management
let state = {
    updates: [],
    filteredUpdates: [],
    searchQuery: '',
    typeFilter: 'all',
    sortOrder: 'desc', // 'desc' = latest first, 'asc' = oldest first
    selectedUpdate: null
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('refresh-icon'),
    lastUpdatedText: document.getElementById('last-updated-text'),
    
    // Stats
    statAllCount: document.getElementById('stat-all-count'),
    statFeatureCount: document.getElementById('stat-feature-count'),
    statAnnouncementCount: document.getElementById('stat-announcement-count'),
    statIssueCount: document.getElementById('stat-issue-count'),
    statCards: document.querySelectorAll('.stat-card'),
    
    // Filter controls
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    typeFilters: document.getElementById('type-filters'),
    sortDesc: document.getElementById('sort-desc'),
    sortAsc: document.getElementById('sort-asc'),
    
    // Feed container
    feedLoader: document.getElementById('feed-loader'),
    feedGrid: document.getElementById('feed-grid'),
    emptyState: document.getElementById('empty-state'),
    
    // Composer Drawer
    composerOverlay: document.getElementById('composer-overlay'),
    closeComposer: document.getElementById('close-composer'),
    previewBadge: document.getElementById('preview-badge'),
    previewDate: document.getElementById('preview-date'),
    previewUpdateText: document.getElementById('preview-update-text'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    mockupContent: document.getElementById('mockup-content'),
    resetTweetBtn: document.getElementById('reset-tweet-btn'),
    shareTweetBtn: document.getElementById('share-tweet-btn'),
    hashtagHelpers: document.querySelectorAll('.helper-tag'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
});

// Setup Events
function setupEventListeners() {
    // Refresh action
    elements.refreshBtn.addEventListener('click', fetchReleases);
    
    // Search action
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        elements.clearSearch.style.display = state.searchQuery ? 'block' : 'none';
        applyFiltersAndRender();
    });
    
    elements.clearSearch.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearch.style.display = 'none';
        applyFiltersAndRender();
    });
    
    // Type Filters
    elements.typeFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        
        // Remove active class from all pills
        elements.typeFilters.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
        pill.classList.add('active');
        
        state.typeFilter = pill.dataset.type;
        applyFiltersAndRender();
    });
    
    // Dashboard Stats Click Filters
    elements.statCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.dataset.filter;
            
            // Sync with sidebar pill
            elements.typeFilters.querySelectorAll('.filter-pill').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type === filterType) {
                    btn.classList.add('active');
                }
            });
            
            state.typeFilter = filterType;
            applyFiltersAndRender();
        });
    });
    
    // Sorting Click Actions
    elements.sortDesc.addEventListener('click', () => {
        elements.sortAsc.classList.remove('active');
        elements.sortDesc.classList.add('active');
        state.sortOrder = 'desc';
        applyFiltersAndRender();
    });
    
    elements.sortAsc.addEventListener('click', () => {
        elements.sortDesc.classList.remove('active');
        elements.sortAsc.classList.add('active');
        state.sortOrder = 'asc';
        applyFiltersAndRender();
    });
    
    // Composer Drawer Setup
    elements.closeComposer.addEventListener('click', closeComposerDrawer);
    elements.composerOverlay.addEventListener('click', (e) => {
        if (e.target === elements.composerOverlay) {
            closeComposerDrawer();
        }
    });
    
    elements.tweetTextarea.addEventListener('input', updateTweetComposerStatus);
    
    elements.resetTweetBtn.addEventListener('click', resetTweetText);
    
    elements.shareTweetBtn.addEventListener('click', publishTweet);
    
    elements.hashtagHelpers.forEach(tag => {
        tag.addEventListener('click', () => {
            const hash = tag.dataset.tag;
            if (!elements.tweetTextarea.value.includes(hash)) {
                elements.tweetTextarea.value = `${elements.tweetTextarea.value.trim()} ${hash}`;
                updateTweetComposerStatus();
            }
        });
    });
}

// Fetch Release Notes
async function fetchReleases() {
    // Show spinner & loader state
    elements.refreshIcon.classList.add('fa-spin');
    elements.refreshBtn.disabled = true;
    elements.feedLoader.classList.remove('hidden');
    elements.feedGrid.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    
    try {
        const response = await fetch('/api/releases');
        if (!response.ok) throw new Error('API Response was not OK');
        
        const data = await response.json();
        
        if (data.status === 'success') {
            state.updates = data.updates;
            
            // Format feed updated time
            if (data.updated) {
                const updatedDate = new Date(data.updated);
                elements.lastUpdatedText.innerText = `Updated: ${updatedDate.toLocaleTimeString()}`;
            } else {
                elements.lastUpdatedText.innerText = `Updated: Just now`;
            }
            
            // Update counts dashboard
            updateDashboardCounters(data.updates);
            
            // Render list
            applyFiltersAndRender();
            showToast('Release notes successfully updated!', false);
        } else {
            throw new Error(data.message || 'Unknown server error');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showToast(`Sync Failed: ${error.message}`, true);
        elements.feedLoader.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    } finally {
        elements.refreshIcon.classList.remove('fa-spin');
        elements.refreshBtn.disabled = false;
    }
}

// Update Dashboard Counter Cards
function updateDashboardCounters(updates) {
    elements.statAllCount.innerText = updates.length;
    
    const features = updates.filter(u => u.type.toLowerCase() === 'feature').length;
    const announcements = updates.filter(u => u.type.toLowerCase() === 'announcement').length;
    // Issue and Deprecations grouped together
    const issues = updates.filter(u => {
        const type = u.type.toLowerCase();
        return type === 'issue' || type === 'deprecation';
    }).length;
    
    elements.statFeatureCount.innerText = features;
    elements.statAnnouncementCount.innerText = announcements;
    elements.statIssueCount.innerText = issues;
}

// Filtering and Sorting Mechanism
function applyFiltersAndRender() {
    let filtered = [...state.updates];
    
    // 1. Filter by category type
    if (state.typeFilter !== 'all') {
        if (state.typeFilter === 'Issue') {
            // Group issue and deprecation in dashboard
            filtered = filtered.filter(u => u.type === 'Issue' || u.type === 'Deprecation');
        } else {
            filtered = filtered.filter(u => u.type === state.typeFilter);
        }
    }
    
    // 2. Filter by search query
    if (state.searchQuery) {
        filtered = filtered.filter(u => {
            return u.description_text.toLowerCase().includes(state.searchQuery) ||
                   u.date.toLowerCase().includes(state.searchQuery) ||
                   u.type.toLowerCase().includes(state.searchQuery);
        });
    }
    
    // 3. Sort by date
    filtered.sort((a, b) => {
        const dateA = Date.parse(a.date) || 0;
        const dateB = Date.parse(b.date) || 0;
        return state.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    state.filteredUpdates = filtered;
    renderFeedList();
}

// Render feed grid cards
function renderFeedList() {
    elements.feedLoader.classList.add('hidden');
    
    if (state.filteredUpdates.length === 0) {
        elements.feedGrid.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.feedGrid.classList.remove('hidden');
    
    elements.feedGrid.innerHTML = '';
    
    state.filteredUpdates.forEach((update, index) => {
        const card = document.createElement('article');
        card.className = 'release-card animate-fade-in';
        
        // Define Custom Variable Style Accent colors
        let accentColor = 'var(--color-update)';
        const typeLower = update.type.toLowerCase();
        if (typeLower === 'feature') accentColor = 'var(--color-feature)';
        else if (typeLower === 'announcement') accentColor = 'var(--color-announcement)';
        else if (typeLower === 'issue') accentColor = 'var(--color-issue)';
        else if (typeLower === 'deprecation') accentColor = 'var(--color-deprecation)';
        
        card.style.setProperty('--card-accent', accentColor);
        
        card.innerHTML = `
            <div class="card-header">
                <span class="card-badge ${typeLower}">
                    <i class="${getTypeIcon(typeLower)}"></i>
                    ${update.type}
                </span>
                <span class="card-date">${update.date}</span>
            </div>
            <div class="card-body">
                ${update.description_html}
            </div>
            <div class="card-footer">
                <a href="${update.link}" target="_blank" rel="noopener" class="card-link">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Google Cloud Docs
                </a>
                <button class="btn btn-primary btn-sm tweet-card-btn" data-index="${index}">
                    <i class="fa-brands fa-x-twitter"></i> Tweet Update
                </button>
            </div>
        `;
        
        elements.feedGrid.appendChild(card);
    });
    
    // Add Click action to card tweet buttons
    elements.feedGrid.querySelectorAll('.tweet-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = btn.dataset.index;
            openComposerDrawer(state.filteredUpdates[index]);
        });
    });
}

function getTypeIcon(type) {
    switch (type) {
        case 'feature': return 'fa-solid fa-wand-magic-sparkles';
        case 'announcement': return 'fa-solid fa-bullhorn';
        case 'issue': return 'fa-solid fa-triangle-exclamation';
        case 'deprecation': return 'fa-solid fa-circle-minus';
        default: return 'fa-solid fa-database';
    }
}

// X / Twitter Composer Drawer Logic
function openComposerDrawer(update) {
    state.selectedUpdate = update;
    
    // Pre-fill header data
    elements.previewBadge.innerText = update.type;
    elements.previewBadge.className = `preview-badge ${update.type.toLowerCase()}`;
    elements.previewDate.innerText = update.date;
    elements.previewUpdateText.innerText = update.description_text;
    
    // Setup Initial Tweet text template
    resetTweetText();
    
    // Open drawer overlay
    elements.composerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock background scroll
}

function closeComposerDrawer() {
    elements.composerOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function resetTweetText() {
    if (!state.selectedUpdate) return;
    
    const update = state.selectedUpdate;
    // Build custom tweet template based on character limits
    const intro = `📢 New #BigQuery ${update.type} (${update.date}):\n\n`;
    const outro = `\n\nRead details: ${update.link}`;
    
    // Allocate space for description text (280 chars max)
    const reservedLen = intro.length + outro.length;
    const descLimit = 280 - reservedLen - 3; // 3 for "..."
    
    let text = update.description_text;
    if (text.length > descLimit) {
        text = text.substring(0, descLimit) + '...';
    }
    
    elements.tweetTextarea.value = `${intro}${text}${outro}`;
    updateTweetComposerStatus();
}

function updateTweetComposerStatus() {
    const val = elements.tweetTextarea.value;
    const len = val.length;
    
    elements.charCounter.innerText = `${len} / 280`;
    
    // Styling states based on char bounds
    elements.charCounter.className = 'char-counter';
    elements.shareTweetBtn.disabled = false;
    
    if (len > 250 && len <= 280) {
        elements.charCounter.classList.add('limit-near');
    } else if (len > 280) {
        elements.charCounter.classList.add('limit-exceeded');
        elements.shareTweetBtn.disabled = true;
    }
    
    // Live update X phone mockup render
    elements.mockupContent.innerText = val;
}

function publishTweet() {
    const tweetText = elements.tweetTextarea.value;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeComposerDrawer();
    showToast('Redirected to Twitter to publish!', false);
}

// Premium Toast Notification
function showToast(message, isError = false) {
    elements.toastMessage.innerText = message;
    
    const icon = document.getElementById('toast-icon');
    if (isError) {
        elements.toast.classList.add('error');
        icon.className = 'fa-solid fa-circle-exclamation toast-icon';
    } else {
        elements.toast.classList.remove('error');
        icon.className = 'fa-solid fa-check-circle toast-icon';
    }
    
    elements.toast.classList.add('active');
    
    setTimeout(() => {
        elements.toast.classList.remove('active');
    }, 4000);
}
