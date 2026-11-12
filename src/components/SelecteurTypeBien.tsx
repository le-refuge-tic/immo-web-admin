import { useState } from 'react';
import {
  categoriesAvec, sousTypeParCle, sousTypesDe,
  type CategorieBien, type FormulaireBien, type SousTypeReferentiel,
} from '../shared/biens/referentielTypes';

const BLEU = 'var(--c-blue-solid)';

interface SelecteurTypeBienProps {
  /** Clé du sous-type choisi (référentiel), ex. « villa » ; '' si aucun. */
  valeur: string;
  onChange: (cle: string) => void;
  /** Formulaires proposés (défaut : tous). */
  formulaires?: readonly FormulaireBien[];
  /**
   * Sous-type géré par un autre formulaire (guesthouse, salle de fêtes) : l'appelant
   * décide (dialogue, navigation) au lieu de changer la valeur.
   */
  onFormulaireDedie?: (sousType: SousTypeReferentiel) => void;
}

/**
 * Lot 2 — choix du type en deux temps : la catégorie (grandes cartes), puis le sous-type
 * (puces). Types et sous-types ne sont jamais mélangés sur la même ligne.
 */
export default function SelecteurTypeBien({ valeur, onChange, formulaires, onFormulaireDedie }: SelecteurTypeBienProps) {
  const categories = categoriesAvec(formulaires);
  const [categorie, setCategorie] = useState<CategorieBien | ''>(() => sousTypeParCle(valeur)?.categorie ?? '');
  const sousTypes = categorie ? sousTypesDe(categorie, formulaires) : [];

  const choisirSousType = (st: SousTypeReferentiel) => {
    if (st.formulaire !== 'classique' && onFormulaireDedie) onFormulaireDedie(st);
    else onChange(st.cle);
  };

  const choisirCategorie = (cle: CategorieBien) => {
    const liste = sousTypesDe(cle, formulaires);
    // Formulaire dédié (guesthouse, salle) : l'appelant confirme et navigue ; la sélection
    // affichée ne bouge pas, pour qu'une annulation laisse le choix actuel intact.
    if (liste.length === 1 && liste[0].formulaire !== 'classique' && onFormulaireDedie) {
      onFormulaireDedie(liste[0]);
      return;
    }
    setCategorie(cle);
    // Catégorie à un seul sous-type (terrain, guesthouse, salle) : choisi d'office.
    if (liste.length === 1) choisirSousType(liste[0]);
    else if (!liste.some(s => s.cle === valeur) && liste[0]) onChange(liste[0].cle);
  };

  const carte = (actif: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
    padding: '14px 8px', borderRadius: 14, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
    border: `2px solid ${actif ? BLEU : 'var(--c-border)'}`,
    background: actif ? BLEU : 'var(--c-card)', color: actif ? '#fff' : 'var(--c-muted)',
    boxShadow: actif ? '0 4px 14px rgba(37,99,235,.25)' : 'none',
  });
  const puce = (actif: boolean): React.CSSProperties => ({
    padding: '9px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
    border: `2px solid ${actif ? BLEU : 'var(--c-border)'}`,
    background: actif ? 'var(--t-blue-bg)' : 'transparent', color: actif ? 'var(--s-blue)' : 'var(--c-muted)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div role="radiogroup" aria-label="Catégorie de bien"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
        {categories.map(c => (
          <button key={c.cle} type="button" role="radio" aria-checked={c.cle === categorie}
            onClick={() => choisirCategorie(c.cle)} style={carte(c.cle === categorie)}>
            {c.libelle}
          </button>
        ))}
      </div>
      {sousTypes.length > 1 && (
        <div role="radiogroup" aria-label="Type de bien" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sousTypes.map(s => (
            <button key={s.cle} type="button" role="radio" aria-checked={s.cle === valeur}
              onClick={() => choisirSousType(s)} style={puce(s.cle === valeur)}>
              {s.libelle}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
