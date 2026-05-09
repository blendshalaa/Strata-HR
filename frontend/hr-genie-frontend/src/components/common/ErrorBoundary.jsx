import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Something went wrong</h1>
          <p className="text-zinc-500 mb-8 max-w-md">
            We encountered an unexpected error while trying to render this page.
          </p>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#5B4FE8] text-white rounded-md font-bold text-[13px] hover:bg-[#4a3fd4] transition-colors flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Page
            </button>
            <Link 
              to="/"
              className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-md font-bold text-[13px] hover:bg-zinc-50 transition-colors flex items-center gap-2"
              onClick={() => this.setState({ hasError: false })}
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-12 text-left bg-zinc-50 border border-zinc-200 rounded-lg p-5 max-w-2xl w-full overflow-auto">
              <p className="font-mono text-xs font-bold text-red-600 mb-2">{this.state.error.toString()}</p>
              <pre className="font-mono text-[10px] text-zinc-600 leading-relaxed whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
