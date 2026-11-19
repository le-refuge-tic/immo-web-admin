import { postCommerciaux } from '../../api/postCommerciaux';
import NouveauCompteModal from './NouveauCompteModal';

export default function GestionCommercialModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (u: any) => void;
}) {
  return (
    <NouveauCompteModal
      titre="Nouveau commercial"
      description="Ce compte aura accès aux annonces et à la messagerie. Il ne peut pas valider de biens."
      libelleBouton="Créer le commercial"
      libelleEnCours="Création…"
      placeholderEmail="commercial@refuge-immo.com"
      ariaLabel="Gérer un commercial"
      creer={async payload => {
        const res = await postCommerciaux.create(payload);
        onCreated(res.user ?? res);
      }}
      onClose={onClose}
    />
  );
}
