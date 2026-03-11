// Highlight Teleport - Content Script
// Handles text selection, XPath capture, and highlight injection

(function () {
    'use strict';

    // Prevent multiple injections
    if (window.__highlightTeleportLoaded) return;
    window.__highlightTeleportLoaded = true;

    // ============================================
    // Message Handler
    // ============================================

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            switch (request.action) {
                case 'getSelectionData':
                    const data = getSelectionData();
                    sendResponse(data);
                    break;

                case 'highlightText':
                    highlightAndScroll(request.data);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Content script error:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    });

    // ============================================
    // Selection Capture
    // ============================================

    function getSelectionData() {
        const selection = window.getSelection();

        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
            return { success: false, error: 'No text selected' };
        }

        const selectedText = selection.toString().trim();

        // Get selection range
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;

        // Generate XPath for the selected element
        let xpath = '';
        try {
            if (typeof XPathUtils !== 'undefined') {
                xpath = XPathUtils.generateTextXPath(startContainer, startOffset);
            }
        } catch (e) {
            console.warn('XPath generation failed:', e);
        }

        return {
            success: true,
            data: {
                text: selectedText,
                snippet: selectedText.substring(0, 100),
                xpath: xpath,
                startOffset: startOffset
            }
        };
    }

    // ============================================
    // Highlight and Scroll
    // ============================================

    async function highlightAndScroll(highlightData) {
        const { text, xpath } = highlightData;

        // Get highlight color from settings
        let highlightColor = '#FFEB3B';
        try {
            const settings = await getSettings();
            highlightColor = settings.highlightColor || highlightColor;
        } catch (e) {
            console.warn('Could not get settings:', e);
        }

        let targetElement = null;
        let method = 'none';

        // Strategy 1: Try XPath first
        if (xpath && typeof XPathUtils !== 'undefined') {
            try {
                const result = XPathUtils.findElement(xpath, text);
                if (result) {
                    targetElement = result.element;
                    method = result.method;
                }
            } catch (e) {
                console.warn('XPath lookup failed:', e);
            }
        }

        // Strategy 2: Try exact text search
        if (!targetElement) {
            targetElement = findExactText(text);
            if (targetElement) {
                method = 'exact-text';
            }
        }

        // Strategy 3: Try fuzzy matching
        if (!targetElement && typeof LevenshteinUtils !== 'undefined') {
            const fuzzyResult = LevenshteinUtils.findBestMatch(text, 0.7);
            if (fuzzyResult) {
                targetElement = fuzzyResult.element;
                method = 'fuzzy';

                // Notify user about approximate match
                showContentNotification('Content may have changed. Showing approximate location.', 'warning');
            }
        }

        // Strategy 4: Find nearest paragraph
        if (!targetElement && typeof LevenshteinUtils !== 'undefined') {
            const nearestResult = LevenshteinUtils.findNearestParagraph(text);
            if (nearestResult) {
                targetElement = nearestResult.element;
                method = 'nearest';

                showContentNotification('Exact text not found. Showing related content.', 'warning');
            }
        }

        if (targetElement) {
            // Highlight the text
            highlightElement(targetElement, text, highlightColor);

            // Scroll into view
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });

            // Add subtle animation to draw attention
            pulseElement(targetElement);
        } else {
            showContentNotification('Could not find the highlighted text on this page.', 'error');
        }
    }

    // ============================================
    // Text Search Functions
    // ============================================

    function findExactText(searchText) {
        const normalizedSearch = searchText.toLowerCase().trim();
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const nodeText = node.textContent.toLowerCase();
            if (nodeText.includes(normalizedSearch)) {
                return node.parentElement;
            }
        }

        return null;
    }

    // ============================================
    // Highlighting Functions
    // ============================================

    function highlightElement(element, text, color) {
        // Remove any existing highlights first
        removeExistingHighlights();

        // Try to highlight the specific text within the element
        const textNodes = getTextNodes(element);
        const normalizedSearch = text.toLowerCase();
        let highlighted = false;

        for (const textNode of textNodes) {
            const nodeText = textNode.textContent;
            const lowerText = nodeText.toLowerCase();
            const index = lowerText.indexOf(normalizedSearch);

            if (index !== -1) {
                // Create highlight wrapper
                const range = document.createRange();
                const endIndex = Math.min(index + text.length, nodeText.length);

                range.setStart(textNode, index);
                range.setEnd(textNode, endIndex);

                const mark = document.createElement('mark');
                mark.className = 'highlight-teleport-mark';
                mark.style.cssText = `
          background-color: ${color} !important;
          color: #000 !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        `;

                try {
                    range.surroundContents(mark);
                    highlighted = true;
                    break;
                } catch (e) {
                    // If surroundContents fails (e.g., across elements), 
                    // fall back to highlighting the whole element
                    console.warn('Could not wrap exact text:', e);
                }
            }
        }

        // Fallback: highlight the whole element
        if (!highlighted) {
            element.classList.add('highlight-teleport-element');
            element.style.cssText += `
        background-color: ${color} !important;
        outline: 3px solid ${color} !important;
        outline-offset: 2px !important;
      `;
        }
    }

    function getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim()) {
                textNodes.push(node);
            }
        }

        return textNodes;
    }

    function removeExistingHighlights() {
        // Remove mark elements
        document.querySelectorAll('.highlight-teleport-mark').forEach(el => {
            const parent = el.parentNode;
            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
        });

        // Remove highlighted elements
        document.querySelectorAll('.highlight-teleport-element').forEach(el => {
            el.classList.remove('highlight-teleport-element');
            el.style.backgroundColor = '';
            el.style.outline = '';
            el.style.outlineOffset = '';
        });
    }

    function pulseElement(element) {
        element.style.transition = 'transform 0.3s ease';
        element.style.transform = 'scale(1.02)';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 300);
    }

    // ============================================
    // Notification
    // ============================================

    function showContentNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.getElementById('highlight-teleport-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.id = 'highlight-teleport-notification';

        const bgColors = {
            info: '#2196F3',
            warning: '#FF9800',
            error: '#f44336',
            success: '#4CAF50'
        };

        notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: ${bgColors[type] || bgColors.info} !important;
      color: white !important;
      padding: 16px 24px !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      max-width: 350px !important;
      animation: slideIn 0.3s ease !important;
    `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // ============================================
    // Settings Helper
    // ============================================

    function getSettings() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
                if (response && response.success) {
                    resolve(response.settings);
                } else {
                    resolve({
                        highlightColor: '#FFEB3B',
                        maxHighlights: 1000,
                        blacklistedDomains: [],
                        autoSaveOnSelect: false
                    });
                }
            });
        });
    }

    // ============================================
    // Inject Styles
    // ============================================

    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
    document.head.appendChild(style);

})();
