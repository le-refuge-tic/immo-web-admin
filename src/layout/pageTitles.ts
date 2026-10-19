/** Titres d'onglet par route (préfixe le plus long qui correspond). */
const TITRES: [string, string][] = [
  ['/dashboard', 'Tableau de bord'], ['/commercial-dashboard', 'Tableau de bord'],
  ['/annonces', 'Annonces'], ['/moderation', 'Modération'], ['/quartiers', 'Quartiers'],
  ['/mes-annonces', 'Mes annonces'], ['/mes-visites', 'Mes visites'], ['/mes-clients', 'Mes clients'],
  ['/mon-equipe', 'Mon équipe'], ['/portefeuille-commercial', 'Mon portefeuille'], ['/publier-bien', 'Publier un bien'],
  ['/messages', 'Messages'], ['/supervision', 'Suivi des échanges'], ['/utilisateurs', 'Utilisateurs'],
  ['/loyers', 'Loyers'], ['/finances', 'Finances'], ['/feedbacks', 'Feedbacks'], ['/reclamations', 'Réclamations'],
  ['/liaisons', 'Liaisons gestion'], ['/retraits', 'Retraits MoMo'],
  ['/configuration/profil', 'Mon profil'], ['/configuration/commerciaux', 'Commerciaux'],
  ['/configuration/equipes', 'Équipes'], ['/configuration/proprietaires', 'Propriétaires'],
  ['/configuration/prospects', 'Prospects'], ['/configuration/locataires', 'Locataires'],
  ['/configuration/administrateurs', 'Administrateurs'],
];
const BASE = 'REFUGE Admin';

export function pageTitle(pathname: string): string {
  const match = TITRES.filter(([p]) => pathname === p || pathname.startsWith(p + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match ? `${match[1]} | ${BASE}` : BASE;
}
