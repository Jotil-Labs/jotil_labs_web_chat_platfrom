import type { FunctionalComponent } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';

const STORAGE_KEY = 'jotil_greeting_dismissed';
const SHOW_DELAY_MS = 3000;

interface GreetingTooltipProps {
  message: string;
  position: 'bottom-right' | 'bottom-left';
  onOpen: () => void;
}

export const GreetingTooltip: FunctionalComponent<GreetingTooltipProps> = ({
  message,
  position,
  onOpen,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    } catch {
      // localStorage unavailable — show tooltip anyway
    }

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(
    (e: Event) => {
      e.stopPropagation();
      setVisible(false);
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
    },
    []
  );

  const handleClick = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    onOpen();
  }, [onOpen]);

  if (!visible) return null;

  return (
    <div
      class={`jc-greeting-tooltip jc-position-${position}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {message}
      <button
        class="jc-greeting-close"
        onClick={dismiss}
        type="button"
        aria-label="Dismiss greeting"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M9.53 3.53L8.47 2.47 6 4.94 3.53 2.47 2.47 3.53 4.94 6 2.47 8.47 3.53 9.53 6 7.06 8.47 9.53 9.53 8.47 7.06 6z" />
        </svg>
      </button>
    </div>
  );
};
