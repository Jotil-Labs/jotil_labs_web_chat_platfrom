import type { FunctionalComponent } from 'preact';

interface TypingIndicatorProps {
  botName?: string;
}

export const TypingIndicator: FunctionalComponent<TypingIndicatorProps> = ({
  botName,
}) => {
  return (
    <div class="jc-typing-indicator" aria-label={`${botName || 'Assistant'} is typing`}>
      {botName && <span class="jc-typing-text">{botName} is typing</span>}
      <span class="jc-typing-dot" />
      <span class="jc-typing-dot" />
      <span class="jc-typing-dot" />
    </div>
  );
};
