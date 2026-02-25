import type { FunctionalComponent } from 'preact';

export const TypingIndicator: FunctionalComponent = () => {
  return (
    <div class="jc-typing-indicator" aria-label="Assistant is typing">
      <span class="jc-typing-dot" />
      <span class="jc-typing-dot" />
      <span class="jc-typing-dot" />
    </div>
  );
};
