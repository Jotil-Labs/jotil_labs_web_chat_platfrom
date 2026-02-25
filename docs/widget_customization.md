# Jotil Chat: Widget Customization Guide

**Version:** 1.0
**Last Updated:** February 2026
**Purpose:** Reference for configuring and extending the visual appearance of the Jotil Chat widget per client.

---

## 1. Overview

Every client gets a set of **base settings** (columns on the `clients` table) that control core widget behavior, and an **extensible customization object** (the `customization` JSONB column) for optional visual enhancements.

### Why Two Layers?

| Layer | Storage | Change Frequency | Examples |
|-------|---------|-----------------|----------|
| Base settings | Individual columns | Set once at onboarding | `primary_color`, `bot_name`, `position`, `border_radius` |
| Customization | `customization` JSONB column | Adjusted anytime, new keys added without migrations | `glowEffect`, `greetingMessage`, `bubbleIconUrl`, `logoUrl` |

Base settings are required for every client and have strict types enforced by the database. Customization options are all optional with sensible defaults (off/null) — a client with `customization = '{}'` gets a standard widget with no extra features.

---

## 2. Base Settings Reference

These are columns on the `clients` table, set during onboarding.

| Setting | Column | Type | Default | Description |
|---------|--------|------|---------|-------------|
| Primary Color | `primary_color` | text (hex) | `#7C3AED` | Brand color used for header, user bubbles, send button, links, and derived tokens (`--jc-primary-hover`, `--jc-primary-light`, `--jc-on-primary`) |
| Border Radius | `border_radius` | integer | `12` | Corner radius (px) for the chat panel. Set to `0` for sharp corners, `16-20` for rounder panels. |
| Position | `position` | text | `bottom-right` | Bubble and panel position. Must be `bottom-right` or `bottom-left`. |
| Bot Name | `bot_name` | text | `Assistant` | Display name shown in the chat panel header. |
| Welcome Message | `welcome_message` | text | `Hi! How can I help you today?` | First message displayed when a visitor opens the chat for the first time. Not stored in conversation history. |

### Updating Base Settings

```sql
UPDATE clients
SET primary_color = '#2563EB',
    border_radius = 16,
    position = 'bottom-left',
    bot_name = 'BrightBot',
    welcome_message = 'Hello! Ask me anything about our services.'
WHERE id = 'CLIENT_UUID';
```

---

## 3. Customization Options Reference

These live inside the `customization` JSONB column. All keys are optional. Omitted keys use their default (off/null).

### 3.1 Glow Effect

A pulsing glow animation on the chat bubble button that draws the visitor's eye.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `glowEffect` | boolean | `false` | Enables a repeating box-shadow pulse (2s cycle) using the client's primary color. |

**Behavior:**
- Animates using the CSS custom property `--jc-primary-light` for a soft, brand-colored glow.
- Respects `prefers-reduced-motion` — animation is disabled when the visitor has reduced motion enabled.
- Does not affect the bubble's hover or click behavior.

**When to use:** New clients who want higher engagement, or when the bubble blends into the host site's design.

```sql
UPDATE clients
SET customization = jsonb_set(customization, '{glowEffect}', 'true')
WHERE id = 'CLIENT_UUID';
```

### 3.2 Greeting Tooltip

A small speech-bubble popup that appears above the chat button after a short delay on first visit.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `greetingMessage` | string | `null` (disabled) | Text displayed in the tooltip. Max recommended length: 60 characters. |

**Behavior:**
- Appears after a **3-second delay** on the visitor's first page load.
- Has a close (X) button and can also be clicked to open the chat panel.
- Once dismissed (X or clicked), it stays dismissed across page navigations via `localStorage` key `jotil_greeting_dismissed`.
- Positioned directly above the bubble button, with a small arrow pointing down.
- Animated: fade-in + slide-up (respects `prefers-reduced-motion`).
- On mobile (below 640px), the tooltip's max width shrinks to 200px and its vertical position adjusts.

**When to use:** Proactive engagement, especially for e-commerce or service businesses where visitors may not notice the chat bubble.

```sql
UPDATE clients
SET customization = jsonb_set(customization, '{greetingMessage}', '"Need help? Ask me anything!"')
WHERE id = 'CLIENT_UUID';
```

### 3.3 Custom Bubble Icon

Replace the default chat SVG icon on the bubble button with a custom image.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `bubbleIconUrl` | string (URL) | `null` (default SVG) | URL to a 24x24px icon image (PNG, SVG, or WebP recommended). |

**Behavior:**
- Renders as an `<img>` tag (24x24px, `object-fit: contain`) inside the bubble button.
- If the image fails to load (404, network error), falls back silently to the default chat SVG icon.
- The image inherits no drag behavior and no pointer events.

**Image requirements:**
- Square aspect ratio (will be displayed at 24x24px).
- Transparent background recommended (the bubble button provides the background color).
- Should contrast well against the client's `primary_color`. Since `--jc-on-primary` is auto-calculated as white or black, a white icon works well on most brand colors.
- Host the image on a CDN or publicly accessible URL. Do not use authenticated URLs.

```sql
UPDATE clients
SET customization = jsonb_set(customization, '{bubbleIconUrl}', '"https://example.com/icon.svg"')
WHERE id = 'CLIENT_UUID';
```

### 3.4 Header Logo

Display a logo image in the chat panel header alongside the bot name.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `logoUrl` | string (URL) | `null` (no logo) | URL to a logo image displayed in the header. |

**Behavior:**
- Rendered as an `<img>` at 28px height with auto width (max 120px).
- Positioned to the left of the bot name in the header, with 8px gap.
- If the image fails to load, it is hidden and only the bot name is shown.
- The logo should look good on the client's `primary_color` background (the header background).

**Image requirements:**
- Height should be at least 56px (renders at 28px, 2x for retina).
- Horizontal/landscape logos work best. Tall logos will be constrained by the 28px height.
- Transparent background recommended.
- White or light-colored logos work best since the header background is the client's primary color.

```sql
UPDATE clients
SET customization = jsonb_set(customization, '{logoUrl}', '"https://example.com/logo-white.svg"')
WHERE id = 'CLIENT_UUID';
```

---

## 4. Setting Multiple Customizations at Once

Use a single `UPDATE` to set the entire `customization` object:

```sql
UPDATE clients
SET customization = '{
  "glowEffect": true,
  "greetingMessage": "Hi! Need help finding the right plan?",
  "logoUrl": "https://cdn.example.com/logo-white.svg"
}'::jsonb
WHERE id = 'CLIENT_UUID';
```

Or merge new keys into existing customization without overwriting others:

```sql
UPDATE clients
SET customization = customization || '{
  "glowEffect": true,
  "greetingMessage": "Welcome! How can we help?"
}'::jsonb
WHERE id = 'CLIENT_UUID';
```

### Removing a Customization

Remove a single key (resets to default behavior):

```sql
UPDATE clients
SET customization = customization - 'greetingMessage'
WHERE id = 'CLIENT_UUID';
```

Reset all customizations:

```sql
UPDATE clients
SET customization = '{}'
WHERE id = 'CLIENT_UUID';
```

---

## 5. How It Works (Data Flow)

```
Supabase (clients.customization JSONB)
  |
  | GET /api/config?clientId=...
  v
API Config Route (src/app/api/config/route.ts)
  |  Reads client.customization, applies defaults (null/false for missing keys)
  |  Maps to flat WidgetConfig: { glowEffect, greetingMessage, bubbleIconUrl, logoUrl, ... }
  v
Widget (Preact, Shadow DOM)
  |  useConfig() receives WidgetConfig
  |  Passes fields to components:
  |    - BubbleButton: glowEffect, iconUrl
  |    - GreetingTooltip: greetingMessage
  |    - ChatPanel: logoUrl
  v
Visitor sees the customized widget
```

### Type Definitions

**Server-side** (`src/types/index.ts`):

```typescript
// All keys optional — missing = default behavior
interface ClientCustomization {
  bubbleIconUrl?: string;
  logoUrl?: string;
  greetingMessage?: string;
  glowEffect?: boolean;
}

// On the Client interface
interface Client {
  // ...base columns...
  customization: ClientCustomization;
}
```

**Widget-side** (`widget/src/hooks/useConfig.ts` and `src/types/index.ts`):

```typescript
// Flat structure — API config route resolves defaults
interface WidgetConfig {
  // ...base fields...
  bubbleIconUrl: string | null;
  logoUrl: string | null;
  greetingMessage: string | null;
  glowEffect: boolean;
}
```

---

## 6. Adding a New Customization Option

The JSONB column means no database migration is needed. Follow these steps:

### Step 1: Add the Key to `ClientCustomization`

In `src/types/index.ts`, add the new optional field:

```typescript
export interface ClientCustomization {
  bubbleIconUrl?: string;
  logoUrl?: string;
  greetingMessage?: string;
  glowEffect?: boolean;
  newOption?: string; // <-- add here
}
```

### Step 2: Add to `WidgetConfig`

In `src/types/index.ts` and `widget/src/hooks/useConfig.ts`, add the resolved field:

```typescript
export interface WidgetConfig {
  // ...existing fields...
  newOption: string | null; // <-- add here
}
```

### Step 3: Map in Config Route

In `src/app/api/config/route.ts`, add the mapping with a default:

```typescript
const c = client.customization ?? {};
const config: WidgetConfig = {
  // ...existing mappings...
  newOption: c.newOption ?? null,
};
```

### Step 4: Implement in Widget

Create or update the relevant component to use the new field. Pass it from `App.tsx` through props.

### Step 5: Add CSS (if needed)

Add styles to `widget/src/styles/widget.css`. Remember to add entries in the `prefers-reduced-motion` and mobile media query blocks if the feature involves animation or positioning.

### Step 6: Verify

```bash
npm run typecheck    # Both src/ and widget/ pass
npm run test         # All tests pass
npm run widget:build # Bundle still under 15KB gzipped
```

### Step 7: Enable for a Client

```sql
UPDATE clients
SET customization = jsonb_set(customization, '{newOption}', '"value"')
WHERE id = 'CLIENT_UUID';
```

No deployment needed beyond the code change. No database migration. No downtime.

---

## 7. Onboarding Checklist Update

When onboarding a new client (see `docs/customer_onboarding.md`), add this to the intake form:

**Visual Enhancements (optional)**

- Would you like the chat button to glow/pulse to attract attention? (Yes/No)
- Would you like a greeting popup above the chat button? If yes, what should it say? (Max 60 characters)
- Do you have a custom icon for the chat button? (Provide URL, 24x24px recommended)
- Do you have a logo for the chat header? (Provide URL, transparent background, light color for dark header)

During Step 4 (Create Client Record in Supabase), set the `customization` column:

```sql
INSERT INTO clients (name, domain, ..., customization)
VALUES (
  'Client Name',
  'example.com',
  ...,
  '{"glowEffect": true, "greetingMessage": "Need help? Ask us!"}'::jsonb
);
```

---

## 8. Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Custom icon not showing | Image URL is 404 or CORS-blocked | Use a publicly accessible CDN URL. Widget falls back to default SVG silently. |
| Logo not showing in header | Image fails to load | Check URL accessibility. Logo hides on error — no broken image shown. |
| Greeting tooltip never appears | Already dismissed in localStorage | Clear `jotil_greeting_dismissed` from visitor's localStorage, or test in incognito. |
| Greeting tooltip appears every visit | localStorage is unavailable (private browsing) | Expected behavior — tooltip cannot persist dismissal without localStorage. |
| Glow animation not visible | `prefers-reduced-motion: reduce` is enabled | Expected behavior — animation is disabled to respect accessibility preferences. |
| Glow blends into page background | Primary color is too close to page background | Choose a more contrasting `primary_color` for the client. |
| Logo looks bad in header | Logo is too tall or has a dark background | Use a horizontal logo with transparent background, ideally white/light colored. |

---

*This document covers widget visual customization for Jotil Chat. For core widget behavior, refer to `widget_design.md`. For system architecture, refer to `technical_architecture.md`. For client setup, refer to `customer_onboarding.md`.*
