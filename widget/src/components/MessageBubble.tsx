import type { FunctionalComponent } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import { renderMarkdown } from '../utils/markdown';
import type { ChatMessageUI } from '../hooks/useChat';

interface MessageBubbleProps {
  message: ChatMessageUI;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
}

export const MessageBubble: FunctionalComponent<MessageBubbleProps> = ({
  message,
  onFeedback,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message.role === 'assistant' && contentRef.current && message.content) {
      contentRef.current.textContent = '';
      const fragment = renderMarkdown(message.content);
      contentRef.current.appendChild(fragment);
    }
  }, [message.content, message.role]);

  const isUser = message.role === 'user';

  return (
    <div class={`jc-message ${isUser ? 'jc-message-user' : 'jc-message-bot'}`}>
      <div class={`jc-bubble ${isUser ? 'jc-bubble-user' : 'jc-bubble-bot'}`}>
        {isUser ? (
          <span>{message.content}</span>
        ) : (
          <div ref={contentRef} class="jc-markdown-content" />
        )}
      </div>
      {!isUser && !message.isStreaming && onFeedback && message.content && (
        <div class="jc-feedback-buttons">
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
        </div>
      )}
    </div>
  );
};
