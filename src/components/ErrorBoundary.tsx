import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null; componentStack: string };

/**
 * Filet de sécurité global : sans lui, la moindre erreur de rendu démonte toute
 * l'application et laisse une page blanche, sans aucune trace (pas de Sentry).
 * Ici l'utilisateur voit un message, peut recharger, et le détail technique
 * reste consultable (capture d'écran → diagnostic).
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? '' });
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    const details = [
      `${error.name}: ${error.message}`,
      `Page : ${window.location.pathname}`,
      `Navigateur : ${navigator.userAgent}`,
      componentStack.trim().split('\n').slice(0, 6).join('\n'),
    ].join('\n');

    return (
      <div role="alert" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#F8FAFC' }}>
        <div style={{ width: '100%', maxWidth: 480, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
          <h1 style={{ fontSize: 20, margin: '0 0 8px', color: '#0F172A' }}>Une erreur est survenue</h1>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 20px' }}>
            L'affichage de cette page a échoué. Rechargez la page ; si le problème
            persiste, faites une capture du détail ci-dessous et envoyez-la à l'équipe.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button type="button" onClick={() => window.location.reload()}
              style={{ flex: '1 1 auto', padding: '10px 16px', border: 'none', borderRadius: 8, background: '#2563EB', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Recharger la page
            </button>
            <button type="button" onClick={() => { window.location.href = '/'; }}
              style={{ flex: '1 1 auto', padding: '10px 16px', border: '1px solid #CBD5E1', borderRadius: 8, background: '#fff', color: '#0F172A', cursor: 'pointer' }}>
              Retour à l'accueil
            </button>
          </div>
          <details>
            <summary style={{ fontSize: 13, color: '#64748B', cursor: 'pointer' }}>Détail technique</summary>
            <pre style={{ marginTop: 8, padding: 12, background: '#F1F5F9', borderRadius: 8, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#334155' }}>
              {details}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
