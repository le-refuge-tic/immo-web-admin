import UsersMgmtPage from './UsersMgmtPage';

export default function GestionProprietairePage() {
  return (
    <UsersMgmtPage
      title="Gestion des propriétaires"
      subtitle="Propriétaires et bailleurs qui publient des biens"
      roleFilter="proprietaire"
      emptyLabel="Aucun propriétaire trouvé"
    />
  );
}
