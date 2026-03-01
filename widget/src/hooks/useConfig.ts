import { useState, useEffect } from 'preact/hooks';
import { getContrastColor } from '../utils/contrast';

export type DarkMode = 'light' | 'dark' | 'auto';
export type WidgetSize = 'compact' | 'standard' | 'large';

export interface WidgetConfig {
  botName: string;
  welcomeMessage: string;
  primaryColor: string;
  borderRadius: number;
  position: 'bottom-right' | 'bottom-left';
  bubbleIconUrl: string | null;
  logoUrl: string | null;
  greetingMessage: string | null;
  glowEffect: boolean;
  starterQuestions: string[] | null;
  showWatermark: boolean;
  conversationExpiryHours: number | null;
  botAvatarUrl: string | null;
  autoOpenDelay: number | null;
  greetingDelay: number;
  widgetSize: WidgetSize;
  soundEnabled: boolean;
  darkMode: DarkMode;
}

interface UseConfigResult {
  config: WidgetConfig | null;
  loading: boolean;
  error: string | null;
}

function resolveIsDark(mode: DarkMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useConfig(
  apiBase: string,
  clientId: string,
  shadowRoot: ShadowRoot | null
): UseConfigResult {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchConfig() {
      try {
        const res = await fetch(
          `${apiBase}/api/config?clientId=${encodeURIComponent(clientId)}`
        );

        if (!res.ok) {
          throw new Error(`Config fetch failed: ${res.status}`);
        }

        const data = await res.json();
        if (cancelled) return;

        setConfig(data);
        applyTheme(data, shadowRoot);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load configuration'
        );
        setLoading(false);
      }
    }

    fetchConfig();
    return () => {
      cancelled = true;
    };
  }, [apiBase, clientId, shadowRoot]);

  // Live auto-mode switching for dark mode
  useEffect(() => {
    if (!config || config.darkMode !== 'auto' || !shadowRoot) return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(config, shadowRoot);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [config, shadowRoot]);

  return { config, loading, error };
}

function applyTheme(config: WidgetConfig, shadowRoot: ShadowRoot | null): void {
  if (!shadowRoot) return;

  const host = shadowRoot.host as HTMLElement;
  const isDark = resolveIsDark(config.darkMode);
  const onPrimary = getContrastColor(config.primaryColor);
  const primaryRgb = hexToRgb(config.primaryColor);

  host.style.setProperty('--jc-primary', config.primaryColor);
  host.style.setProperty(
    '--jc-primary-hover',
    darken(config.primaryColor, 10)
  );
  host.style.setProperty(
    '--jc-primary-light',
    `rgba(${primaryRgb}, 0.1)`
  );
  host.style.setProperty(
    '--jc-on-primary',
    onPrimary === 'white' ? '#FFFFFF' : '#000000'
  );
  host.style.setProperty('--jc-border-radius', `${config.borderRadius}px`);

  if (isDark) {
    host.style.setProperty('--jc-surface', '#1F2937');
    host.style.setProperty('--jc-surface-secondary', '#374151');
    host.style.setProperty('--jc-text', '#F9FAFB');
    host.style.setProperty('--jc-text-secondary', '#9CA3AF');
    host.style.setProperty('--jc-border', '#4B5563');
    host.style.setProperty('--jc-error', '#EF4444');
    host.style.setProperty('--jc-error-light', 'rgba(239,68,68,0.15)');
    host.style.setProperty('--jc-error-text', '#FCA5A5');
    host.style.setProperty('--jc-shadow', 'rgba(0,0,0,0.3)');
    host.style.setProperty('--jc-code-bg', '#111827');
    host.style.setProperty('--jc-code-text', '#E5E7EB');
  } else {
    host.style.setProperty('--jc-surface', '#FFFFFF');
    host.style.setProperty('--jc-surface-secondary', '#F3F4F6');
    host.style.setProperty('--jc-text', '#1F2937');
    host.style.setProperty('--jc-text-secondary', '#6B7280');
    host.style.setProperty('--jc-border', '#E5E7EB');
    host.style.setProperty('--jc-error', '#DC2626');
    host.style.setProperty('--jc-error-light', '#FEF2F2');
    host.style.setProperty('--jc-error-text', '#991B1B');
    host.style.setProperty('--jc-shadow', 'rgba(0,0,0,0.12)');
    host.style.setProperty('--jc-code-bg', '#1F2937');
    host.style.setProperty('--jc-code-text', '#F9FAFB');
  }

  host.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

function hexToRgb(hex: string): string {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function darken(hex: string, percent: number): string {
  const color = hex.replace('#', '');
  const r = Math.max(0, parseInt(color.substring(0, 2), 16) - Math.round(2.55 * percent));
  const g = Math.max(0, parseInt(color.substring(2, 4), 16) - Math.round(2.55 * percent));
  const b = Math.max(0, parseInt(color.substring(4, 6), 16) - Math.round(2.55 * percent));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
