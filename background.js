// Web Highlight and Jump Back Later - Background Service Worker
// Handles context menus, keyboard shortcuts, and message passing

// ============================================
// Context Menu Setup
// ============================================

chrome.runtime.onInstalled.addListener(() => {
  // Create simple context menu item
  chrome.contextMenus.create({
    id: 'save-highlight',
    title: "Jump Back to This ✨",
    contexts: ['selection']
  });

  // Initialize storage with defaults if first install
  chrome.storage.local.get(['highlights', 'settings'], (result) => {
    if (!result.highlights) {
      chrome.storage.local.set({ highlights: [] });
    }
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          highlightColor: '#FFEB3B',
          maxHighlights: 1000,
          blacklistedDomains: [],
          autoSaveOnSelect: false
        }
      });
    }
  });

  // Show onboarding notification
  chrome.notifications.create('onboarding', {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: 'Web Highlight Installed!',
    message: 'Select text and press Ctrl+Shift+H or right-click to jump back later.',
    priority: 2
  });
});

// ============================================
// Context Menu Click Handler
// ============================================

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-highlight') {
    try {
      // Check blacklist
      const isBlacklisted = await checkBlacklist(tab.url);
      if (isBlacklisted) {
        showNotification('Domain Blacklisted', 'This domain is in your blacklist. Highlight not saved.');
        return;
      }

      // Get selection data from content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectionData' });

      if (response && response.success) {
        await saveHighlight(response.data, tab);
        showNotification('Highlight Saved!', `"${response.data.snippet}..."`);
      } else {
        showNotification('Error', response?.error || 'Could not capture selection.');
      }
    } catch (error) {
      console.error('Error saving highlight:', error);
      showNotification('Error', 'Failed to save highlight. Please try again.');
    }
  }
});

// ============================================
// Keyboard Shortcut Handler
// ============================================

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-highlight') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        showNotification('Error', 'No active tab found.');
        return;
      }

      // Check blacklist
      const isBlacklisted = await checkBlacklist(tab.url);
      if (isBlacklisted) {
        showNotification('Domain Blacklisted', 'This domain is in your blacklist.');
        return;
      }

      // Get selection data from content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectionData' });

      if (response && response.success) {
        await saveHighlight(response.data, tab);
        showNotification('Highlight Saved!', `"${response.data.snippet}..."`);
      } else {
        showNotification('No Selection', 'Please select some text first.');
      }
    } catch (error) {
      console.error('Error with keyboard shortcut:', error);
      showNotification('Error', 'Failed to save. Is this a valid webpage?');
    }
  }
});

// ============================================
// Message Handlers
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'teleport') {
    handleJumpBack(request.highlight);
    sendResponse({ success: true });
  } else if (request.action === 'getHighlights') {
    getHighlights().then(sendResponse);
    return true;
  } else if (request.action === 'saveHighlight') {
    saveHighlightFromPopup(request.data).then(sendResponse);
    return true;
  } else if (request.action === 'deleteHighlight') {
    deleteHighlight(request.id).then(sendResponse);
    return true;
  } else if (request.action === 'updateHighlight') {
    updateHighlight(request.id, request.updates).then(sendResponse);
    return true;
  } else if (request.action === 'clearAllHighlights') {
    clearAllHighlights().then(sendResponse);
    return true;
  } else if (request.action === 'importHighlights') {
    importHighlights(request.highlights).then(sendResponse);
    return true;
  } else if (request.action === 'getSettings') {
    getSettings().then(sendResponse);
    return true;
  } else if (request.action === 'updateSettings') {
    updateSettings(request.settings).then(sendResponse);
    return true;
  }
});

// ============================================
// Jump Back Handler
// ============================================

async function handleJumpBack(highlight) {
  try {
    // Open URL in new tab
    const tab = await chrome.tabs.create({ url: highlight.url });

    // Wait for tab to load, then inject highlight
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);

        // Send highlight data to content script
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'highlightText',
            data: highlight
          }).catch(err => {
            console.error('Error sending highlight message:', err);
          });
        }, 500);
      }
    });
  } catch (error) {
    console.error('Teleport error:', error);
    showNotification('Page Not Found', `Could not open: ${highlight.url}\n\nSaved text: "${highlight.snippet}..."`);
  }
}

// ============================================
// Storage Functions
// ============================================

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

async function saveHighlight(data, tab) {
  const result = await chrome.storage.local.get(['highlights', 'settings']);
  let highlights = result.highlights || [];
  const settings = result.settings || { maxHighlights: 1000 };

  // Check storage limit
  if (highlights.length >= settings.maxHighlights) {
    showNotification('Storage Full', `Maximum ${settings.maxHighlights} highlights reached. Delete some to add new ones.`);
    throw new Error('Storage limit reached');
  }

  // Check for duplicates (same URL + text hash)
  const textHash = hashText(data.text);
  const isDuplicate = highlights.some(h => h.url === tab.url && hashText(h.text) === textHash);

  if (isDuplicate) {
    showNotification('Duplicate', 'This highlight already exists.');
    return;
  }

  // Create highlight object
  const highlight = {
    id: generateUUID(),
    url: tab.url,
    title: tab.title || 'Untitled',
    text: data.text,
    snippet: data.text.substring(0, 100),
    xpath: data.xpath,
    timestamp: new Date().toISOString(),
    tag: 'Uncategorized',
    note: ''
  };

  highlights.unshift(highlight);
  await chrome.storage.local.set({ highlights });

  return highlight;
}

async function saveHighlightFromPopup(data) {
  try {
    const result = await chrome.storage.local.get(['highlights', 'settings']);
    let highlights = result.highlights || [];
    const settings = result.settings || { maxHighlights: 1000 };

    if (highlights.length >= settings.maxHighlights) {
      return { success: false, error: 'Storage limit reached' };
    }

    const highlight = {
      id: generateUUID(),
      ...data,
      timestamp: new Date().toISOString()
    };

    highlights.unshift(highlight);
    await chrome.storage.local.set({ highlights });

    return { success: true, highlight };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getHighlights() {
  const result = await chrome.storage.local.get(['highlights']);
  return { success: true, highlights: result.highlights || [] };
}

async function deleteHighlight(id) {
  try {
    const result = await chrome.storage.local.get(['highlights']);
    let highlights = result.highlights || [];
    highlights = highlights.filter(h => h.id !== id);
    await chrome.storage.local.set({ highlights });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateHighlight(id, updates) {
  try {
    const result = await chrome.storage.local.get(['highlights']);
    let highlights = result.highlights || [];
    const index = highlights.findIndex(h => h.id === id);

    if (index === -1) {
      return { success: false, error: 'Highlight not found' };
    }

    // Sanitize inputs
    if (updates.note) {
      updates.note = sanitizeInput(updates.note);
    }
    if (updates.tag) {
      updates.tag = sanitizeInput(updates.tag);
    }

    highlights[index] = { ...highlights[index], ...updates };
    await chrome.storage.local.set({ highlights });

    return { success: true, highlight: highlights[index] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function clearAllHighlights() {
  try {
    await chrome.storage.local.set({ highlights: [] });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function importHighlights(importedHighlights) {
  try {
    const result = await chrome.storage.local.get(['highlights', 'settings']);
    let highlights = result.highlights || [];
    const settings = result.settings || { maxHighlights: 1000 };

    // Validate and sanitize imported data
    const validHighlights = importedHighlights.filter(h => {
      return h.url && h.text && typeof h.url === 'string' && typeof h.text === 'string';
    }).map(h => ({
      id: h.id || generateUUID(),
      url: h.url,
      title: sanitizeInput(h.title || 'Imported'),
      text: h.text,
      snippet: h.text.substring(0, 100),
      xpath: h.xpath || '',
      timestamp: h.timestamp || new Date().toISOString(),
      tag: sanitizeInput(h.tag || 'Imported'),
      note: sanitizeInput(h.note || '')
    }));

    // Merge and deduplicate
    const existingHashes = new Set(highlights.map(h => h.url + hashText(h.text)));
    const newHighlights = validHighlights.filter(h => !existingHashes.has(h.url + hashText(h.text)));

    // Check limit
    const totalCount = highlights.length + newHighlights.length;
    if (totalCount > settings.maxHighlights) {
      const canAdd = settings.maxHighlights - highlights.length;
      highlights = [...newHighlights.slice(0, canAdd), ...highlights];
    } else {
      highlights = [...newHighlights, ...highlights];
    }

    await chrome.storage.local.set({ highlights });
    return { success: true, imported: newHighlights.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// Settings Functions
// ============================================

async function getSettings() {
  const result = await chrome.storage.local.get(['settings']);
  return {
    success: true,
    settings: result.settings || {
      highlightColor: '#FFEB3B',
      maxHighlights: 1000,
      blacklistedDomains: [],
      autoSaveOnSelect: false
    }
  };
}

async function updateSettings(newSettings) {
  try {
    const result = await chrome.storage.local.get(['settings']);
    const settings = { ...result.settings, ...newSettings };
    await chrome.storage.local.set({ settings });
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkBlacklist(url) {
  try {
    const domain = new URL(url).hostname;
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || { blacklistedDomains: [] };
    return settings.blacklistedDomains.some(d => domain.includes(d));
  } catch {
    return false;
  }
}

// ============================================
// Utility Functions
// ============================================

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .substring(0, 1000);
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: title,
    message: message.substring(0, 200),
    priority: 1
  });
}
