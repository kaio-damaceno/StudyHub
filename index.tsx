import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#0a0e27' }}>
          <img src="crash.png" alt="Crash" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: '24px', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px 24px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
            Parece que temos um problema no app.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);