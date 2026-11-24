import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ErrorBoundary — keeps a rendering error inside the report area.
 *
 * Without this, any undefined identifier or bad value during render would
 * unmount the whole React tree and leave the page blank. This shows a
 * recoverable message instead and logs the real error to the console.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('PAKSH report render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-navy-card border border-danger/30 rounded-2xl p-6 text-sm text-slate-300">
          <div className="flex items-center gap-2 text-danger font-medium">
            <AlertTriangle className="w-4 h-4" />
            The report could not be displayed.
          </div>
          <p className="mt-2 text-slate-400">
            The analysis itself completed, but a display error occurred. Please
            try analyzing the message again.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-3 px-3 py-1.5 rounded-lg border border-slate-600 hover:border-cyan hover:text-cyan transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
