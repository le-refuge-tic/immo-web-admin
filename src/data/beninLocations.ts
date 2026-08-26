export const BENIN_VILLES = ['Cotonou', 'Abomey-Calavi'];

export const BENIN_LOCATION_DATA: Record<string, Record<string, string[]>> = {
  'Cotonou': {
    '1er Arrondissement': ['Avotrou-Aïmonlonfidé','Avotrou-Gbégo','Avotrou-Houézèkomè','Dandji','Dandji-Hokanmè','Donatin','Finagnon','N\'vènamèdé','Suru-Léré','Tanto','Tchanhounkpamè','Tokplégbé','Yagbé'],
    '2ème Arrondissement': ['Ahouassa','Djèdjèlayé','Gankpodo','Irédé','Kowégbo','Kpondehou Tcheme','Lom-Nava','Minontchou','Sènadé','Sènadé Sekou','Yénawa','Yénawa Daho'],
    '3ème Arrondissement': ['Adjégounlè','Agbato','Agbondjèdo','Ayélawadjè 1','Ayélawadjè 2','Fifatin','Gbénonkpo','Hlacomey','Kpankpan','Midombo','Sègbeya-Nord','Sègbeya-Sud'],
    '5ème Arrondissement': ['Avlékété-Jonquet','Bokossi Tokpa','Dota','Gbédokpo','Gbéto','Guinkomey','Mifongou','Missèbo','Missité','Nouveau-Pont','Tokpa-Hoho','Xwlakodji-Kpodji','Xwlakodji-Plage','Zongo Ehuzu','Zongo Nima'],
    '6ème Arrondissement': ['Ahouansori Ladji','Ahouansori Agué','Ahouansori Towéta','Ahouansori Towéta Kpota','Aïdjèdo','Aïdjèdo Ahito','Aïdjèdo Gbègo','Aïdjèdo Vignon','Dantokpa','Djidjè Aïtchédji','Gbédjromédé','Gbédjromédé Sud','Hindé Nord','Jéricho Nord','Jéricho Sud'],
    '7ème Arrondissement': ['Dagbédji','Enagnon-Sikè','Fignon-Sikè','Gbèdomidji','Gbènan','Gbèwa','Missité-Sikè','Sèdami','Sèdjro Saint-Michel','Sèhogan','Todoté','Yévèdo'],
    '8ème Arrondissement': ['Agontinkon','Gbèdagba','Houéhoun','Houénoussou','Médédjro','Minonkpo','Tonato'],
    '9ème Arrondissement': ['Fifadji','Kindonou','Mènontin','Vossa','Vossa-Kpodji','Zogbo','Zogbohouè'],
    '10ème Arrondissement': ['Gbénonkpo','Midédji','Missèkplé','Missogbé','Sètovi','Yenawa-Fifadji'],
    '11ème Arrondissement': ['Gbèdiga Guèdèhounguè','Gbégamey Ahito','Gbégamey Centre','Gbégamey Dodo Ayidjè','Gbégamey Gbagoudo','Gbégamey Mifongou','Houéyiho','Houéyiho Tanou','Saint Jean Gbèdiga','Vodjè Allobatin','Vodjè Ayidoté','Vodjè Centre','Vodjè Finagnon'],
    '12ème Arrondissement': ['Ahouanlèko','Aïbatin Dodo','Akogbato','Cadjèhoun Agonga','Cadjèhoun Aupiais','Cadjèhoun Azalokogon','Cadjèhoun Détinsa','Cadjèhoun Gare','Cadjèhoun Kpota','Fidjrossè Centre','Fidjrossè Kpota','Fiyégnon Houta','Fiyégnon Jacquot','Gbodjètin','Haie Vive-Cocotiers','Hlazounto','Vodjè Kpota'],
    '13ème Arrondissement': ['Agla Agongbomè','Agla Akplomey','Agla Centre','Agla Figaro','Agla Finafa','Agla Les Pylônes','Agla Petit Château','Aïbatin Kpota','Cité Eucharistie','Gbèdégbé','Houénoussou'],
  },
  'Abomey-Calavi': {
    'Abomey-Calavi (1er)': ['Agori','Kansoukpa','Agamadin','Gbodjo','Sèmè','Tokpa-Zoungo','Cité-la-Victoire','Tokpa-Zoungo-Sud','Zogbadjè','Tankpê-Yoho','Tokpa-Zoungo-Nord','Tchinangbégbo','Finafa','Alédjo','Aïtchédji','Fandji','Aïfa-Calavi','Zopah-Kokpo','Cité-les-Palmiers','Zoundja','Fanto','Houédakomè','Atadjè','Dodja'],
    'Akassato (2ème)': ['Adjagbo','Agassa-Godomey','Agonmè','Agonsoundja','Akassato-Centre','Gbétagbo','Glo-Tokpa','Houèkè-Gbo','Houèkè-Honou','Kolétin','Kpodji-les-Monts','Missessinto','Zèkanmè-Domè','Zopah Palmeraie','Zopah-Akassato','Zayiéra','Agonsoudja'],
    'Godomey (3ème)': ['Godomey Centre','Togoudo','Cococodji','Womey','Fignonhou','Dekoungbé','Salamey','Ayiginnou','Togbin','Tankpè','Zopah','Gbedjromédé-Calavi','Togbin-Daho','Togbin-Kpèvi','Togbin-Fandji','Djèkpota','Aklakou','Ganganzounmè','Ningboto','Godomey-N\'Gbèho','Dèkoungbé-Église','Gninkindji','Hêdomè','Abikouholi','Amahoun','Agbo Codji Sèdégbé','Logbozounkpa','Plateau','Zounga','Dénou','Cocotomey','Ounvènoumèdé','Sèdjannako','Aïmèvo','Gbodjè-Womey','Atrokpo-Codji','Fandji','Tokpa','La-Paix','Yolomahouto','Finafa','Hlouacomey','Nonhouénou','Hounsa-Agbodokpa','Godomey-Togoudo','Sodo','Sèdomey','Djoukpa-Togoudo','Gbègnigan-Midokpo','Assrossa','Womey-Centre','Agonkanmey','Womey-Yénawa','Yénandjro','Alègléta','Tankpè-Togoudo'],
    'Glo-Djigbé (4ème)': ['Glo-Djigbé Centre','Zèkanmè','Houndjava','Kpéssou','Ahouato','Adjagbo','Agongbé','Azonsa','Domey-Gbo','Agonkèssa','Adjamè','Yêkon-Aga','Yèkon-Do','Espace-Saint','Djissoukpa','Lohoussa','Golo-Fanto','Alladacomè'],
    'Hêvié (5ème)': ['Hêvié Centre','Adovié','Houin','Ouèkèhonou','Sedjè','Houndonougbo','Akossavié','Sogan','Houinmè-Daho','Handomè','Houinmè','Hounzévié','Hounzounmé','Kissovié','Fonkomè','Zoungo','Dossounou','Salédja','Gbécomè','Akokponawa'],
    'Kpanroun (6ème)': ['Kpanroun Centre','Lissa','Tokpa-Domè','Agassa-Godomè','Avadjètomè','Kpé','Fandji','Dèdo','Kplassouhoué','Avagbé','Kpaviédja','Hadjanaho','Bozoun','Lokogbé-Kpèvi','Djigbo','Anagbo','Ahowégodo'],
    'Ouèdo (7ème)': ['Ouèdo Centre','Aïfa','Sèdjè-Dénou','Djèrègbé','Houèto','Ahouato','Alansankomè','Dessato','Adjagbo-Aïdjèdo','Adjagbo','Kpossidja','Dassèkomey','Kpossidja 2','Dodja'],
    'Togba (8ème)': ['Togba Centre','Tokan','Maria-Gléta','Adjagbo','Houèto','Yévèdo','Tankpè-Tanmè','Sakomè','Fifonsi','Doga','Aïdégnon','Somè','Ahossougbéta','Ouéga-Tokpa','Ouéga-Agué','Drabo'],
    'Zinvié (9ème)': ['Adjogansa','Dangbodji','Dokomey','Gbodjè','Gbodjoko','Kpotomè','Sokan','Wawata','Yévié','Zinvié','Zinvié-Agolèdji','Yèvié-Nougo','Zinvié-Fandji','Tanmè','Zinvié-Zounmè','Wawata-Todja','Houégoudo'],
  },
};

// Tous les quartiers triés (Cotonou + Abomey-Calavi)
const _allSet = new Set<string>();
Object.values(BENIN_LOCATION_DATA).forEach(arrs =>
  Object.values(arrs).forEach(qs => qs.forEach(q => _allSet.add(q)))
);
export const ALL_QUARTIERS: string[] = [..._allSet].sort((a, b) => a.localeCompare(b, 'fr'));

// Quartiers filtrés par ville
export function getQuartiersByVille(ville: string): string[] {
  const data = BENIN_LOCATION_DATA[ville];
  if (!data) return ALL_QUARTIERS;
  const set = new Set<string>();
  Object.values(data).forEach(qs => qs.forEach(q => set.add(q)));
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
}

// Quartiers filtrés par arrondissement
export function getQuartiersByArrondissement(ville: string, arr: string): string[] {
  return BENIN_LOCATION_DATA[ville]?.[arr] ?? [];
}

// Arrondissements pour une ville
export function getArrondissements(ville: string): string[] {
  return Object.keys(BENIN_LOCATION_DATA[ville] ?? {});
}
