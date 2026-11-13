// Dessin du personnage (avatar) d'un profil, en SVG, dans le style sobre du site.
// Chaque trait est un indice dans les listes ci-dessous (vérifiés par Avatar.verifier, js/progress.js).
// Dessin original, fait pour Signes en main.

Object.assign(Avatar, {
  CHOIX: {
    peau: [["#f6d9c6", "Très claire"], ["#eec3a3", "Claire"], ["#dba47e", "Mate"], ["#bb7f57", "Hâlée"], ["#8f5b3c", "Brune"], ["#5e3b28", "Foncée"]],
    coiffure: [["chauve", "Sans cheveux"], ["court", "Courts"], ["meche", "Mèche"], ["rase", "Rasés"], ["carre", "Carré"],
      ["long", "Longs"], ["queue", "Queue de cheval"], ["chignon", "Chignon"], ["boucles", "Bouclés"], ["afro", "Afro"]],
    cheveux: [["#1f1a17", "Noirs"], ["#4a3121", "Bruns"], ["#7a4a2a", "Châtains"], ["#a24a28", "Roux"], ["#d6ad66", "Blonds"],
      ["#a8a49d", "Gris"], ["#e8e3da", "Blancs"], ["#3f5f9e", "Bleus"], ["#b9667f", "Roses"]],
    lunettes: [["", "Sans"], ["rondes", "Rondes"], ["carrees", "Carrées"]],
    barbe: [["", "Sans"], ["moustache", "Moustache"], ["barbe", "Barbe"]],
    haut: [["tshirt", "T-shirt"], ["col", "Chemise"], ["capuche", "Sweat à capuche"]],
    tenue: [["#2f6b5e", "Sapin"], ["#b8683f", "Terre cuite"], ["#4a6fa5", "Bleu"], ["#7d4e6e", "Prune"],
      ["#c9a23f", "Moutarde"], ["#5f6b66", "Ardoise"], ["#c97b7b", "Vieux rose"], ["#e9e2d3", "Écru"]],
    fond: [["#e0ebe6", "Menthe"], ["#f5e4d8", "Pêche"], ["#e8e3d7", "Sable"], ["#dde6f2", "Ciel"],
      ["#eee0ea", "Lilas"], ["#f3ead0", "Paille"], ["#dfe3e1", "Brume"], ["#f2dcdc", "Rose pâle"]]
  },
  /** Noms des traits pour l'éditeur, dans l'ordre d'affichage. */
  ETIQUETTES: { peau: "Peau", coiffure: "Coiffure", cheveux: "Couleur des cheveux", lunettes: "Lunettes", barbe: "Barbe",
    haut: "Haut", tenue: "Couleur du haut", fond: "Fond" },

  /** Assombrit (k < 0) ou éclaircit (k > 0) une couleur #rrggbb. */
  nuance(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k));
    return "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
  },

  /** SVG du personnage. taille en pixels ; titre : texte lu par les lecteurs d'écran (sinon décoratif). */
  svg(avatar, taille = 64, titre = "") {
    const a = this.verifier(avatar), C = this.CHOIX;
    const peau = C.peau[a.peau][0], ombre = this.nuance(peau, -0.12);
    const ch = C.cheveux[a.cheveux][0], chF = this.nuance(ch, ch === "#e8e3da" ? -0.12 : -0.18);
    const tenue = C.tenue[a.tenue][0], tenueF = this.nuance(tenue, -0.18);
    const coiffure = C.coiffure[a.coiffure][0], haut = C.haut[a.haut][0];
    const fond = C.fond[a.fond][0];
    const trait = "#2b2522";
    const id = "av" + Math.random().toString(36).slice(2, 8);

    // Cheveux derrière la tête (longueurs qui dépassent sur les épaules)
    const arriere = {
      carre: `<path d="M30 44 C28 26 38 17 50 17 C62 17 72 26 70 44 L71 64 C64 67 36 67 29 64 Z" fill="${ch}"/>`,
      long: `<path d="M30 44 C28 26 38 17 50 17 C62 17 72 26 70 44 L74 84 C62 90 38 90 26 84 Z" fill="${ch}"/>`,
      queue: `<path d="M64 30 C78 34 80 52 74 70 C72 60 70 48 62 40 Z" fill="${ch}"/>`,
      chignon: `<circle cx="50" cy="16" r="9" fill="${ch}"/>`,
      boucles: `<path d="M27 50 C20 40 26 22 36 19 C40 11 60 11 64 19 C74 22 80 40 73 50 C78 58 72 66 66 64 L34 64 C28 66 22 58 27 50 Z" fill="${ch}"/>`,
      afro: `<circle cx="50" cy="36" r="26" fill="${ch}"/>`
    }[coiffure] || "";

    // Cheveux sur le front
    const avant = {
      court: `<path d="M32.5 43 C31 27 40 20 50 20 C61 20 70 27 67.5 43 C66 36 61 30 50 30 C40 30 34 35 32.5 43 Z" fill="${ch}"/>`,
      meche: `<path d="M32.5 44 C30 27 40 19 51 19 C62 19 70 27 67.5 42 C64 33 56 28 46 33 C41 36 36 38 32.5 44 Z" fill="${ch}"/>`,
      rase: `<path d="M33 40 C32 27 41 21 50 21 C59 21 68 27 67 40 C64 32 58 28 50 28 C42 28 36 32 33 40 Z" fill="${ch}" opacity=".55"/>`,
      carre: `<path d="M32 46 C30 27 40 19 50 19 C60 19 70 27 68 46 C66 38 64 33 60 30 C54 34 42 34 37 31 C34 35 33 40 32 46 Z" fill="${ch}"/>`,
      long: `<path d="M32 48 C30 27 40 19 50 19 C60 19 70 27 68 48 C66 38 62 32 50 29 C44 32 38 36 32 48 Z" fill="${ch}"/>`,
      queue: `<path d="M32.5 43 C31 27 40 20 50 20 C61 20 70 27 67.5 43 C65 35 59 30 50 30 C41 30 35 35 32.5 43 Z" fill="${ch}"/>`,
      chignon: `<path d="M32.5 43 C31 27 40 20 50 20 C61 20 70 27 67.5 43 C65 35 59 30 50 30 C41 30 35 35 32.5 43 Z" fill="${ch}"/>`,
      boucles: `<path d="M31 44 C28 30 34 22 40 22 C42 17 48 17 50 20 C53 16 60 17 61 22 C67 22 72 30 69 44 C67 37 63 33 58 33 C55 36 45 36 42 33 C37 33 33 37 31 44 Z" fill="${ch}"/>`,
      afro: `<path d="M31 42 C30 30 38 24 50 24 C62 24 70 30 69 42 C66 35 60 32 50 32 C40 32 34 35 31 42 Z" fill="${chF}"/>`
    }[coiffure] || "";

    // Haut : le corps, puis le col selon le style
    const corps = `<path d="M14 101 C15 82 28 72 50 72 C72 72 85 82 86 101 Z" fill="${tenue}"/>`;
    const col = {
      tshirt: `<path d="M41 72.5 C43 79 57 79 59 72.5" fill="none" stroke="${tenueF}" stroke-width="2" stroke-linecap="round"/>`,
      col: `<path d="M42 71 L50 81 L44 84 L38 74 Z M58 71 L50 81 L56 84 L62 74 Z" fill="${this.nuance(tenue, 0.55)}"/>
            <line x1="50" y1="82" x2="50" y2="101" stroke="${tenueF}" stroke-width="1.5"/>`,
      capuche: `<path d="M30 76 C33 66 42 64 50 70 C58 64 67 66 70 76 C64 73 58 74 50 80 C42 74 36 73 30 76 Z" fill="${tenueF}"/>
            <line x1="46" y1="80" x2="45" y2="92" stroke="${this.nuance(tenue, 0.5)}" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="54" y1="80" x2="55" y2="92" stroke="${this.nuance(tenue, 0.5)}" stroke-width="1.4" stroke-linecap="round"/>`
    }[haut];

    const lunettes = {
      rondes: `<g fill="none" stroke="${trait}" stroke-width="1.4"><circle cx="43" cy="46" r="4.6"/><circle cx="57" cy="46" r="4.6"/><path d="M47.6 46 C49 45 51 45 52.4 46 M38.4 45.5 L34 44 M61.6 45.5 L66 44"/></g>`,
      carrees: `<g fill="none" stroke="${trait}" stroke-width="1.4"><rect x="37.5" y="42.3" width="10.5" height="7.4" rx="1.6"/><rect x="52" y="42.3" width="10.5" height="7.4" rx="1.6"/><path d="M48 45.5 C49.3 44.6 50.7 44.6 52 45.5 M37.5 45 L34 44 M62.5 45 L66 44"/></g>`
    }[C.lunettes[a.lunettes][0]] || "";

    const barbe = {
      moustache: `<path d="M43.5 54.2 C46 52 49 52.3 50 53.4 C51 52.3 54 52 56.5 54.2 C53.5 54.6 51.5 55.4 50 54.8 C48.5 55.4 46.5 54.6 43.5 54.2 Z" fill="${ch}"/>`,
      barbe: `<path d="M33.5 47 C34 58 41 65 50 65 C59 65 66 58 66.5 47 C64 52 61 55 57 55.5 C55 53.5 45 53.5 43 55.5 C39 55 36 52 33.5 47 Z" fill="${ch}"/>`
    }[C.barbe[a.barbe][0]] || "";

    return `<svg class="avatar" viewBox="0 0 100 100" width="${taille}" height="${taille}" ${titre ? `role="img" aria-label="${titre.replace(/"/g, "&quot;")}"` : `aria-hidden="true"`} focusable="false">
      <defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs>
      <g clip-path="url(#${id})">
        <rect width="100" height="100" fill="${fond}"/>
        ${arriere}
        ${corps}
        <path d="M43 58 L57 58 L57.5 72 C54 75.5 46 75.5 42.5 72 Z" fill="${ombre}"/>
        ${col}
        <circle cx="32.5" cy="47" r="4" fill="${peau}"/><circle cx="67.5" cy="47" r="4" fill="${peau}"/>
        <ellipse cx="50" cy="44" rx="17.5" ry="20.5" fill="${peau}"/>
        ${avant}
        <path d="M39.5 40.3 C41.5 39 44.5 39 46.3 40.1 M53.7 40.1 C55.5 39 58.5 39 60.5 40.3" fill="none" stroke="${chF === "#1f1a17" ? "#2b2522" : this.nuance(ch, -0.3)}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="43" cy="46" r="1.8" fill="${trait}"/><circle cx="57" cy="46" r="1.8" fill="${trait}"/>
        <path d="M50 47.5 C49 50 48.6 51.2 50.6 51.4" fill="none" stroke="${ombre}" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="39" cy="52" r="3" fill="#e0715f" opacity=".16"/><circle cx="61" cy="52" r="3" fill="#e0715f" opacity=".16"/>
        ${barbe}
        <path d="M45.5 56.2 C48 58.4 52 58.4 54.5 56.2" fill="none" stroke="${trait}" stroke-width="1.5" stroke-linecap="round"/>
        ${lunettes}
      </g>
    </svg>`;
  }
});
