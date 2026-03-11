# Highlight Teleport

A Chrome extension that lets you save text highlights from any webpage and "teleport" back to them instantly. Never lose your research context again.

## Features

- 🎯 **Save Highlights**: Select text on any page and save with right-click or `Ctrl+Shift+H`
- 🚀 **Teleport Back**: Click any saved highlight to reopen the page with text highlighted and scrolled into view
- 🔍 **Smart Search**: Filter highlights by text, URL, or tags
- 🏷️ **Organize with Tags**: Categorize highlights as Work, Personal, Research, etc.
- 📝 **Add Notes**: Attach personal notes to any highlight
- 📦 **Import/Export**: Backup your highlights as JSON
- 🎨 **Customizable**: Choose your highlight color and set domain blacklists
- 🔒 **Privacy-First**: All data stored locally, no external servers

## Installation

### From Chrome Web Store (Coming Soon)
*Not yet available*

### Manual Installation (Developer Mode)

1. **Download or Clone** this repository to your computer

2. **Open Chrome Extensions**
   - Type `chrome://extensions` in the address bar
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the `teleport-note` folder
   - Select the folder and click "Open"

5. **Verify Installation**
   - You should see "Highlight Teleport" in your extensions list
   - The highlighter icon should appear in your toolbar

## Usage

### Saving a Highlight

1. **Select any text** on a webpage
2. Either:
   - **Right-click** → Select "Save Highlight ✨"
   - **Press** `Ctrl+Shift+H` (or `Cmd+Shift+H` on Mac)
3. A notification confirms your highlight is saved

### Teleporting to a Highlight

1. **Click** the Highlight Teleport icon in your toolbar
2. **Find** your highlight using search or scrolling
3. **Click** on the highlight card
4. The page opens in a new tab with your text highlighted and scrolled into view

### Managing Highlights

- **Edit**: Click the pencil icon to change tag or add notes
- **Delete**: Click the trash icon to remove a highlight
- **Export**: Click "Export" to download all highlights as JSON
- **Import**: Click "Import" to restore highlights from a JSON backup
- **Clear All**: Click "Clear All" to delete all highlights (with confirmation)

### Settings

Access settings by clicking the "Settings" tab:

- **Highlight Color**: Choose the color for highlighted text
- **Maximum Highlights**: Set storage limit (default 1000)
- **Blacklisted Domains**: Add domains where highlighting is disabled

## File Structure

```
teleport-note/
├── manifest.json        # Extension configuration
├── background.js        # Service worker (context menus, storage)
├── content.js          # Text selection and highlighting
├── content.css         # Highlight styles for pages
├── popup.html          # Extension popup UI
├── popup.css           # Popup styling
├── popup.js            # Popup interactions
├── utils/
│   ├── storage.js      # Storage utilities
│   ├── xpath.js        # XPath generation/evaluation
│   └── levenshtein.js  # Fuzzy text matching
└── icons/
    ├── icon.svg        # Vector source
    ├── icon-16.png     # Toolbar icon
    ├── icon-32.png     # Various UI sizes
    ├── icon-48.png     # Extensions page
    └── icon-128.png    # Chrome Web Store
```

## How It Works

1. **Saving**: When you save a highlight, the extension captures:
   - The selected text
   - The page URL and title
   - An XPath to locate the text
   - A timestamp

2. **Teleporting**: When you click a highlight:
   - Opens the URL in a new tab
   - Uses XPath to find the exact element
   - If XPath fails, uses fuzzy text matching
   - Highlights and scrolls to the text

3. **Fallback Strategy**:
   - XPath exact match (fastest)
   - DOM text search (exact text)
   - Levenshtein fuzzy match (>70% similarity)
   - Nearest paragraph match (last resort)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+H` | Save selected text as highlight |
| `Escape` | Close modal dialogs |

## Permissions Explained

- **activeTab**: Access current tab to save highlights
- **storage**: Store highlights locally
- **contextMenus**: Add "Save Highlight" to right-click menu
- **notifications**: Show success/error notifications
- **scripting**: Inject highlight scripts into pages

## Privacy

- ✅ All data stored locally in Chrome storage
- ✅ No external servers or APIs
- ✅ No tracking or analytics
- ✅ No AI integration
- ✅ Source code is fully transparent

## Troubleshooting

**Highlight not found when teleporting?**
- Page content may have changed since saving
- The extension will show a notification and scroll to approximate location

**Extension not working on a site?**
- Some sites (like `chrome://` pages) don't allow extensions
- Check if the domain is in your blacklist

**Storage full?**
- Delete old highlights or increase the limit in settings
- Maximum supported: 1000 highlights

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/highlight-teleport.git

# Load extension in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the project folder
```

## License

MIT License - Feel free to use, modify, and distribute.

---

Made with ❤️ for researchers, readers, and knowledge seekers.
