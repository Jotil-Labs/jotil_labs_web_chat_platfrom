import type { FunctionalComponent } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { useConfig } from './hooks/useConfig';
import { useChat } from './hooks/useChat';
import { BubbleButton } from './components/BubbleButton';
import { ChatPanel } from './components/ChatPanel';
import { GreetingTooltip } from './components/GreetingTooltip';

interface AppProps {
  clientId: string;
  apiBase: string;
  shadowRoot: ShadowRoot | null;
}

export const App: FunctionalComponent<AppProps> = ({
  clientId,
  apiBase,
  shadowRoot,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);
  const historyLoadedRef = useRef(false);

  const { config, loading, error: configError } = useConfig(
    apiBase,
    clientId,
    shadowRoot
  );

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    cancelStream,
    retry,
    loadHistory,
    resetConversation,
    submitFeedback,
  } = useChat(apiBase, clientId);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (!historyLoadedRef.current) {
      historyLoadedRef.current = true;
      loadHistory(config?.conversationExpiryHours);
    }
  }, [loadHistory, config?.conversationExpiryHours]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Return focus to bubble
    if (bubbleRef.current) {
      bubbleRef.current.focus();
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [isOpen, handleClose, handleOpen]);

  // Capture bubble ref
  useEffect(() => {
    if (shadowRoot) {
      const btn = shadowRoot.querySelector('.jc-bubble-button');
      if (btn instanceof HTMLButtonElement) {
        bubbleRef.current = btn;
      }
    }
  }, [shadowRoot, isOpen]);

  if (loading || configError || !config) {
    // Still render bubble with defaults if loading
    return (
      <BubbleButton
        onClick={handleToggle}
        position="bottom-right"
      />
    );
  }

  return (
    <>
      {!isOpen && (
        <>
          <BubbleButton
            onClick={handleToggle}
            position={config.position}
            glowEffect={config.glowEffect}
            iconUrl={config.bubbleIconUrl}
          />
          {config.greetingMessage && (
            <GreetingTooltip
              message={config.greetingMessage}
              position={config.position}
              onOpen={handleOpen}
            />
          )}
        </>
      )}
      <ChatPanel
        isOpen={isOpen}
        botName={config.botName}
        welcomeMessage={config.welcomeMessage}
        position={config.position}
        messages={messages}
        isStreaming={isStreaming}
        error={error}
        logoUrl={config.logoUrl}
        starterQuestions={config.starterQuestions}
        showWatermark={config.showWatermark}
        onClose={handleClose}
        onSend={sendMessage}
        onCancel={cancelStream}
        onRetry={retry}
        onNewChat={resetConversation}
        onFeedback={submitFeedback}
      />
    </>
  );
};
