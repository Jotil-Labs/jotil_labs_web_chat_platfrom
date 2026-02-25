import type { FunctionalComponent } from 'preact';
import { useRef, useEffect, useCallback, useState } from 'preact/hooks';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { ErrorMessage } from './ErrorMessage';
import type { ChatMessageUI } from '../hooks/useChat';

interface ChatPanelProps {
  isOpen: boolean;
  botName: string;
  welcomeMessage: string;
  position: 'bottom-right' | 'bottom-left';
  messages: ChatMessageUI[];
  isStreaming: boolean;
  error: string | null;
  logoUrl?: string | null;
  onClose: () => void;
  onSend: (text: string) => void;
  onCancel: () => void;
  onRetry: () => void;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}

export const ChatPanel: FunctionalComponent<ChatPanelProps> = ({
  isOpen,
  botName,
  welcomeMessage,
  position,
  messages,
  isStreaming,
  error,
  logoUrl,
  onClose,
  onSend,
  onCancel,
  onRetry,
  onFeedback,
}) => {
  const [logoError, setLogoError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputElRef = useRef<HTMLTextAreaElement | null>(null);

  const setInputRef = useCallback((el: HTMLTextAreaElement | null) => {
    inputElRef.current = el;
  }, []);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputElRef.current) {
      setTimeout(() => inputElRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener('keydown', handleKeyDown);
    return () => panel.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      class={`jc-chat-panel jc-position-${position}`}
      role="dialog"
      aria-label={`Chat with ${botName}`}
    >
      {/* Header */}
      <div class="jc-header">
        <div class="jc-header-left">
          {logoUrl && !logoError && (
            <img
              class="jc-header-logo"
              src={logoUrl}
              alt=""
              onError={() => setLogoError(true)}
            />
          )}
          <span class="jc-header-title">{botName}</span>
        </div>
        <button
          class="jc-header-close"
          onClick={onClose}
          type="button"
          aria-label="Close chat"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="currentColor"
            aria-hidden="true"
            class="jc-close-icon-desktop"
          >
            <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z" />
          </svg>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="currentColor"
            aria-hidden="true"
            class="jc-close-icon-mobile"
          >
            <path d="M15 8.25H5.87l4.19-4.19L9 3l-6 6 6 6 1.06-1.06-4.19-4.19H15z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        welcomeMessage={welcomeMessage}
        isStreaming={isStreaming}
        onFeedback={onFeedback}
      />

      {/* Error */}
      {error && <ErrorMessage message={error} onRetry={onRetry} />}

      {/* Input */}
      <InputBar
        onSend={onSend}
        onCancel={onCancel}
        onClose={onClose}
        isStreaming={isStreaming}
        disabled={false}
        inputRef={setInputRef}
      />
    </div>
  );
};
