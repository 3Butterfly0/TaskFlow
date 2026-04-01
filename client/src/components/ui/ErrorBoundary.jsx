import { Component } from "react";
import ErrorState from "./ErrorState";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          variant="fullPage"
          statusCode={500}
          title="App Crashed"
          message={
            this.state.error?.message ||
            "A critical error occurred while rendering the application. Please reload the page."
          }
          onRetry={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
