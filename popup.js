// Web Highlight and Jump Back Later by Lmer - Popup JavaScript
// Handles UI interactions, data display, and communication with background

(function () {
    'use strict';

    // ============================================
    // State
    // ============================================

    let highlights = [];
    let filteredHighlights = [];
    let settings = {};
    let currentEditId = null;
    let confirmCallback = null;

    // ============================================
    // DOM Elements
    // ============================================

    const elements = {
        // Tabs
        tabs: document.querySelectorAll('.tab'),
        highlightsPanel: document.getElementById('highlightsPanel'),
        settingsPanel: document.getElementById('settingsPanel'),
        settingsBtn: document.getElementById('settingsBtn'),

        // Search & Filter
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        sortSelect: document.getElementById('sortSelect'),
        tagFilter: document.getElementById('tagFilter'),

        // Highlights List
        highlightsContainer: document.getElementById('highlightsContainer'),
        loadingIndicator: document.getElementById('loadingIndicator'),
        emptyState: document.getElementById('emptyState'),
        highlightsList: document.getElementById('highlightsList'),

        // Bulk Actions
        exportBtn: document.getElementById('exportBtn'),
        importInput: document.getElementById('importInput'),
        clearAllBtn: document.getElementById('clearAllBtn'),

        // Settings
        highlightColor: document.getElementById('highlightColor'),
        colorPreview: document.getElementById('colorPreview'),
        maxHighlights: document.getElementById('maxHighlights'),
        blacklistInput: document.getElementById('blacklistInput'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),
        storageInfo: document.getElementById('storageInfo'),
        storageFill: document.getElementById('storageFill'),

        // Edit Modal
        editModal: document.getElementById('editModal'),
        editHighlightId: document.getElementById('editHighlightId'),
        editTag: document.getElementById('editTag'),
        editNote: document.getElementById('editNote'),
        editSnippetPreview: document.getElementById('editSnippetPreview'),
        closeEditModal: document.getElementById('closeEditModal'),
        cancelEditBtn: document.getElementById('cancelEditBtn'),
        saveEditBtn: document.getElementById('saveEditBtn'),

        // Confirm Modal
        confirmModal: document.getElementById('confirmModal'),
        confirmMessage: document.getElementById('confirmMessage'),
        cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
        confirmActionBtn: document.getElementById('confirmActionBtn'),

        // Toast
        toastContainer: document.getElementById('toastContainer')
    };

    // ============================================
    // Initialization
    // ============================================

    async function init() {
        await loadSettings();
        await loadHighlights();
        bindEvents();
        updateStorageInfo();
    }

    // ============================================
    // Data Loading
    // ============================================

    async function loadHighlights() {
        showLoading(true);

        try {
            const response = await sendMessage({ action: 'getHighlights' });

            if (response && response.success) {
                highlights = response.highlights || [];
                filterAndRenderHighlights();
                updateTagFilter();
            } else {
                showToast('Failed to load highlights', 'error');
            }
        } catch (error) {
            console.error('Error loading highlights:', error);
            showToast('Error loading data', 'error');
        } finally {
            showLoading(false);
        }
    }

    async function loadSettings() {
        try {
            const response = await sendMessage({ action: 'getSettings' });

            if (response && response.success) {
                settings = response.settings;
                applySettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    function applySettings() {
        elements.highlightColor.value = settings.highlightColor || '#FFEB3B';
        elements.colorPreview.textContent = settings.highlightColor || '#FFEB3B';
        elements.maxHighlights.value = settings.maxHighlights || 1000;
        elements.blacklistInput.value = (settings.blacklistedDomains || []).join('\n');
    }

    // ============================================
    // Rendering
    // ============================================

    function showLoading(show) {
        elements.loadingIndicator.style.display = show ? 'flex' : 'none';
        elements.highlightsList.style.display = show ? 'none' : 'block';
    }

    function filterAndRenderHighlights() {
        const searchTerm = elements.searchInput.value.toLowerCase().trim();
        const selectedTag = elements.tagFilter.value;
        const sortBy = elements.sortSelect.value;

        // Filter
        filteredHighlights = highlights.filter(h => {
            const matchesSearch = !searchTerm ||
                h.text.toLowerCase().includes(searchTerm) ||
                h.url.toLowerCase().includes(searchTerm) ||
                h.title.toLowerCase().includes(searchTerm) ||
                (h.tag && h.tag.toLowerCase().includes(searchTerm)) ||
                (h.note && h.note.toLowerCase().includes(searchTerm));

            const matchesTag = !selectedTag || h.tag === selectedTag;

            return matchesSearch && matchesTag;
        });

        // Sort
        filteredHighlights.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.timestamp) - new Date(a.timestamp);
                case 'date-asc':
                    return new Date(a.timestamp) - new Date(b.timestamp);
                case 'tag':
                    return (a.tag || '').localeCompare(b.tag || '');
                case 'site':
                    return getDomain(a.url).localeCompare(getDomain(b.url));
                default:
                    return 0;
            }
        });

        renderHighlights();
    }

    function renderHighlights() {
        if (filteredHighlights.length === 0) {
            elements.highlightsList.innerHTML = '';
            elements.emptyState.style.display = 'flex';
            return;
        }

        elements.emptyState.style.display = 'none';
        elements.highlightsList.innerHTML = filteredHighlights.map(h => createHighlightCard(h)).join('');

        // Bind card events
        elements.highlightsList.querySelectorAll('.highlight-card').forEach(card => {
            const id = card.dataset.id;

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn')) {
                    jumpBackToHighlight(id);
                }
            });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.target.closest('.action-btn')) {
                    jumpBackToHighlight(id);
                }
            });

            card.querySelector('.edit-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(id);
            });

            card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                confirmDelete(id);
            });
        });
    }

    function createHighlightCard(highlight) {
        const domain = getDomain(highlight.url);
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        const timeAgo = formatTimeAgo(highlight.timestamp);
        const tagClass = getTagClass(highlight.tag);

        // Escape HTML in user content
        const safeSnippet = escapeHtml(highlight.snippet || highlight.text.substring(0, 100));
        const safeTitle = escapeHtml(highlight.title || domain);
        const safeTag = escapeHtml(highlight.tag || 'Uncategorized');

        return `
      <li class="highlight-card" data-id="${highlight.id}" tabindex="0" role="button" aria-label="Jump back to ${safeTitle}">
        <div class="highlight-header">
          <img class="highlight-favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">
          <span class="highlight-title" title="${safeTitle}">${safeTitle}</span>
        </div>
        <p class="highlight-snippet">"${safeSnippet}${highlight.text.length > 100 ? '...' : ''}"</p>
        <div class="highlight-footer">
          <div class="highlight-meta">
            <span class="highlight-tag ${tagClass}">${safeTag}</span>
            <span>${timeAgo}</span>
          </div>
          <div class="highlight-actions">
            <button class="action-btn edit-btn" title="Edit" aria-label="Edit highlight">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="action-btn delete-btn" title="Delete" aria-label="Delete highlight">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </li>
    `;
    }

    function updateTagFilter() {
        const tags = [...new Set(highlights.map(h => h.tag).filter(Boolean))];
        const options = ['<option value="">All Tags</option>'];

        tags.forEach(tag => {
            options.push(`<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`);
        });

        elements.tagFilter.innerHTML = options.join('');
    }

    // ============================================
    // Actions
    // ============================================

    async function jumpBackToHighlight(id) {
        const highlight = highlights.find(h => h.id === id);
        if (!highlight) return;

        try {
            await sendMessage({ action: 'teleport', highlight });
            showToast('Jumping back...', 'success');
        } catch (error) {
            console.error('Teleport error:', error);
            showToast('Failed to jump back', 'error');
        }
    }

    function openEditModal(id) {
        const highlight = highlights.find(h => h.id === id);
        if (!highlight) return;

        currentEditId = id;
        elements.editHighlightId.value = id;
        elements.editTag.value = highlight.tag || 'Uncategorized';
        elements.editNote.value = highlight.note || '';
        elements.editSnippetPreview.textContent = `"${highlight.snippet || highlight.text.substring(0, 100)}..."`;

        elements.editModal.hidden = false;
        elements.editTag.focus();
    }

    function closeEditModalFn() {
        elements.editModal.hidden = true;
        currentEditId = null;
    }

    async function saveEdit() {
        if (!currentEditId) return;

        const updates = {
            tag: elements.editTag.value,
            note: elements.editNote.value
        };

        try {
            const response = await sendMessage({
                action: 'updateHighlight',
                id: currentEditId,
                updates
            });

            if (response && response.success) {
                const index = highlights.findIndex(h => h.id === currentEditId);
                if (index !== -1) {
                    highlights[index] = { ...highlights[index], ...updates };
                }
                filterAndRenderHighlights();
                updateTagFilter();
                closeEditModalFn();
                showToast('Highlight updated', 'success');
            } else {
                showToast('Failed to update', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            showToast('Error updating highlight', 'error');
        }
    }

    function confirmDelete(id) {
        const highlight = highlights.find(h => h.id === id);
        if (!highlight) return;

        elements.confirmMessage.textContent = `Delete this highlight from "${getDomain(highlight.url)}"?`;
        confirmCallback = async () => {
            await deleteHighlight(id);
        };
        elements.confirmModal.hidden = false;
    }

    async function deleteHighlight(id) {
        try {
            const response = await sendMessage({ action: 'deleteHighlight', id });

            if (response && response.success) {
                highlights = highlights.filter(h => h.id !== id);
                filterAndRenderHighlights();
                updateTagFilter();
                updateStorageInfo();
                showToast('Highlight deleted', 'success');
            } else {
                showToast('Failed to delete', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Error deleting highlight', 'error');
        }
    }

    // ============================================
    // Bulk Actions
    // ============================================

    function exportHighlights() {
        if (highlights.length === 0) {
            showToast('No highlights to export', 'warning');
            return;
        }

        const data = JSON.stringify(highlights, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `highlight-teleport-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        showToast(`Exported ${highlights.length} highlights`, 'success');
    }

    function handleImport(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                if (!Array.isArray(imported)) {
                    throw new Error('Invalid format');
                }

                const response = await sendMessage({
                    action: 'importHighlights',
                    highlights: imported
                });

                if (response && response.success) {
                    await loadHighlights();
                    updateStorageInfo();
                    showToast(`Imported ${response.imported} highlights`, 'success');
                } else {
                    showToast(response?.error || 'Import failed', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                showToast('Invalid JSON file', 'error');
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    function confirmClearAll() {
        if (highlights.length === 0) {
            showToast('No highlights to clear', 'warning');
            return;
        }

        elements.confirmMessage.textContent = `Delete all ${highlights.length} highlights? This cannot be undone.`;
        confirmCallback = async () => {
            await clearAllHighlights();
        };
        elements.confirmModal.hidden = false;
    }

    async function clearAllHighlights() {
        try {
            const response = await sendMessage({ action: 'clearAllHighlights' });

            if (response && response.success) {
                highlights = [];
                filterAndRenderHighlights();
                updateTagFilter();
                updateStorageInfo();
                showToast('All highlights cleared', 'success');
            } else {
                showToast('Failed to clear highlights', 'error');
            }
        } catch (error) {
            console.error('Clear error:', error);
            showToast('Error clearing highlights', 'error');
        }
    }

    // ============================================
    // Settings
    // ============================================

    async function saveSettings() {
        const newSettings = {
            highlightColor: elements.highlightColor.value,
            maxHighlights: Math.min(1000, Math.max(10, parseInt(elements.maxHighlights.value) || 1000)),
            blacklistedDomains: elements.blacklistInput.value
                .split('\n')
                .map(d => d.trim().toLowerCase())
                .filter(d => d.length > 0)
        };

        try {
            const response = await sendMessage({
                action: 'updateSettings',
                settings: newSettings
            });

            if (response && response.success) {
                settings = response.settings;
                applySettings();
                showToast('Settings saved', 'success');
            } else {
                showToast('Failed to save settings', 'error');
            }
        } catch (error) {
            console.error('Settings error:', error);
            showToast('Error saving settings', 'error');
        }
    }

    async function updateStorageInfo() {
        const count = highlights.length;
        const max = settings.maxHighlights || 1000;
        const percent = Math.round((count / max) * 100);

        elements.storageInfo.textContent = `${count} / ${max} highlights (${percent}%)`;
        elements.storageFill.style.width = `${percent}%`;
    }

    // ============================================
    // Event Binding
    // ============================================

    function bindEvents() {
        // Tabs
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        elements.settingsBtn.addEventListener('click', () => switchTab('settings'));

        // Search
        let searchTimeout;
        elements.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterAndRenderHighlights();
                elements.clearSearchBtn.style.display = elements.searchInput.value ? 'flex' : 'none';
            }, 200);
        });

        elements.clearSearchBtn.addEventListener('click', () => {
            elements.searchInput.value = '';
            elements.clearSearchBtn.style.display = 'none';
            filterAndRenderHighlights();
        });

        // Sort & Filter
        elements.sortSelect.addEventListener('change', filterAndRenderHighlights);
        elements.tagFilter.addEventListener('change', filterAndRenderHighlights);

        // Bulk Actions
        elements.exportBtn.addEventListener('click', exportHighlights);
        elements.importInput.addEventListener('change', handleImport);
        elements.clearAllBtn.addEventListener('click', confirmClearAll);

        // Settings
        elements.highlightColor.addEventListener('input', () => {
            elements.colorPreview.textContent = elements.highlightColor.value;
        });
        elements.saveSettingsBtn.addEventListener('click', saveSettings);

        // Edit Modal
        elements.closeEditModal.addEventListener('click', closeEditModalFn);
        elements.cancelEditBtn.addEventListener('click', closeEditModalFn);
        elements.saveEditBtn.addEventListener('click', saveEdit);
        elements.editModal.addEventListener('click', (e) => {
            if (e.target === elements.editModal) closeEditModalFn();
        });

        // Confirm Modal
        elements.cancelConfirmBtn.addEventListener('click', () => {
            elements.confirmModal.hidden = true;
            confirmCallback = null;
        });
        elements.confirmActionBtn.addEventListener('click', async () => {
            elements.confirmModal.hidden = true;
            if (confirmCallback) {
                await confirmCallback();
                confirmCallback = null;
            }
        });

        // Escape to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!elements.editModal.hidden) closeEditModalFn();
                if (!elements.confirmModal.hidden) {
                    elements.confirmModal.hidden = true;
                    confirmCallback = null;
                }
            }
        });
    }

    function switchTab(tabName) {
        elements.tabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });

        elements.highlightsPanel.classList.toggle('active', tabName === 'highlights');
        elements.highlightsPanel.hidden = tabName !== 'highlights';
        elements.settingsPanel.classList.toggle('active', tabName === 'settings');
        elements.settingsPanel.hidden = tabName !== 'settings';
    }

    // ============================================
    // Utilities
    // ============================================

    function sendMessage(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, (response) => {
                resolve(response);
            });
        });
    }

    function getDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    function formatTimeAgo(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function getTagClass(tag) {
        const tagMap = {
            'Work': 'tag-work',
            'Personal': 'tag-personal',
            'Research': 'tag-research',
            'Important': 'tag-important',
            'Read Later': 'tag-later'
        };
        return tagMap[tag] || '';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        toast.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(message)}</span>`;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================
    // Initialize
    // ============================================

    document.addEventListener('DOMContentLoaded', init);

})();
