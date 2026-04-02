import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleClearData = () => {
    if (window.confirm('Clear all app data and reload? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#1a1a2e] text-white p-6">
          <div className="text-2xl font-bold mb-2">Something went wrong</div>
          <p className="text-gray-400 text-sm text-center mb-6 max-w-sm">
            The app encountered an error. You can try reloading, or clear all data if the error persists.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-[#e94560] text-white font-bold text-sm"
            >
              Reload App
            </button>
            <button
              onClick={this.handleClearData}
              className="px-4 py-2 rounded-lg bg-red-900/30 text-red-400 font-bold text-sm"
            >
              Clear Data
            </button>
          </div>
          {this.state.error && (
            <pre className="mt-6 text-xs text-gray-600 max-w-sm overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
