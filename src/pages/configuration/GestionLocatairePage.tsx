import UsersMgmtPage from './UsersMgmtPage';

export default function GestionLocatairePage() {
  return (
    <UsersMgmtPage
      title="Gestion des locataires"
      subtitle="Utilisateurs ayant pris un logement via la plateforme"
      roleFilter="locataire"
      emptyLabel="Aucun locataire trouvé"
    />
  );
}
