import type { FunctionalComponent } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { useConfig } from './hooks/useConfig';
import { useChat } from './hooks/useChat';
import { BubbleButton } from './components/BubbleButton';
import { ChatPanel } from './components/ChatPanel';
import { GreetingTooltip } from './components/GreetingTooltip';
import { markUserInteraction, playNotificationSound } from './utils/sound';

const AUTO_OPEN_DISMISS_KEY = 'jotil_auto_open_dismissed';

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
  const [unreadCount, setUnreadCount] = useState(0);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);
  const historyLoadedRef = useRef(false);
  const prevMessagesLenRef = useRef(0);
  const interactionMarkedRef = useRef(false);

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

  const ensureInteraction = useCallback(() => {
    if (!interactionMarkedRef.current) {
      interactionMarkedRef.current = true;
      markUserInteraction();
    }
  }, []);

  const handleOpen = useCallback(() => {
    ensureInteraction();
    setIsOpen(true);
    setUnreadCount(0);
    if (!historyLoadedRef.current) {
      historyLoadedRef.current = true;
      loadHistory(config?.conversationExpiryHours);
    }
  }, [loadHistory, config?.conversationExpiryHours, ensureInteraction]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(AUTO_OPEN_DISMISS_KEY, 'true');
    } catch {
      // ignore
    }
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

  const handleSend = useCallback(
    (text: string) => {
      ensureInteraction();
      sendMessage(text);
    },
    [sendMessage, ensureInteraction]
  );

  // Capture bubble ref
  useEffect(() => {
    if (shadowRoot) {
      const btn = shadowRoot.querySelector('.jc-bubble-button');
      if (btn instanceof HTMLButtonElement) {
        bubbleRef.current = btn;
      }
    }
  }, [shadowRoot, isOpen]);

  // Unread badge + sound notification
  useEffect(() => {
    const len = messages.length;
    if (len > prevMessagesLenRef.current && len > 0) {
      const lastMsg = messages[len - 1];
      if (
        lastMsg.role === 'assistant' &&
        !lastMsg.isStreaming &&
        lastMsg.content !== ''
      ) {
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
        if (config?.soundEnabled) {
          playNotificationSound();
        }
      }
    }
    prevMessagesLenRef.current = len;
  }, [messages, isOpen, config?.soundEnabled]);

  // Auto-open after delay
  useEffect(() => {
    if (!config?.autoOpenDelay || isOpen) return;

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(AUTO_OPEN_DISMISS_KEY) === 'true';
    } catch {
      // ignore
    }
    if (dismissed) return;

    const timer = setTimeout(() => {
      handleOpen();
    }, config.autoOpenDelay * 1000);
    return () => clearTimeout(timer);
  }, [config?.autoOpenDelay, isOpen, handleOpen]);

  if (loading || configError || !config) {
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
            unreadCount={unreadCount}
          />
          {config.greetingMessage && (
            <GreetingTooltip
              message={config.greetingMessage}
              position={config.position}
              delaySeconds={config.greetingDelay}
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
        botAvatarUrl={config.botAvatarUrl}
        widgetSize={config.widgetSize}
        onClose={handleClose}
        onSend={handleSend}
        onCancel={cancelStream}
        onRetry={retry}
        onNewChat={resetConversation}
        onFeedback={submitFeedback}
      />
    </>
  );
};
