// Storage Utilities for Web Highlight and Jump Back Later by Lmer
// Chrome Storage wrapper with validation

const StorageUtils = {
    // Get all highlights
    async getHighlights() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['highlights'], (result) => {
                resolve(result.highlights || []);
            });
        });
    },

    // Save highlights array
    async saveHighlights(highlights) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ highlights }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(true);
                }
            });
        });
    },

    // Get settings
    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                resolve(result.settings || {
                    highlightColor: '#FFEB3B',
                    maxHighlights: 1000,
                    blacklistedDomains: [],
                    autoSaveOnSelect: false
                });
            });
        });
    },

    // Validate highlight object
    validateHighlight(highlight) {
        const required = ['url', 'text'];
        for (const field of required) {
            if (!highlight[field] || typeof highlight[field] !== 'string') {
                return false;
            }
        }

        // Validate URL format
        try {
            new URL(highlight.url);
        } catch {
            return false;
        }

        return true;
    },

    // Hash text for deduplication
    hashText(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
};

// Make available globally for content scripts
if (typeof window !== 'undefined') {
    window.StorageUtils = StorageUtils;
}
