import { postAdmins } from '../../api/postAdmins';
import NouveauCompteModal from './NouveauCompteModal';

export default function GestionAdminModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (u: any) => void;
}) {
  return (
    <NouveauCompteModal
      titre="Nouvel administrateur"
      description="Ce compte aura accès à l'interface d'administration. Seul vous (Super Admin) pourrez le supprimer."
      libelleBouton="Créer l'administrateur"
      libelleEnCours="Création…"
      placeholderEmail="admin@refuge-immo.com"
      ariaLabel="Gérer un administrateur"
      creer={async payload => {
        const res = await postAdmins.create(payload);
        onCreated(res.user);
      }}
      onClose={onClose}
    />
  );
}
