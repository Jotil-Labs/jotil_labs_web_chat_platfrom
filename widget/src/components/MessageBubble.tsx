import type { FunctionalComponent } from 'preact';
import { useRef, useEffect, useState } from 'preact/hooks';
import { renderMarkdown } from '../utils/markdown';
import { formatRelativeTime } from '../utils/time';
import type { ChatMessageUI } from '../hooks/useChat';

interface MessageBubbleProps {
  message: ChatMessageUI;
  botAvatarUrl?: string | null;
  botName?: string;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
}

export const MessageBubble: FunctionalComponent<MessageBubbleProps> = ({
  message,
  botAvatarUrl,
  botName,
  onFeedback,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (message.role === 'assistant' && contentRef.current && message.content) {
      contentRef.current.textContent = '';
      const fragment = renderMarkdown(message.content);
      contentRef.current.appendChild(fragment);
    }
  }, [message.content, message.role]);

  const isUser = message.role === 'user';
  const isCompleted = !isUser && !message.isStreaming && message.content;

  // Don't render an empty bubble while waiting for first token — TypingIndicator handles this state
  if (!isUser && !message.content) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const showAvatarImg = !isUser && botAvatarUrl && !avatarError;
  const showAvatarLetter = !isUser && !showAvatarImg && botName;

  return (
    <div class={`jc-message ${isUser ? 'jc-message-user' : 'jc-message-bot'}`}>
      {!isUser && (showAvatarImg || showAvatarLetter) && (
        <div class="jc-msg-avatar" aria-hidden="true">
          {showAvatarImg ? (
            <img
              class="jc-msg-avatar-img"
              src={botAvatarUrl!}
              alt=""
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span class="jc-msg-avatar-letter">{botName![0]}</span>
          )}
        </div>
      )}
      <div class="jc-message-content">
        <div class={`jc-bubble ${isUser ? 'jc-bubble-user' : 'jc-bubble-bot'}`}>
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <div ref={contentRef} class="jc-markdown-content" />
          )}
        </div>
        {isCompleted && (
          <div class="jc-feedback-buttons">
            <button
              class={`jc-feedback-btn ${copied ? 'jc-feedback-active' : ''}`}
              onClick={handleCopy}
              type="button"
              aria-label={copied ? 'Copied' : 'Copy message'}
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </button>
            {onFeedback && (
              <>
                <button
                  class={`jc-feedback-btn ${message.feedback === 'positive' ? 'jc-feedback-active' : ''}`}
                  onClick={() => onFeedback(message.id, 'positive')}
                  type="button"
                  aria-label="Thumbs up"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M7 10v12" />
                    <path d="M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2a3.13 3.13 0 013 3.88z" />
                  </svg>
                </button>
                <button
                  class={`jc-feedback-btn ${message.feedback === 'negative' ? 'jc-feedback-active' : ''}`}
                  onClick={() => onFeedback(message.id, 'negative')}
                  type="button"
                  aria-label="Thumbs down"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 14V2" />
                    <path d="M9 18.12L10 14H4.17a2 2 0 01-1.92-2.56l2.33-8A2 2 0 016.5 2H20a2 2 0 012 2v8a2 2 0 01-2 2h-2.76a2 2 0 00-1.79 1.11L12 22a3.13 3.13 0 01-3-3.88z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
        {isCompleted && message.createdAt && (
          <span class="jc-message-time">{formatRelativeTime(message.createdAt)}</span>
        )}
        {isUser && message.createdAt && (
          <span class="jc-message-time">{formatRelativeTime(message.createdAt)}</span>
        )}
      </div>
    </div>
  );
};
