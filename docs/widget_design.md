# Jotil Chat: Widget Design Specification

**Version:** 2.0  
**Last Updated:** February 2026  
**Target:** Embeddable chat widget for client websites

---

## 1. Widget Embed and Initialization

### Embed Script

Clients install the widget by adding a single script tag to their website:

```html
<script
  src="https://chat.jotil.com/widget.js"
  data-client-id="CLIENT_UUID"
  async
></script>
```

### Loading Sequence

1. The script loads asynchronously. It must not block the host page's rendering or affect its Lighthouse score.
2. On load, the script reads the `data-client-id` attribute from its own script tag.
3. The script creates a `<div>` at the end of `<body>` and attaches a Shadow DOM to it. All widget markup and styles live inside this shadow root.
4. The script fetches widget configuration from `/api/config?clientId=CLIENT_UUID`. This returns the bot name, welcome message, primary color, border radius, and position.
5. The script injects all widget CSS into the shadow root (not the document head).
6. The script renders the Preact app inside the shadow root using the fetched configuration.
7. The widget starts in the collapsed state (floating bubble button).
8. If the visitor has a previous conversation (checked via localStorage visitor ID and a fetch to `/api/conversations`), the message history is loaded into memory but not displayed until the widget is opened.

### Shadow DOM Isolation

The widget uses Shadow DOM to prevent style conflicts in both directions. Host page styles do not affect the widget. Widget styles do not affect the host page.

Key implications for development:

- All CSS must be injected into the shadow root via a `<style>` tag or constructable stylesheet. No external CSS files, no document-level style injection.
- Shadow DOM does not inherit fonts from the host page. The widget must declare its own font stack in its styles.
- `document.querySelector` from the host page cannot reach into the widget. The widget's internal DOM is fully encapsulated.
- Event listeners inside the widget do not bubble out to the host page unless explicitly composed.

### Development and Testing Mode

When running locally (`npm run widget:dev`), the widget dev server automatically loads with:

- Client ID: `00000000-0000-0000-0000-000000000001` (seed test client)
- Domain validation: `localhost` is accepted
---

## 2. Widget States

The widget has five distinct states. Every state must feel polished.

### 2.1 Collapsed (Default)

- Floating circular button, 56px diameter (48px on mobile below 640px)
- Positioned bottom-right or bottom-left (configurable via client config, default bottom-right)
- 24px margin from viewport edges
- Chat icon (message bubble SVG) centered
- Background: `--jc-primary` (primaryColor from config)
- Icon color: `--jc-on-primary` (white or black, auto-contrast based on primaryColor brightness)
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.15)`
- Hover: scale to 1.05 with 150ms ease transition
- Optional: unread badge (red dot, 12px diameter, top-right of button) when there is an unanswered assistant message from a previous session that the visitor has not yet seen

### 2.2 Open (Idle)

- Panel slides up from the button with 200ms ease-out animation
- Panel size:
  - Desktop: 380px wide, 520px tall (max 80vh)
  - Mobile (below 640px viewport): full-screen overlay (100vw x 100vh)
- Panel structure top to bottom:
  - **Header bar** (48px height): Bot name/title (left-aligned), close button (right-aligned, X icon on desktop, back arrow on mobile)
  - **Message area** (flex-grow, scrollable): conversation messages
  - **Input area** (56px min height): text input + send button
- Border radius: `--jc-border-radius` from config (default 12px, 0px on mobile full-screen)
- Shadow: `0 8px 32px rgba(0, 0, 0, 0.12)`
- Background: `--jc-surface` (#FFFFFF) for the panel body
- Header background: `--jc-primary`

#### Welcome Message Behavior

The welcome message is the first thing a visitor sees when they open the widget for the first time. It is displayed as a bot message bubble (left-aligned) at the top of the message area.

The welcome message is not a real conversation message. It is not stored in the database and is not sent to the AI as conversation history. It is a static display element rendered from the client config's `welcomeMessage` field. If the visitor has an existing conversation with messages, the welcome message still appears at the top, above the conversation history.

### 2.3 Typing (AI Responding)

- User's message appears immediately in the message area (right-aligned bubble)
- Typing indicator appears below (left-aligned):
  - Three dots with sequential bounce animation
  - Dots are 6px circles, 4px gap, using `--jc-primary` at 60% opacity
  - Animation: each dot bounces 0.4s with 0.1s stagger
- As tokens stream in from the backend, the typing indicator is replaced by the actual message text
- Text appears token-by-token with no visible jank
- Auto-scroll: message area scrolls to bottom as new tokens arrive, unless the visitor has manually scrolled up (in which case, show a "scroll to bottom" button)
- Send button shows a stop icon during streaming. Clicking it cancels the stream (closes the SSE connection). The partial response remains visible as the assistant message.

### 2.4 Error

- If the API call fails, show an inline error message below the last message:
  - Light red background (#FEF2F2), red text (#991B1B)
  - Message: "Something went wrong. Please try again."
  - Retry button below the error message. Clicking it re-sends the last user message.
- The input bar remains active so the user can retype or send a new message
- Do not show a full-screen error or crash the widget

### 2.5 Offline / Rate Limited

- If the visitor exceeds the per-visitor rate limit (20 messages/minute):
  - Gentle inline message: "You're sending messages too quickly. Please wait a moment."
- If the client's monthly message limit is exceeded:
  - Inline message: "This chat is temporarily unavailable. Please contact us directly at [contact info if available]."
- If the API is unreachable:
  - Message: "We're having trouble connecting. Please try again in a few seconds."
- Auto-retry with exponential backoff (1s, 2s, 4s, max 3 attempts) for network errors only. Do not auto-retry rate limit errors.

---

## 3. Component Layout

<img src="https://sendbird.imgix.net/cms/chatbot-user-interface-design.png" alt="Widget Layout Diagram" width="600">

### Message Bubbles

**User messages (right-aligned):**
- Background: `--jc-primary`
- Text: `--jc-on-primary`
- Border radius: 16px 16px 4px 16px
- Max width: 80% of message area
- Padding: 10px 14px
- Font size: 14px
- Margin bottom: 8px

**Bot messages (left-aligned):**
- Background: `--jc-surface-secondary` (#F3F4F6)
- Text: `--jc-text` (#1F2937)
- Border radius: 16px 16px 16px 4px
- Max width: 85% of message area
- Padding: 10px 14px
- Font size: 14px
- Margin bottom: 8px
- Markdown rendered (see Section 8 for full details)

**Timestamp:**
- Below each message group (not every individual message)
- Font size: 11px, color: `--jc-text-secondary` (#9CA3AF)
- Format: "2:34 PM" (within today) or "Feb 24, 2:34 PM" (older)

### Send Button States

| State | Appearance | Behavior |
|-------|-----------|----------|
| Input empty | Grayed out, `--jc-text-secondary` color | Disabled, not clickable |
| Input has text | `--jc-primary` background, white icon | Enabled, sends message on click |
| AI is streaming | Stop icon (square), `--jc-primary` background | Cancels the stream on click |
| Error state | Same as "input has text" | Enabled, allows resending |

---

## 4. Conversation Persistence

### Visitor Identity

Each visitor is assigned a random anonymous ID (UUID v4) stored in the visitor's browser localStorage under the key `jotil_visitor_id`. This ID is not linked to any personal identity. It is used solely to associate the visitor with their conversation history.

If localStorage is unavailable (private browsing, disabled), the widget generates a session-only ID. Conversation history will not persist across page reloads in this case.

### Loading Previous Conversations

When the widget initializes and a visitor ID exists in localStorage:

1. The widget sends a request to `/api/conversations?clientId=CLIENT_UUID&visitorId=VISITOR_ID`.
2. The backend returns the most recent conversation and its messages (last 50 messages).
3. The messages are loaded into the widget's state and displayed when the visitor opens the panel.
4. The welcome message still appears at the top, above the loaded history.

### New Conversations

A new conversation is created when:

- The visitor has no existing conversation (first visit).
- The visitor's last conversation is older than 24 hours. This prevents extremely long conversation threads and gives the visitor a fresh start.

### Data Stored Per Message

The widget sends and receives these fields per message:

- `role`: "user" or "assistant"
- `content`: the message text
- `created_at`: timestamp (set by the backend)

The widget does not store messages in localStorage. All persistence is server-side via Supabase. The widget fetches history from the API on each load.

---

## 5. Streaming Implementation (Widget Side)

### How Token Streaming Works

The widget communicates with the backend's `/api/chat` endpoint, which returns a stream using the Vercel AI SDK's data stream protocol.

The Vercel AI SDK's `streamText(...).toDataStreamResponse()` returns an SSE-like response where each line is prefixed with a type indicator:

- `0:` followed by a JSON-encoded string -- this is a text token
- `e:` followed by JSON -- this is an error
- `d:` followed by JSON -- this is the finish signal with metadata (usage, finish reason)

### Widget useChat Hook

The widget has a custom `useChat` hook (located at `widget/src/hooks/useChat.ts`) that handles:

1. **Sending a message:** POSTs to `/api/chat` with the client ID, visitor ID, conversation ID, the new message, and recent conversation history.
2. **Reading the stream:** Opens a fetch request with streaming enabled. Reads the response body as a ReadableStream. Parses each line according to the AI SDK data stream format.
3. **Updating state:** As text tokens arrive (lines starting with `0:`), the hook appends the decoded token to the current assistant message in Preact state.
4. **Rendering:** The component re-renders on each state update, showing the growing message. Use `requestAnimationFrame` to batch visual updates and maintain 60fps.
5. **Completion:** When the `d:` finish signal arrives, the hook marks the message as complete and re-enables the send button.
6. **Cancellation:** If the visitor clicks the stop button, the hook calls `abort()` on the fetch AbortController. The partial response remains visible.
7. **Error handling:** If the stream errors or the `e:` line arrives, the hook sets an error state that triggers the inline error message UI.

### Auto-Scroll Behavior

- When the visitor is at the bottom of the message list (or within 50px of the bottom), auto-scroll to bottom on each new token.
- If the visitor has scrolled up to read earlier messages, do not auto-scroll. Show a small "New message" pill button at the bottom of the message area. Clicking it scrolls to the bottom.
- When the visitor sends a new message, always scroll to bottom regardless of current position.

---

## 6. Color Token System

All colors derive from the `primaryColor` set by the client. The widget auto-generates a coherent palette:

| Token | Derivation | Usage |
|-------|-----------|-------|
| `--jc-primary` | primaryColor as-is | Header bg, user bubble bg, send button bg, links |
| `--jc-primary-hover` | primaryColor darkened 10% | Button hover states |
| `--jc-primary-light` | primaryColor at 10% opacity | Subtle highlights |
| `--jc-on-primary` | White or black (auto-contrast) | Text on primary backgrounds |
| `--jc-surface` | #FFFFFF | Panel background |
| `--jc-surface-secondary` | #F3F4F6 | Bot message bubbles |
| `--jc-text` | #1F2937 | Primary text |
| `--jc-text-secondary` | #6B7280 | Timestamps, placeholders |
| `--jc-border` | #E5E7EB | Dividers, input border |
| `--jc-error` | #DC2626 | Error states |
| `--jc-error-light` | #FEF2F2 | Error message background |
| `--jc-shadow` | rgba(0,0,0,0.12) | Panel shadow |

**Auto-contrast logic:** Compute the relative luminance of primaryColor. If luminance > 0.5, `--jc-on-primary` is black (#000000). Otherwise, `--jc-on-primary` is white (#FFFFFF). This is implemented in `widget/src/utils/contrast.ts`. The function takes a hex color string and returns "black" or "white".

---

## 7. Typography

| Element | Size | Weight | Family |
|---------|------|--------|--------|
| Header title | 15px | 600 | System font stack |
| Message text | 14px | 400 | System font stack |
| Timestamp | 11px | 400 | System font stack |
| Input placeholder | 14px | 400 | System font stack |
| Code (inline) | 13px | 400 | Monospace stack |
| Code (block) | 13px | 400 | Monospace stack |
| Welcome message | 14px | 400 | System font stack |

**System font stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

**Monospace stack:** `"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace`

Both font stacks must be declared in the widget's Shadow DOM styles. They are not inherited from the host page.

---

## 8. Markdown Rendering

The widget renders a safe subset of markdown in bot responses. The renderer is custom-built in `widget/src/utils/markdown.ts`. Do not use external markdown libraries (marked, markdown-it, etc.) as they exceed the widget's 15KB bundle budget.

### Supported Markdown

| Markdown | Rendered As |
|----------|------------|
| `**bold**` | Bold text (`<strong>`) |
| `*italic*` | Italic text (`<em>`) |
| `[text](url)` | Clickable link (`<a>`, opens in new tab, `rel="noopener noreferrer"`) |
| `- item` or `* item` | Unordered list with bullet points |
| `1. item` | Ordered list with numbers |
| `` `inline code` `` | Inline code span (gray background `#F3F4F6`, monospace, 2px padding) |
| ` ``` code block ``` ` | Code block (dark background `#1F2937`, light text `#F9FAFB`, monospace, horizontal scroll, 12px padding, 8px border radius) |
| `> quote` | Blockquote (3px left border with `--jc-primary`, 12px left padding, `--jc-text-secondary` color) |

### Not Supported (stripped to plain text)

Images, tables, headings, horizontal rules, HTML tags. These are unnecessary for chat responses and pose security risks in an embedded widget. If the AI model outputs these, the renderer strips the markdown syntax and displays the text content only.

### Security Rules

- No raw HTML from the AI model is ever injected into the DOM. The renderer converts markdown to DOM elements programmatically (createElement), not via innerHTML.
- Links are validated. Only `http://` and `https://` protocols are allowed. Any link with `javascript:`, `data:`, `vbscript:`, or other protocols is rendered as plain text with the URL stripped.
- All text content is escaped before insertion into the DOM.

### Implementation Approach

The markdown renderer should work as a function that takes a markdown string and returns a DOM DocumentFragment (not an HTML string). This avoids innerHTML entirely. The function:

1. Splits input by line.
2. Identifies block-level elements (code blocks, blockquotes, lists).
3. Within each block, processes inline elements (bold, italic, code, links).
4. Returns a DocumentFragment that can be appended to the message bubble element.

---

## 9. Animations

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Panel open | 200ms | ease-out | Click bubble button |
| Panel close | 150ms | ease-in | Click X/back arrow or bubble button |
| Bubble button hover | 150ms | ease | Mouse enter |
| Typing dots bounce | 400ms per dot, 100ms stagger | ease-in-out | AI is generating (before first token arrives) |
| New message appear | 150ms | ease-out | Message added to list |
| Token streaming | Per frame (requestAnimationFrame) | Linear | SSE tokens arriving |
| Error message | 200ms | ease-out | API error |
| Scroll to bottom | 100ms | ease-out | New message or tokens |
| Scroll-to-bottom pill | 150ms | ease-out | Appears when new tokens arrive while scrolled up |

All animations must respect `prefers-reduced-motion` media query. If reduced motion is preferred, replace all animations with instant state changes (0ms duration, no easing).

---

## 10. Mobile Behavior (below 640px viewport)

- Widget opens as a full-screen overlay (100vw x 100vh)
- Header shows a back arrow instead of X (more natural mobile pattern). Tapping it closes the widget.
- Input bar sticks to the bottom with proper keyboard handling:
  - On iOS: use the `visualViewport` API to handle keyboard resize. Listen for `visualViewport.resize` events and adjust the widget height so the input is never hidden behind the virtual keyboard.
  - On Android: the default behavior usually works, but test on Chrome Android to verify.
- Border radius: 0px (full-screen has no rounded corners)
- Bubble button: 48px diameter (slightly smaller than desktop's 56px)
- Touch targets: minimum 44px for all interactive elements (Apple Human Interface Guidelines)
- Close button, send button, and retry button must all meet the 44px minimum touch target.

---

## 11. Accessibility

- **ARIA roles:** Widget panel has `role="dialog"` with `aria-label="Chat with [bot name]"`
- **Message list:** `role="log"` with `aria-live="polite"` for screen reader announcements of new messages
- **Focus management:** When panel opens, focus moves to the text input. When panel closes, focus returns to the bubble button.
- **Focus trapping:** Tab key cycles within the open panel (close button, message area, input, send button). Focus does not escape to the host page while the panel is open.
- **Keyboard shortcuts:**
  - Enter: send message
  - Shift+Enter: new line in input
  - Escape: close panel
- **Color contrast:** All text meets WCAG 2.1 AA minimum (4.5:1 for normal text, 3:1 for large text). The auto-contrast system for `--jc-on-primary` ensures this for all primaryColor values.
- **Screen reader announcements:**
  - When the typing indicator appears: announce "Assistant is typing."
  - When a new assistant message is complete: announce the message content via the `aria-live` region.
  - Do not announce every individual token during streaming (too noisy). Announce only the completed message.
- **Input label:** The text input has a visually hidden `<label>` with text "Type your message" for screen readers.

---

## 12. Performance Targets

| Metric | Target |
|--------|--------|
| Widget JS bundle size (gzipped) | Under 15KB |
| Widget CSS (inside Shadow DOM) | Under 5KB |
| Time to interactive (widget loads) | Under 500ms |
| Time to first token (after send) | Under 1,500ms |
| Smooth streaming (no dropped frames) | 60fps during token rendering |
| Memory usage | Under 10MB at 100 messages |
| No impact on host page Lighthouse score | Less than 50ms main thread blocking |
| Config fetch | Under 200ms (cacheable, small payload) |
| Conversation history fetch | Under 500ms for 50 messages |

---

*This document describes the widget UI/UX for Jotil Chat. For system design and API details, refer to the Technical Architecture. For prompt construction, refer to the Prompt Library. For client setup procedures, refer to the Customer Onboarding Runbook.*