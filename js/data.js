// Leçons : thèmes progressifs. Chaque mot renvoie à une entrée du dictionnaire
// (js/dictionnaire.js), qui contient les vraies vidéos de signeurs (licences libres).
// Un mot introuvable dans le dictionnaire est simplement ignoré.

window.LSF_DATA = {
  themes: [
    {
      id: "salutations", titre: "Salutations et politesse", icone: "main", couleur: "#c0694b", niveau: 1,
      mots: ["Bonjour", "Salut", "Au revoir", "À bientôt", "Bonsoir", "Bonne journée", "Ça va", "Merci", "S'il vous plaît", "De rien", "Pardon", "Bon appétit"]
    },
    {
      id: "presenter", titre: "Se présenter", icone: "bulle", couleur: "#3a6ea5", niveau: 1,
      mots: ["Moi", "Toi", "Prénom", "Sourd", "Entendant", "LSF", "Signer", "Comprendre", "Je ne comprends pas", "Je sais", "Je ne sais pas", "Habiter"]
    },
    {
      id: "oui-non", titre: "Oui, non et avis", icone: "pouce", couleur: "#1f6f64", niveau: 1,
      mots: ["Oui", "Non", "Je suis d'accord", "Pas d'accord", "Je veux", "Je ne veux pas", "J'aime", "Je n'aime pas", "Je peux", "Je ne peux pas", "Pas grave", "Super"]
    },
    {
      id: "questions", titre: "Poser des questions", icone: "question", couleur: "#b98a2e", niveau: 1,
      mots: ["Qui ?", "Quoi ?", "Où ?", "Quand ?", "Comment", "Pourquoi ?", "Combien"]
    },
    {
      id: "famille", titre: "La famille", icone: "famille", couleur: "#5f8466", niveau: 2,
      mots: ["Famille", "Maman", "Papa", "Frère", "Soeur", "Enfant", "Bébé", "Fils", "Fille", "Grand-mère", "Grand-père", "Cousin", "Oncle", "Tante"]
    },
    {
      id: "emotions", titre: "Les émotions", icone: "sourire", couleur: "#b0607a", niveau: 2,
      mots: ["Content", "Triste", "Fatigué", "Colère", "Peur", "Rire", "Pleurer", "Sourire", "Fier", "Honte", "Gentil", "Méchant"]
    },
    {
      id: "couleurs", titre: "Les couleurs", icone: "palette", couleur: "#75598a", niveau: 2,
      mots: ["Blanc", "Noir", "Rouge", "Bleu", "Vert", "Jaune", "Orange", "Rose", "Violet", "Gris", "Marron", "Beige"]
    },
    {
      id: "temps", titre: "Le temps qui passe", icone: "horloge", couleur: "#4a7896", niveau: 2,
      mots: ["Aujourd'hui", "Demain", "Hier", "Maintenant", "Matin", "Midi", "Soir", "Bientôt", "Toujours", "Jamais", "Week-end", "Vacances"]
    },
    {
      id: "manger", titre: "Manger et boire", icone: "tasse", couleur: "#b5753f", niveau: 3,
      mots: ["Manger", "Boire", "Eau", "Pain", "Café", "Thé", "Fromage", "Pomme", "Banane", "Gâteau", "Chocolat", "Restaurant"]
    },
    {
      id: "animaux", titre: "Les animaux", icone: "patte", couleur: "#76863f", niveau: 3,
      mots: ["Chat", "Chien", "Poisson", "Lapin", "Cochon", "Vache", "Mouton", "Poule", "Canard", "Souris", "Ours", "Girafe"]
    },
    {
      id: "lieux", titre: "En ville", icone: "maison", couleur: "#55707a", niveau: 3,
      mots: ["Maison", "École", "Ville", "Gare", "Hôpital", "Bibliothèque", "Banque", "Mairie", "Plage", "Piscine", "Cinéma", "Bus"]
    },
    {
      id: "actions", titre: "Les actions du quotidien", icone: "eclair", couleur: "#93566b", niveau: 3,
      mots: ["Aller", "Venir", "Partir", "Attendre", "Travailler", "Dormir", "Lire", "Écrire", "Regarder", "Jouer", "Acheter", "Apprendre"]
    }
  ]
};
