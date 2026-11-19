import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Unexpected application error.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              حدث خطأ غير متوقع · Something went wrong
            </h2>
            <p className="text-sm text-slate-600 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-sky-900 text-white text-sm font-medium rounded-lg hover:bg-sky-800 transition-colors"
            >
              إعادة تحميل الصفحة · Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
