import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert } from '../shared/ui/Alert';

interface State { failed: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Jangan log payload, token atau data privat ke konsol produksi.
  }

  render() {
    if (this.state.failed) {
      return <div className="container page-panel"><Alert>Halaman mengalami kendala. Muat ulang untuk mencoba lagi.</Alert></div>;
    }
    return this.props.children;
  }
}
