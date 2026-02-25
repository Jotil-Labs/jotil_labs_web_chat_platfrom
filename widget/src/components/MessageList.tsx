import type { FunctionalComponent } from 'preact';
import { useRef, useEffect, useState, useCallback } from 'preact/hooks';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessageUI } from '../hooks/useChat';

interface MessageListProps {
  messages: ChatMessageUI[];
  welcomeMessage: string;
  isStreaming: boolean;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}

export const MessageList: FunctionalComponent<MessageListProps> = ({
  messages,
  welcomeMessage,
  isStreaming,
  onFeedback,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom && isStreaming);
  }, [isStreaming]);

  // Auto-scroll on new messages/tokens
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(false);
    } else if (isStreaming) {
      setShowScrollButton(true);
    }
  }, [messages, isStreaming, scrollToBottom]);

  // Always scroll to bottom when user sends a message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'user') {
      scrollToBottom(false);
    }
  }, [messages.length, scrollToBottom, messages]);

  // Show typing indicator only before first token arrives
  const showTyping =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].content === '';

  return (
    <div
      class="jc-message-list"
      ref={listRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {/* Welcome message */}
      <div class="jc-message jc-message-bot">
        <div class="jc-bubble jc-bubble-bot">
          <span>{welcomeMessage}</span>
        </div>
      </div>

      {/* Messages */}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onFeedback={onFeedback}
        />
      ))}

      {/* Typing indicator */}
      {showTyping && (
        <div class="jc-message jc-message-bot">
          <TypingIndicator />
        </div>
      )}

      {/* Scroll to bottom pill */}
      {showScrollButton && (
        <button
          class="jc-scroll-bottom"
          onClick={() => {
            scrollToBottom(true);
            setShowScrollButton(false);
          }}
          type="button"
          aria-label="Scroll to bottom"
        >
          New message
        </button>
      )}
    </div>
  );
};
