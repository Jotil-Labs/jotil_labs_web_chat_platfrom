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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M2 20h2V8H2v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L15.17 1 7.59 8.59C7.22 8.95 7 9.45 7 10v9c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                </button>
                <button
                  class={`jc-feedback-btn ${message.feedback === 'negative' ? 'jc-feedback-active' : ''}`}
                  onClick={() => onFeedback(message.id, 'negative')}
                  type="button"
                  aria-label="Thumbs down"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22 4h-2v12h2V4zM2.17 11.17c-.25.25-.42.61-.42 1.01 0 .41.17.79.44 1.06l1.06 1.05L10.83 22c.37.36.88.59 1.41.59h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L17.17 2 9.59 9.59C9.22 9.95 9 10.45 9 11v9c0 1.1-.9 2-2 2H2V11.17z" />
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
