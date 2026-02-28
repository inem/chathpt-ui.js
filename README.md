# chatgpt-ui.js

A clean DOM manipulation library for building Chrome extensions that extend the ChatGPT interface.

Designed for content scripts running in `MAIN` world — no ES modules, no build step, just drop it in.

## API

### Status & Notifications
- `ChatGPTUI.setInlineStatus(text)` — status text in header, after model selector
- `ChatGPTUI.updateInlineStatus(text)` — update existing status
- `ChatGPTUI.hideInlineStatus()`
- `ChatGPTUI.showToast(text, options)` — floating notification
- `ChatGPTUI.hideToast()`

### Buttons & Actions
- `ChatGPTUI.addMessageAction(messageEl, options)` — button on individual messages
- `ChatGPTUI.addActionToAllMessages(options)` — add to all existing messages
- `ChatGPTUI.addHeaderButton(options)` — button in header left area
- `ChatGPTUI.addTopHeaderButton(options)` — button next to Share button
- `ChatGPTUI.addTopHeaderText(text, options)` — text in header

### Sidebar
- `ChatGPTUI.getSidebarChats()` — list sidebar chat items
- `ChatGPTUI.filterSidebarChats(query)` — filter by text
- `ChatGPTUI.showAllSidebarChats()` — remove filter
- `ChatGPTUI.addChatBadge(chatEl, count)` — badge on sidebar items

### Observers
- `ChatGPTUI.onNewMessage(callback)` — fires when new messages appear
- `ChatGPTUI.onSidebarChange(callback)` — fires on sidebar DOM changes

### Utilities
- `ChatGPTUI.getConversationTitle()` — current chat title
- `ChatGPTUI.getConversationUrl()` — current chat URL
- `ChatGPTUI.setFooterText(text)` — text below conversation
- `ChatGPTUI.clearFooterText()`

## Usage

In your `manifest.json`:

```json
{
  "content_scripts": [{
    "matches": ["https://chatgpt.com/*"],
    "js": ["chatgpt-ui.js", "your-content-script.js"],
    "run_at": "document_start",
    "world": "MAIN"
  }]
}
```

Then in your content script:

```js
ChatGPTUI.setInlineStatus('Loading...');
ChatGPTUI.addTopHeaderButton({
  text: 'My Button',
  onClick: () => console.log('clicked')
});
```

