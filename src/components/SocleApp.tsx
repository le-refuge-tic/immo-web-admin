import { useCallback, type ReactNode } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmProvider } from '../shared/dialogues/confirmation';
import { GestionEnvoisProvider } from '../shared/uploads/GestionEnvois';
import type { Envoyeur } from '../shared/uploads/fileEnvoi';
import { postBien } from '../api/postBien';
import ConfirmDialog from './ConfirmDialog';
import IndicateurEnvois from './IndicateurEnvois';

const envoyerMedia: Envoyeur = async (bienId, el) => {
  const fichier = el.fichier instanceof File ? el.fichier : new File([el.fichier], el.nom, { type: el.fichier.type });
  if (el.genre === 'video') await postBien.uploadVideo(bienId, fichier);
  else await postBien.uploadPhoto(bienId, fichier, el.id);
};

/** Lot 1 — dialogues de confirmation et envois en arrière-plan, communs à toutes les pages. */
export default function SocleApp({ children }: { children: ReactNode }) {
  const showToast = useToast();
  const { user } = useAuth();
  const utilisateurId: number | null = user?.id ?? null;
  const notifier = useCallback((message: string, ton: 'success' | 'error' | 'info') => showToast(message, ton), [showToast]);
  return (
    <ConfirmProvider Rendu={ConfirmDialog}>
      <GestionEnvoisProvider envoyer={envoyerMedia} notifier={notifier} utilisateurId={utilisateurId}>
        {children}
        <IndicateurEnvois />
      </GestionEnvoisProvider>
    </ConfirmProvider>
  );
}
