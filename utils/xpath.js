// XPath Utilities for Web Highlight and Jump Back Later by Lmer
// Generate and evaluate XPath expressions

const XPathUtils = {
    /**
     * Generate a robust relative XPath for an element
     * Prioritizes IDs and unique attributes over absolute paths
     */
    generateXPath(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        // If element has an ID, use it (most reliable)
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }

        // Build path from element to root
        const parts = [];
        let current = element;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let selector = current.tagName.toLowerCase();

            // Try to use unique identifiers
            if (current.id) {
                parts.unshift(`//*[@id="${current.id}"]`);
                break;
            }

            // Use class if it helps narrow down
            if (current.className && typeof current.className === 'string') {
                const classes = current.className.trim().split(/\s+/).filter(c => c.length > 0);
                if (classes.length > 0 && classes.length <= 3) {
                    const classSelector = classes.map(c => `contains(@class,"${c}")`).join(' and ');
                    selector += `[${classSelector}]`;
                }
            }

            // Use data attributes if present
            const dataAttrs = Array.from(current.attributes)
                .filter(attr => attr.name.startsWith('data-') && attr.value.length < 50);
            if (dataAttrs.length > 0) {
                const attr = dataAttrs[0];
                selector += `[@${attr.name}="${attr.value}"]`;
            }

            // Add position if there are siblings with same tag
            const parent = current.parentNode;
            if (parent) {
                const siblings = Array.from(parent.children).filter(
                    child => child.tagName === current.tagName
                );
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    selector += `[${index}]`;
                }
            }

            parts.unshift(selector);
            current = current.parentNode;
        }

        return '//' + parts.join('/');
    },

    /**
     * Generate XPath specifically for text node containing selection
     */
    generateTextXPath(node, offset) {
        if (!node) return '';

        // Get the parent element
        const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        if (!element) return '';

        const elementXPath = this.generateXPath(element);

        // Find which text node we're in
        const textNodes = this.getTextNodes(element);
        const textNodeIndex = textNodes.indexOf(node) + 1;

        if (textNodeIndex > 0) {
            return `${elementXPath}/text()[${textNodeIndex}]`;
        }

        return elementXPath;
    },

    /**
     * Get all text nodes within an element
     */
    getTextNodes(element) {
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
    },

    /**
     * Evaluate XPath and return matching elements
     */
    evaluateXPath(xpath) {
        try {
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );

            const nodes = [];
            for (let i = 0; i < result.snapshotLength; i++) {
                nodes.push(result.snapshotItem(i));
            }

            return nodes;
        } catch (error) {
            console.error('XPath evaluation error:', error);
            return [];
        }
    },

    /**
     * Find element by XPath with fallbacks
     */
    findElement(xpath, fallbackText) {
        // Try XPath first
        const xpathResults = this.evaluateXPath(xpath);
        if (xpathResults.length > 0) {
            return { element: xpathResults[0], method: 'xpath' };
        }

        // Fallback: search for text in DOM
        if (fallbackText) {
            const element = this.findElementByText(fallbackText);
            if (element) {
                return { element, method: 'text-search' };
            }
        }

        return null;
    },

    /**
     * Find element containing specific text
     */
    findElementByText(text) {
        const normalizedSearch = text.trim().toLowerCase();
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const nodeText = node.textContent.trim().toLowerCase();
            if (nodeText.includes(normalizedSearch.substring(0, 50))) {
                return node.parentElement;
            }
        }

        return null;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.XPathUtils = XPathUtils;
}
