import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-canvas, #0f172a)',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'var(--bg-surface, #1e293b)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>⚠️</div>
            <h1 style={{
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-white, #ffffff)',
              marginBottom: '1rem'
            }}>
              Oops! Something went wrong
            </h1>
            <p style={{
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontSize: '1rem',
              color: 'var(--text-secondary, #94a3b8)',
              marginBottom: '2rem'
            }}>
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: 'var(--text-tertiary, #64748b)',
                fontFamily: 'var(--font-mono, monospace)',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', color: 'var(--primary-400, #a78bfa)' }}>
                  Error Details
                </summary>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              style={{
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                fontSize: '1rem',
                fontWeight: '600',
                padding: '0.75rem 2rem',
                background: 'var(--primary-500, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.target.style.background = 'var(--primary-600, #7c3aed)'}
              onMouseOut={(e) => e.target.style.background = 'var(--primary-500, #8b5cf6)'}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
