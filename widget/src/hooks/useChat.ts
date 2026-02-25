import { useState, useRef, useCallback } from 'preact/hooks';

export interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  feedback?: 'positive' | 'negative' | null;
  isStreaming?: boolean;
}

interface UseChatResult {
  messages: ChatMessageUI[];
  isStreaming: boolean;
  error: string | null;
  conversationId: string | null;
  sendMessage: (text: string) => void;
  cancelStream: () => void;
  retry: () => void;
  loadHistory: () => Promise<void>;
  submitFeedback: (messageId: string, feedback: 'positive' | 'negative') => Promise<void>;
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getVisitorId(): string {
  try {
    const stored = localStorage.getItem('jotil_visitor_id');
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem('jotil_visitor_id', id);
    return id;
  } catch {
    // localStorage unavailable (private browsing)
    return crypto.randomUUID();
  }
}

export function useChat(apiBase: string, clientId: string): UseChatResult {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');
  const visitorId = useRef(getVisitorId());

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `${apiBase}/api/conversations?clientId=${encodeURIComponent(clientId)}&visitorId=${encodeURIComponent(visitorId.current)}`
      );
      if (!res.ok) return;

      const data = await res.json();
      if (data.conversation && data.messages.length > 0) {
        setConversationId(data.conversation.id);
        setMessages(
          data.messages.map((m: { id: string; role: string; content: string; createdAt: string; feedback?: string }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            createdAt: m.createdAt,
            feedback: m.feedback ?? null,
          }))
        );
      }
    } catch {
      // Silently fail history load
    }
  }, [apiBase, clientId]);

  const sendMessage = useCallback(
    (text: string) => {
      if (isStreaming || !text.trim()) return;

      const trimmed = text.trim();
      lastUserMessageRef.current = trimmed;
      setError(null);

      // Add user message
      const userMessage: ChatMessageUI = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      // Prepare assistant placeholder
      const assistantMessage: ChatMessageUI = {
        id: generateId(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      // Build history (last 20 messages, sliding window)
      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const controller = new AbortController();
      abortRef.current = controller;

      streamResponse(
        apiBase,
        clientId,
        visitorId.current,
        conversationId,
        trimmed,
        history,
        controller,
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + token,
              };
            }
            return updated;
          });
        },
        (convId) => {
          if (convId) setConversationId(convId);
        },
        () => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                isStreaming: false,
              };
            }
            return updated;
          });
          setIsStreaming(false);
          abortRef.current = null;
        },
        (errorMsg) => {
          setMessages((prev) => {
            // Remove the empty assistant message
            const updated = [...prev];
            if (
              updated.length > 0 &&
              updated[updated.length - 1].role === 'assistant' &&
              updated[updated.length - 1].content === ''
            ) {
              updated.pop();
            }
            return updated;
          });
          setError(errorMsg);
          setIsStreaming(false);
          abortRef.current = null;
        }
      );
    },
    [apiBase, clientId, conversationId, isStreaming, messages]
  );

  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.role === 'assistant') {
        updated[updated.length - 1] = { ...last, isStreaming: false };
      }
      return updated;
    });
    setIsStreaming(false);
  }, []);

  const retry = useCallback(() => {
    if (lastUserMessageRef.current) {
      setError(null);
      // Remove the failed user message
      setMessages((prev) => {
        const updated = [...prev];
        if (
          updated.length > 0 &&
          updated[updated.length - 1].role === 'user'
        ) {
          updated.pop();
        }
        return updated;
      });
      sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  const submitFeedback = useCallback(
    async (messageId: string, feedback: 'positive' | 'negative') => {
      try {
        await fetch(`${apiBase}/api/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, feedback }),
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
        );
      } catch {
        // Silently fail feedback
      }
    },
    [apiBase]
  );

  return {
    messages,
    isStreaming,
    error,
    conversationId,
    sendMessage,
    cancelStream,
    retry,
    loadHistory,
    submitFeedback,
  };
}

async function streamResponse(
  apiBase: string,
  clientId: string,
  visitorId: string,
  conversationId: string | null,
  message: string,
  history: Array<{ role: string; content: string }>,
  controller: AbortController,
  onToken: (token: string) => void,
  onConversationId: (id: string | null) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const res = await fetch(`${apiBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        conversationId,
        visitorId,
        message,
        history,
      }),
      signal: controller.signal,
    });

    // Capture conversation ID from header
    const convId = res.headers.get('X-Conversation-Id');
    if (convId) onConversationId(convId);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg =
        (data as { error?: string }).error ?? 'Something went wrong. Please try again.';
      onError(errorMsg);
      return;
    }

    if (!res.body) {
      onError('No response stream received');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Use requestAnimationFrame for batched rendering
    let pendingTokens = '';
    let rafId: number | null = null;

    function flushTokens() {
      if (pendingTokens) {
        onToken(pendingTokens);
        pendingTokens = '';
      }
      rafId = null;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line || !line.startsWith('data: ')) continue;

        const data = line.slice(6);
        if (data === '[DONE]') break;

        // Parse AI SDK UI message stream events
        try {
          const event = JSON.parse(data) as {
            type: string;
            delta?: string;
            errorText?: string;
          };
          switch (event.type) {
            case 'text-delta':
              pendingTokens += event.delta ?? '';
              if (!rafId) {
                rafId = requestAnimationFrame(flushTokens);
              }
              break;
            case 'error':
              onError(event.errorText ?? 'An error occurred');
              return;
            case 'finish':
              flushTokens();
              if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
              }
              break;
          }
        } catch {
          // Skip malformed events
        }
      }
    }

    // Flush remaining
    flushTokens();
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    onComplete();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      onComplete();
      return;
    }
    onError('Something went wrong. Please try again.');
  }
}
