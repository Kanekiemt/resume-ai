interface Props {
  type: 'error' | 'status';
  message: string;
  onDismiss?: () => void;
}

export default function AlertBanner({ type, message, onDismiss }: Props) {
  if (!message) return null;

  if (type === 'status') {
    return (
      <div className="max-w-4xl mx-auto px-6 mt-6 animate-slide-down">
        <div className="status-banner">
          <div className="spinner" />
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 mt-6 animate-slide-down">
      <div className="error-banner">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5V8.5M8 10.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {message}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="dismiss-btn">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
