export const formatPrix = (prix: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(prix);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(date));

export const labelType: Record<string, string> = {
  maison:        'Maison',
  appart_vide:   'Appartement vide',
  appart_meuble: 'Appartement meublé',
  guesthouse:    'Guesthouse',
  terrain:       'Terrain',
};

export const labelTransaction: Record<string, string> = {
  vente:    'Vente',
  location: 'Location',
};

export const labelStatut: Record<string, string> = {
  actif:   'Actif',
  vendu:   'Vendu',
  loue:    'Loué',
  archive: 'Archivé',
};

export const labelRole: Record<string, string> = {
  prospect:     'Prospect',
  locataire:    'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
  admin:        'Administrateur',
  super_admin:  'Super Admin',
  detenteur:    'Propriétaire (dépr.)', // rétrocompat
};

export const statutVariant: Record<string, string> = {
  actif:   'success',
  vendu:   'primary',
  loue:    'info',
  archive: 'secondary',
};
