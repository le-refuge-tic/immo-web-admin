export const BENIN_VILLES = ['Cotonou', 'Abomey-Calavi'];

export const BENIN_LOCATION_DATA: Record<string, Record<string, string[]>> = {
  Cotonou: {
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

function normalize(s: string) {
  return s.toLowerCase()
    .replace(/[àâäáãå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôöõ]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

export function getAllQuartiers(): string[] {
  const set = new Set<string>();
  for (const ville of BENIN_VILLES) {
    const arrondissements = BENIN_LOCATION_DATA[ville] ?? {};
    for (const qs of Object.values(arrondissements)) {
      for (const q of qs) set.add(q);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
}

export function searchQuartiers(query: string, _ville?: string): string[] {
  if (!query.trim()) return getAllQuartiers();
  const q = normalize(query);
  return getAllQuartiers().filter(candidate => normalize(candidate).includes(q));
}

export function getQuartiersForVille(ville: string): string[] {
  const arrs = BENIN_LOCATION_DATA[ville] ?? {};
  const set = new Set<string>();
  for (const qs of Object.values(arrs)) for (const q of qs) set.add(q);
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
}
