# Web Highlight and Jump Back Later

![Web Highlight Hero](file:///C:/Users/user/.gemini/antigravity/brain/30e99614-c654-4b05-aca2-e8bb43b8cfc3/web_highlight_hero_mockup_1773192715267.png)

<p align="center">
  <a href="https://github.com/ELMER369-code/Highlight-text-in-website-then-save-and-Jump-Back-Later-when-ever-you-want/archive/refs/heads/main.zip">
    <img src="https://img.shields.io/badge/INSTALL-DOWNLOAD_ZIP-blue?style=for-the-badge&logo=download" alt="Install">
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/ELMER369-code">
    <img src="https://img.shields.io/badge/GITHUB-PROFILE-lightgrey?style=for-the-badge&logo=github" alt="GitHub">
  </a>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ELMER369-code/Highlight-text-in-website-then-save-and-Jump-Back-Later-when-ever-you-want)
[![Platform](https://img.shields.io/badge/platform-Chrome-brightgreen.svg)](https://www.google.com/chrome/)

**Never lose your place on the web again.** Save any text you highlight and jump back to the exact spot whenever you need it.

---

## 🎯 Why it exists?
We often find gems of information online—a quote, a statistic, or a specific paragraph. But traditional bookmarks only save the *page*, not the *spot*. **Web Highlight and Jump Back Later** lets you mark your exact spot so you can recall it instantly.

## 🚀 Key Features

- ✨ **Precision Savings**: Select any text and right-click to "Jump Back to This ✨".
- ⚡ **Instant Recall**: Click any highlight in your collection to jump back to the exact paragraph.
- 🏷️ **Smart Organization**: Categorize with tags (Work, Research, Personal) and add notes.
- 🔍 **Global Search**: Find that one piece of info across all the sites you've visited.
- 🔒 **Local & Secure**: Your data never leaves your computer. No accounts, no tracking.

---

## 🛠️ Tech Stack

Built with modern web standards for speed and reliability:
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Persistence**: `chrome.storage.local` API.
- **Smart Logic**: XPath Positioning + Levenshtein Fuzzy Matching (to find your text even if the page content changes slightly).

---

## 📥 Installation (Easy Method)

I've made it simple to install this extension on your machine:

1. **Download and Extract** the files from this repository.
2. **Double-click** the `setup.bat` file in the folder.
   - This will open Chrome's Extensions page and show you where the files are.
3. **Turn ON "Developer mode"** in the top-right corner of Chrome.
4. **Click "Load unpacked"** and select this folder.

*Done! You'll see the highlighter icon appear in your toolbar.*

---

## 👩‍💻 For Developers

If you want to contribute or modify the code:

```bash
# Clone the repository
git clone https://github.com/ELMER369-code/Highlight-text-in-website-then-save-and-Jump-Back-Later-when-ever-you-want.git

# Load unpacked extension from the cloned directory
```

### File Structure
- `manifest.json`: Extension core configuration.
- `background.js`: Handles context menus and storage logic.
- `content.js`: Manages text selection and page markers.
- `popup/`: Everything for the extension's user interface.

---

## 📄 License
Individual use and modifications are encouraged! Distributed under the [MIT License](LICENSE).

---
Made with ❤️ for knowledge seekers.
