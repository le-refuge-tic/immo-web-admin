import { describe, expect, it } from 'vitest'
import { lienAlerte, toastPourAlerte } from './alertes'

describe('lot 8 : alertes de l’administration', () => {
  it('lien : la modération pour les biens à valider, la fiche du bien sinon (selon le rôle)', () => {
    expect(lienAlerte({ type: 'bien_a_valider', meta: { bien_id: 4 } }, true)).toBe('/moderation')
    expect(lienAlerte({ type: 'bien_modifie', meta: { bien_id: 4 } }, true)).toBe('/moderation')
    expect(lienAlerte({ type: 'bien_rejete', meta: { bien_id: 4 } }, true)).toBe('/annonces/4')
    expect(lienAlerte({ type: 'bien_rejete', meta: { bien_id: 4 } }, false)).toBe('/mes-annonces/4')
    expect(lienAlerte({ type: 'retrait', meta: {} }, false)).toBeNull()
  })

  it('toast : décisions et biens à valider, jamais une simple lecture', () => {
    expect(toastPourAlerte({ raison: 'nouvelle', type: 'bien_a_valider', titre: 'Nouveau bien à valider', corps: 'Bien #4' }))
      .toEqual({ message: 'Nouveau bien à valider — Bien #4', ton: 'info' })
    expect(toastPourAlerte({ raison: 'nouvelle', type: 'bien_approuve', titre: 'Approuvée', corps: '' })?.ton).toBe('success')
    expect(toastPourAlerte({ raison: 'nouvelle', type: 'modification_rejetee', titre: 'Refusée' })?.ton).toBe('error')
    expect(toastPourAlerte({ raison: 'lue' })).toBeNull()
    expect(toastPourAlerte({ raison: 'nouvelle', type: 'nouveau_message', titre: 'Message' })).toBeNull()
  })
})
