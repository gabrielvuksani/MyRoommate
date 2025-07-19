import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          fontFamily: 'Arial, sans-serif', 
          backgroundColor: '#f8f9fa',
          color: '#333',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
            Something went wrong
          </h1>
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '15px', 
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <strong>Error:</strong> {this.state.error?.message}
          </div>
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '15px', 
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <strong>Stack:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '10px' }}>
              {this.state.error?.stack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;