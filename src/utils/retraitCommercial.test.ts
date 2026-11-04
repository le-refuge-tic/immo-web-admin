import { describe, expect, it } from 'vitest';
import {
  estEnCours,
  infoStatut,
  libelleOperateur,
  messageApresDemande,
  messageMontant,
  numeroLocal,
  numeroValide,
  raisonBlocage,
} from './retraitCommercial';

const ok = { numero_retrait: '+2290197000000', masque: '••••••0000', source: 'compte', operateur_retrait: 'mtn' as const, retraits_suspendus_jusqu_a: null };

describe('messageMontant', () => {
  it('silencieux tant que le champ est vide, vide quand le montant est valide', () => {
    expect(messageMontant('', 8000)).toBe('');
    expect(messageMontant('500', 8000)).toBe('');
    expect(messageMontant('8000', 8000)).toBe('');
  });
  it('refuse sous le minimum, au-dessus du solde, hors maximum, non entier', () => {
    expect(messageMontant('499', 8000)).toMatch(/minimum de retrait est de 500 FCFA/);
    expect(messageMontant('9000', 8000)).toMatch(/dépasse votre solde/);
    expect(messageMontant('60000', 100000, { min: 500, max: 50000 })).toMatch(/maximum par retrait/);
    expect(messageMontant('1500.5', 8000)).toMatch(/entier/);
    expect(messageMontant('abc', 8000)).toMatch(/chiffres/);
  });
  it('le solde est testé avant le maximum ; les limites du serveur remplacent le défaut', () => {
    expect(messageMontant('60000', 8000, { max: 50000 })).toMatch(/dépasse votre solde/);
    expect(messageMontant('900', 8000, { min: 1000 })).toMatch(/1[\s  ]000 FCFA/);
  });
});

describe('raisonBlocage', () => {
  it('rien à signaler quand tout est en place, ou tant que les informations ne sont pas chargées', () => {
    expect(raisonBlocage(ok)).toBeNull();
    expect(raisonBlocage(null)).toBeNull();
  });
  it('demande l’opérateur, signale l’absence de numéro', () => {
    expect(raisonBlocage({ ...ok, operateur_retrait: null })).toMatch(/MTN ou Moov/);
    expect(raisonBlocage({ ...ok, numero_retrait: null })).toMatch(/numéro/);
  });
  it('annonce la suspension de 48 h tant qu’elle court, plus après', () => {
    const futur = new Date(Date.now() + 3600_000).toISOString();
    const passe = new Date(Date.now() - 3600_000).toISOString();
    expect(raisonBlocage({ ...ok, retraits_suspendus_jusqu_a: futur })).toMatch(/suspendus jusqu'au/);
    expect(raisonBlocage({ ...ok, retraits_suspendus_jusqu_a: passe })).toBeNull();
  });
});

describe('statuts', () => {
  it.each([
    ['en_attente', 'attente'], ['en_cours', 'attente'], ['en_attente_fonds', 'attente'],
    ['envoye', 'succes'], ['echoue', 'echec'], ['rejete', 'echec'],
  ])('%s → %s', (statut, ton) => {
    expect(infoStatut(statut).ton).toBe(ton);
  });
  it('seul un virement non terminé déclenche le rafraîchissement', () => {
    expect(estEnCours('en_cours')).toBe(true);
    expect(estEnCours('envoye')).toBe(false);
    expect(estEnCours('echoue')).toBe(false);
  });
  it('aucun détail technique dans les libellés', () => {
    for (const s of ['en_attente', 'en_cours', 'en_attente_fonds', 'envoye', 'echoue', 'rejete']) {
      expect(infoStatut(s).label).not.toMatch(/fedapay|payout|solde/i);
    }
  });
});

describe('messageApresDemande', () => {
  it('lancé : on annonce l’envoi, pas l’arrivée', () => {
    expect(messageApresDemande({ statut: 'en_cours' })).toMatchObject({ ok: true, texte: expect.stringMatching(/lancé/) });
  });
  it('échec immédiat : phrase du serveur, présenté comme un échec', () => {
    const m = messageApresDemande({ statut: 'echoue', message: 'Le virement a échoué. Le montant a été remis sur votre portefeuille.' });
    expect(m.ok).toBe(false);
    expect(m.texte).toMatch(/remis sur votre portefeuille/);
  });
  it('attente de fonds : jamais présentée comme un échec', () => {
    expect(messageApresDemande({ statut: 'en_attente_fonds' }).ok).toBe(true);
  });
});

describe('numéros', () => {
  it('numeroLocal retire l’indicatif 229', () => {
    expect(numeroLocal('+2290197000000')).toBe('0197000000');
    expect(numeroLocal('01 97 00 00 00')).toBe('0197000000');
    expect(numeroLocal(null)).toBe('');
  });
  it('numeroValide : 10 chiffres commençant par 01', () => {
    expect(numeroValide('0197000000')).toBe(true);
    expect(numeroValide('+2290197000000')).toBe(true);
    expect(numeroValide('97000000')).toBe(false);
    expect(numeroValide('0297000000')).toBe(false);
  });
  it('libelleOperateur', () => {
    expect(libelleOperateur('mtn')).toBe('MTN');
    expect(libelleOperateur('moov')).toBe('Moov');
    expect(libelleOperateur(null)).toBe('');
  });
});
