import type { FunctionalComponent } from 'preact';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';

interface InputBarProps {
  onSend: (text: string) => void;
  onCancel: () => void;
  onClose: () => void;
  isStreaming: boolean;
  disabled: boolean;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
}

export const InputBar: FunctionalComponent<InputBarProps> = ({
  onSend,
  onCancel,
  onClose,
  isStreaming,
  disabled,
  inputRef,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setRefs = useCallback(
    (el: HTMLTextAreaElement | null) => {
      (textareaRef as { current: HTMLTextAreaElement | null }).current = el;
      if (inputRef) inputRef(el);
    },
    [inputRef]
  );

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [text]);

  // iOS keyboard handling
  useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const vv = window.visualViewport;
      const onResize = () => {
        const el = textareaRef.current?.closest('.jc-input-bar');
        if (el instanceof HTMLElement) {
          const offset = window.innerHeight - vv.height - vv.offsetTop;
          el.style.paddingBottom = offset > 0 ? `${offset}px` : '0px';
        }
      };
      vv.addEventListener('resize', onResize);
      return () => vv.removeEventListener('resize', onResize);
    }
  }, []);

  const handleSend = () => {
    if (isStreaming) {
      onCancel();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const hasText = text.trim().length > 0;
  const showButton = hasText || isStreaming;

  return (
    <div class="jc-input-bar">
      <label class="jc-sr-only" for="jc-message-input">
        Type your message
      </label>
      <textarea
        id="jc-message-input"
        ref={setRefs}
        class="jc-input-textarea"
        placeholder="Type your message..."
        value={text}
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={1000}
        disabled={disabled}
      />
      <button
        class={`jc-send-button ${isStreaming ? 'jc-send-stop' : ''} ${showButton ? 'jc-send-active' : 'jc-send-disabled'}`}
        onClick={handleSend}
        disabled={!showButton && !isStreaming}
        type="button"
        aria-label={isStreaming ? 'Stop response' : 'Send message'}
      >
        {isStreaming ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="10" height="10" rx="1" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M2.01 14L14 8L2.01 2L2 6.53L10 8L2 9.47L2.01 14Z" />
          </svg>
        )}
      </button>
    </div>
  );
};
