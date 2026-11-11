// Phrases simples pour les exercices « Comprendre une phrase » et « Construire une phrase ».
//
// Chaque phrase est une suite de signes du dictionnaire (de vraies vidéos, mises bout à
// bout), dans l'ordre simplifié enseigné aux débutants en LSF :
//   - le TEMPS d'abord (quand ?), puis le LIEU (où ?), puis QUI, puis l'ACTION ;
//   - les mots interrogatifs (où ? quand ? pourquoi ?) à la fin ;
//   - l'adjectif ou l'état APRÈS ce qu'il décrit (« voiture rouge ») ;
//   - le sujet dont on parle d'abord, puis ce qu'on en dit (« chocolat, j'aime »).
// En vraie conversation, l'ordre est plus souple, et le visage, le regard et l'espace
// devant soi portent une grande partie de la grammaire. Aucun signe n'est inventé ici :
// chaque mot renvoie à une vidéo du dictionnaire (vérifié par tests/donnees.test.js).
//
// roles : la fonction de chaque signe, pour l'explication après la réponse.

window.PHRASES = [
  { signes: ["Demain", "Restaurant", "Moi", "Manger"], roles: ["temps", "lieu", "qui", "action"], fr: "Demain, je mange au restaurant." },
  { signes: ["Hier", "Cinéma", "Papa", "Aller"], roles: ["temps", "lieu", "qui", "action"], fr: "Hier, papa est allé au cinéma." },
  { signes: ["Aujourd'hui", "Piscine", "Soeur", "Nager"], roles: ["temps", "lieu", "qui", "action"], fr: "Aujourd'hui, ma sœur nage à la piscine." },
  { signes: ["Soir", "Maison", "Moi", "Lire"], roles: ["temps", "lieu", "qui", "action"], fr: "Le soir, je lis à la maison." },
  { signes: ["Matin", "École", "Enfant", "Aller"], roles: ["temps", "lieu", "qui", "action"], fr: "Le matin, l'enfant va à l'école." },
  { signes: ["Week-end", "Montagne", "Nous", "Marcher"], roles: ["temps", "lieu", "qui", "action"], fr: "Le week-end, nous marchons à la montagne." },
  { signes: ["Hier", "Hôpital", "Maman", "Travailler"], roles: ["temps", "lieu", "qui", "action"], fr: "Hier, maman a travaillé à l'hôpital." },
  { signes: ["Aujourd'hui", "Maison", "Bébé", "Dormir"], roles: ["temps", "lieu", "qui", "action"], fr: "Aujourd'hui, le bébé dort à la maison." },
  { signes: ["Midi", "Restaurant", "Frère", "Manger"], roles: ["temps", "lieu", "qui", "action"], fr: "À midi, mon frère mange au restaurant." },
  { signes: ["Vacances", "Mer", "Famille", "Aller"], roles: ["temps", "lieu", "qui", "action"], fr: "En vacances, la famille va à la mer." },
  { signes: ["Soir", "Maison", "Papa", "Travailler"], roles: ["temps", "lieu", "qui", "action"], fr: "Le soir, papa travaille à la maison." },
  { signes: ["Aujourd'hui", "École", "Nous", "Apprendre"], roles: ["temps", "lieu", "qui", "action"], fr: "Aujourd'hui, nous apprenons à l'école." },
  { signes: ["Demain", "Maison", "Toi", "Venir"], roles: ["temps", "lieu", "qui", "action"], fr: "Demain, tu viens à la maison." },
  { signes: ["Hier", "Ville", "Vous", "Acheter"], roles: ["temps", "lieu", "qui", "action"], fr: "Hier, vous avez fait des achats en ville." },
  { signes: ["Demain", "Gare", "Moi", "Attendre"], roles: ["temps", "lieu", "qui", "action"], fr: "Demain, j'attends à la gare." },
  { signes: ["Week-end", "Piscine", "Enfant", "Jouer"], roles: ["temps", "lieu", "qui", "action"], fr: "Le week-end, l'enfant joue à la piscine." },
  { signes: ["Maintenant", "Moi", "Partir"], roles: ["temps", "qui", "action"], fr: "Maintenant, je pars." },
  { signes: ["Soir", "Nous", "Danser"], roles: ["temps", "qui", "action"], fr: "Le soir, nous dansons." },
  { signes: ["Aujourd'hui", "Moi", "Fatigué"], roles: ["temps", "qui", "état"], fr: "Aujourd'hui, je suis fatigué." },
  { signes: ["Hier", "Soeur", "Triste"], roles: ["temps", "qui", "état"], fr: "Hier, ma sœur était triste." },
  { signes: ["Papa", "Malade"], roles: ["qui", "état"], fr: "Papa est malade." },
  { signes: ["Maman", "Content"], roles: ["qui", "état"], fr: "Maman est contente." },
  { signes: ["Moi", "Sourd"], roles: ["qui", "état"], fr: "Je suis sourd." },
  { signes: ["Moi", "Entendant"], roles: ["qui", "état"], fr: "Je suis entendant." },
  { signes: ["Voiture", "Rouge"], roles: ["chose", "qualité"], fr: "Une voiture rouge." },
  { signes: ["Chat", "Petit"], roles: ["chose", "qualité"], fr: "Un petit chat." },
  { signes: ["Maison", "Grand"], roles: ["chose", "qualité"], fr: "Une grande maison." },
  { signes: ["Vélo", "Bleu"], roles: ["chose", "qualité"], fr: "Un vélo bleu." },
  { signes: ["Chocolat", "J'aime"], roles: ["sujet", "avis"], fr: "J'aime le chocolat." },
  { signes: ["Café", "Je n'aime pas"], roles: ["sujet", "avis"], fr: "Je n'aime pas le café." },
  { signes: ["Fromage", "Je veux"], roles: ["sujet", "avis"], fr: "Je veux du fromage." },
  { signes: ["Gâteau", "Je ne veux pas"], roles: ["sujet", "avis"], fr: "Je ne veux pas de gâteau." },
  { signes: ["Toi", "Habiter", "Où ?"], roles: ["qui", "action", "question"], fr: "Où habites-tu ?" },
  { signes: ["Toi", "Partir", "Quand ?"], roles: ["qui", "action", "question"], fr: "Quand pars-tu ?" },
  { signes: ["Maman", "Où ?"], roles: ["qui", "question"], fr: "Où est maman ?" },
  { signes: ["Toi", "Pleurer", "Pourquoi ?"], roles: ["qui", "action", "question"], fr: "Pourquoi pleures-tu ?" }
];

// Les règles, expliquées après chaque réponse (une par type de rôle rencontré).
window.REGLES_PHRASES = {
  temps: "Le temps (hier, demain, le soir…) se place au début : il pose le cadre de toute la phrase.",
  lieu: "Le lieu vient ensuite, avant la personne et l'action : on « installe » le décor.",
  question: "Le mot interrogatif (où ? quand ? pourquoi ?) se place à la fin, avec les sourcils froncés.",
  "qualité": "L'adjectif se place après la chose qu'il décrit : « voiture rouge ».",
  "état": "L'état (fatigué, malade, content…) vient après la personne, sans verbe « être ».",
  avis: "On nomme d'abord ce dont on parle, puis on donne son avis : « chocolat, j'aime ».",
  action: "L'action (le verbe) arrive après qui la fait, souvent en fin de phrase."
};
