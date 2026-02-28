import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';

interface BubbleButtonProps {
  onClick: () => void;
  position: 'bottom-right' | 'bottom-left';
  glowEffect?: boolean;
  iconUrl?: string | null;
  unreadCount?: number;
}

export const BubbleButton: FunctionalComponent<BubbleButtonProps> = ({
  onClick,
  position,
  glowEffect = false,
  iconUrl,
  unreadCount = 0,
}) => {
  const [iconError, setIconError] = useState(false);

  const classes = [
    'jc-bubble-button',
    `jc-position-${position}`,
    glowEffect ? 'jc-bubble-glow' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const showCustomIcon = iconUrl && !iconError;

  return (
    <button
      class={classes}
      onClick={onClick}
      aria-label={unreadCount > 0 ? `Open chat (${unreadCount} unread)` : 'Open chat'}
      type="button"
    >
      {showCustomIcon ? (
        <img
          class="jc-bubble-icon-img"
          src={iconUrl}
          alt=""
          width={24}
          height={24}
          onError={() => setIconError(true)}
        />
      ) : (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
            fill="currentColor"
          />
          <path d="M7 9H17V11H7V9ZM7 5H17V7H7V5Z" fill="currentColor" />
        </svg>
      )}
      {unreadCount > 0 && (
        <span class="jc-unread-badge" aria-hidden="true">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};
