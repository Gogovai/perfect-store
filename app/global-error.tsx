'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', textAlign: 'center' }}>
            We apologize for the inconvenience. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
