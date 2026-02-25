import { render, h } from 'preact';
import { App } from './App';
import widgetStyles from './styles/widget.css?inline';

// Capture script reference at module scope (before any async)
const currentScript = document.currentScript as HTMLScriptElement | null;

function init() {
  // Get client ID from script tag
  const script =
    currentScript ?? document.querySelector<HTMLScriptElement>('script[data-client-id]');

  if (!script) {
    return;
  }

  const clientId = script.getAttribute('data-client-id');
  if (!clientId) {
    return;
  }

  // Derive API base from script src URL
  let apiBase = '';
  const src = script.getAttribute('src');
  if (src) {
    try {
      const url = new URL(src, window.location.href);
      apiBase = url.origin;
    } catch {
      apiBase = window.location.origin;
    }
  } else {
    // Dev mode — script is inline
    apiBase = window.location.origin;
  }

  // Create container
  const container = document.createElement('div');
  container.id = 'jotil-chat-widget';
  container.style.position = 'fixed';
  container.style.zIndex = '2147483646';
  container.style.bottom = '0';
  container.style.right = '0';
  document.body.appendChild(container);

  // Attach Shadow DOM
  const shadowRoot = container.attachShadow({ mode: 'closed' });

  // Inject styles
  const style = document.createElement('style');
  style.textContent = widgetStyles;
  shadowRoot.appendChild(style);

  // Create mount point
  const mountPoint = document.createElement('div');
  mountPoint.id = 'jotil-chat-root';
  shadowRoot.appendChild(mountPoint);

  // Render Preact app
  render(
    h(App, { clientId, apiBase, shadowRoot }),
    mountPoint
  );
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
