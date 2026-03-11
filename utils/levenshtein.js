// Levenshtein Distance Utilities for Web Highlight and Jump Back Later by Lmer
// Fuzzy text matching when exact matching fails

const LevenshteinUtils = {
    /**
     * Calculate Levenshtein distance between two strings
     * Returns the minimum number of edits needed to transform a into b
     */
    distance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        // Use shorter string for rows to save memory
        if (a.length > b.length) {
            [a, b] = [b, a];
        }

        const aLen = a.length;
        const bLen = b.length;

        // Only keep two rows of the matrix
        let prevRow = new Array(aLen + 1);
        let currRow = new Array(aLen + 1);

        // Initialize first row
        for (let i = 0; i <= aLen; i++) {
            prevRow[i] = i;
        }

        for (let j = 1; j <= bLen; j++) {
            currRow[0] = j;

            for (let i = 1; i <= aLen; i++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                currRow[i] = Math.min(
                    currRow[i - 1] + 1,      // insertion
                    prevRow[i] + 1,          // deletion
                    prevRow[i - 1] + cost    // substitution
                );
            }

            // Swap rows
            [prevRow, currRow] = [currRow, prevRow];
        }

        return prevRow[aLen];
    },

    /**
     * Calculate similarity ratio between two strings
     * Returns a value between 0 and 1 (1 = identical)
     */
    similarity(a, b) {
        if (!a || !b) return 0;
        if (a === b) return 1;

        const maxLen = Math.max(a.length, b.length);
        if (maxLen === 0) return 1;

        const dist = this.distance(a.toLowerCase(), b.toLowerCase());
        return 1 - (dist / maxLen);
    },

    /**
     * Find best matching text in the document
     * Returns the element and similarity score
     */
    findBestMatch(searchText, threshold = 0.8) {
        if (!searchText || searchText.length < 10) {
            return null;
        }

        const normalizedSearch = searchText.toLowerCase().trim();
        let bestMatch = null;
        let bestScore = 0;
        let bestElement = null;

        // Get all text nodes in the document
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    // Skip script and style content
                    const parent = node.parentElement;
                    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Only accept nodes with substantial text
                    if (node.textContent.trim().length > 10) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            },
            false
        );

        // For long texts, use chunked comparison
        const searchChunks = this.chunkText(normalizedSearch, 100);

        let node;
        while (node = walker.nextNode()) {
            const nodeText = node.textContent.toLowerCase().trim();

            // Quick check: does it contain any significant substring?
            const hasPartialMatch = searchChunks.some(chunk =>
                nodeText.includes(chunk.substring(0, 20))
            );

            if (!hasPartialMatch && searchText.length > 50) {
                continue;
            }

            // Calculate similarity for promising candidates
            const similarity = this.similarity(normalizedSearch, nodeText);

            if (similarity > bestScore && similarity >= threshold) {
                bestScore = similarity;
                bestMatch = node.textContent;
                bestElement = node.parentElement;
            }

            // Also check if the node contains the search text
            if (nodeText.includes(normalizedSearch.substring(0, 50))) {
                const containmentScore = normalizedSearch.length / nodeText.length;
                if (containmentScore > 0.5 && containmentScore > bestScore) {
                    bestScore = Math.min(containmentScore + 0.3, 1);
                    bestMatch = node.textContent;
                    bestElement = node.parentElement;
                }
            }
        }

        if (bestElement && bestScore >= threshold) {
            return {
                element: bestElement,
                text: bestMatch,
                score: bestScore,
                method: 'fuzzy'
            };
        }

        return null;
    },

    /**
     * Split text into chunks for comparison
     */
    chunkText(text, chunkSize) {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        return chunks;
    },

    /**
     * Find the closest paragraph to the target text
     * Used as a last resort when exact/fuzzy matching fails
     */
    findNearestParagraph(searchText) {
        const paragraphs = document.querySelectorAll('p, div, article, section, span');
        let bestElement = null;
        let bestScore = 0;

        const searchWords = searchText.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const uniqueWords = [...new Set(searchWords)].slice(0, 10);

        paragraphs.forEach(el => {
            const text = el.textContent.toLowerCase();
            let matchCount = 0;

            uniqueWords.forEach(word => {
                if (text.includes(word)) {
                    matchCount++;
                }
            });

            const score = matchCount / uniqueWords.length;
            if (score > bestScore) {
                bestScore = score;
                bestElement = el;
            }
        });

        if (bestElement && bestScore > 0.3) {
            return {
                element: bestElement,
                score: bestScore,
                method: 'nearest-paragraph'
            };
        }

        return null;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.LevenshteinUtils = LevenshteinUtils;
}
