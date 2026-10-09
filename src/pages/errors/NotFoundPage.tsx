import { Link, useNavigate } from 'react-router-dom';

/** Page introuvable (auparavant : redirection silencieuse vers l'accueil). */
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="immo-page">
      <div className="immo-card not-found">
        <div className="not-found-code" aria-hidden="true">404</div>
        <h1 className="not-found-title">Cette page n’existe pas</h1>
        <p className="not-found-text">
          Le lien est peut-être ancien, ou la page a été déplacée. Revenez au tableau de bord ou à la page précédente.
        </p>
        <div className="not-found-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Page précédente</button>
          <Link to="/" className="btn-submit">Tableau de bord</Link>
        </div>
      </div>
    </div>
  );
}
