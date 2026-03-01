import type { FunctionalComponent } from 'preact';
import { useRef, useEffect, useCallback, useState } from 'preact/hooks';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { ErrorMessage } from './ErrorMessage';
import type { ChatMessageUI } from '../hooks/useChat';
import type { WidgetSize } from '../hooks/useConfig';

interface ChatPanelProps {
  isOpen: boolean;
  botName: string;
  welcomeMessage: string;
  position: 'bottom-right' | 'bottom-left';
  messages: ChatMessageUI[];
  isStreaming: boolean;
  error: string | null;
  logoUrl?: string | null;
  starterQuestions?: string[] | null;
  showWatermark?: boolean;
  botAvatarUrl?: string | null;
  widgetSize?: WidgetSize;
  onClose: () => void;
  onSend: (text: string) => void;
  onCancel: () => void;
  onRetry: () => void;
  onNewChat: () => void;
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
  starterQuestions,
  showWatermark,
  botAvatarUrl,
  widgetSize = 'standard',
  onClose,
  onSend,
  onCancel,
  onRetry,
  onNewChat,
  onFeedback,
}) => {
  const [logoError, setLogoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
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

  const panelClasses = [
    'jc-chat-panel',
    `jc-position-${position}`,
    `jc-size-${widgetSize}`,
  ].join(' ');

  const showAvatarImg = botAvatarUrl && !avatarError;

  return (
    <div
      ref={panelRef}
      class={panelClasses}
      role="dialog"
      aria-label={`Chat with ${botName}`}
    >
      {/* Header */}
      <div class="jc-header">
        <div class="jc-header-left">
          <div class="jc-header-avatar" aria-hidden="true">
            {showAvatarImg ? (
              <img
                class="jc-header-avatar-img"
                src={botAvatarUrl}
                alt=""
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span class="jc-header-avatar-letter">{botName[0]}</span>
            )}
          </div>
          <div class="jc-header-info">
            {logoUrl && !logoError ? (
              <img
                class="jc-header-logo"
                src={logoUrl}
                alt=""
                onError={() => setLogoError(true)}
              />
            ) : (
              <span class="jc-header-title">{botName}</span>
            )}
            <span class="jc-header-status">Online</span>
          </div>
        </div>
        <div class="jc-header-actions">
          {messages.length > 0 && (
            <button
              class="jc-header-btn"
              onClick={onNewChat}
              type="button"
              aria-label="New conversation"
              title="New conversation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.375 2.625a1 1 0 013 3l-9.013 9.014a2 2 0 01-.853.505l-2.873.84a.5.5 0 01-.62-.62l.84-2.873a2 2 0 01.506-.852z" />
              </svg>
            </button>
          )}
          <button
            class="jc-header-btn"
            onClick={onClose}
            type="button"
            aria-label="Close chat"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
              <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        welcomeMessage={welcomeMessage}
        isStreaming={isStreaming}
        starterQuestions={starterQuestions}
        botName={botName}
        botAvatarUrl={botAvatarUrl}
        onFeedback={onFeedback}
        onStarterClick={onSend}
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

      {/* Watermark */}
      {showWatermark !== false && (
        <div class="jc-watermark">
          Powered by{' '}
          <a
            href="https://jotil.com"
            target="_blank"
            rel="noopener noreferrer"
            class="jc-watermark-link"
          >
            Jotil
          </a>
        </div>
      )}
    </div>
  );
};
