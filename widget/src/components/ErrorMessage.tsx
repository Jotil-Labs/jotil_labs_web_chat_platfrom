import type { FunctionalComponent } from 'preact';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export const ErrorMessage: FunctionalComponent<ErrorMessageProps> = ({
  message,
  onRetry,
}) => {
  return (
    <div class="jc-error-message" role="alert">
      <p class="jc-error-text">{message}</p>
      <button class="jc-error-retry" onClick={onRetry} type="button">
        Try again
      </button>
    </div>
  );
};
