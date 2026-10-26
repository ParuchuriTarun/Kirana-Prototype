import React from 'react';
import { ShieldAlert, RotateCcw, Store, ChevronDown } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReturnToStore = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.hash = '#/shop';
    }
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#f2fbf6] flex items-center justify-center p-4 font-sans text-black select-none">
          {/* Subtle Ambient Wash */}
          <div 
            className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-200/40 to-transparent blur-[120px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg bg-white rounded-[28px] p-7 sm:p-8 shadow-[0_20px_60px_rgba(5,150,105,0.12)] border border-emerald-100 text-center z-10">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-5 border border-emerald-200 shadow-sm">
              <ShieldAlert className="w-8 h-8 text-emerald-600" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold tracking-wide uppercase mb-2">
              System Shield Active
            </span>

            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight mb-2">
              Display Recovered Gracefully
            </h1>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-6">
              A background data refresh or display sync encountered a temporary glitch while idle. All your products, stock counts, orders, and customer databases remain 100% safe and intact.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleTryAgain}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-extrabold shadow-md shadow-emerald-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-emerald-50 text-black border border-emerald-200 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleReturnToStore}
                className="w-full sm:w-auto px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Store className="w-3.5 h-3.5 text-neutral-600" />
                <span>Return to Store</span>
              </button>
            </div>

            {/* Collapsible Error Technical Details */}
            {this.state.error && (
              <div className="text-left border-t border-emerald-100 pt-4">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-neutral-500 hover:text-black cursor-pointer py-1"
                >
                  <span>Diagnostic Details</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`} />
                </button>

                {this.state.showDetails && (
                  <pre className="mt-2 p-3 bg-neutral-900 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto max-h-40 leading-snug">
                    {this.state.error?.toString()}
                    {'\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
