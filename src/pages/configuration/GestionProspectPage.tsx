import UsersMgmtPage from './UsersMgmtPage';

export default function GestionProspectPage() {
  return (
    <UsersMgmtPage
      title="Gestion des prospects"
      subtitle="Utilisateurs à la recherche d'un bien (achat ou location)"
      roleFilter="prospect"
      emptyLabel="Aucun prospect trouvé"
    />
  );
}
