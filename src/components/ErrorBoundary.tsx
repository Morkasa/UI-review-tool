import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI review tool crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app error-screen">
          <section className="empty-state" role="alert">
            <h1>Review workspace failed to load</h1>
            <p>{this.state.error?.message ?? 'Unknown rendering error'}</p>
            <button
              className="button primary"
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
