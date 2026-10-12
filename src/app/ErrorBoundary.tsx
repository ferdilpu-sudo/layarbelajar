import { Component, type ReactNode } from 'react';
import { Alert } from '../shared/ui/Alert';

interface State { failed: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <div className="container page-panel"><Alert>Halaman mengalami kendala. Muat ulang untuk mencoba lagi.</Alert></div>;
    }
    return this.props.children;
  }
}
