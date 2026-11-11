// Progression de l'apprenant, enregistrée dans le navigateur (localStorage).
//
// Révision intelligente (méthode des boîtes de Leitner) : chaque signe vu est une
// « carte » rangée dans une boîte de 1 à 5.
//  - bonne réponse  -> boîte suivante, le signe revient dans 1, 3, 7, 14 puis 30 jours ;
//  - mauvaise réponse -> retour en boîte 1, le signe revient tout de suite.
// Les signes qu'on oublie reviennent donc souvent, ceux qu'on connaît de plus en plus rarement.

const Progression = {
  CLE: "lsf-progression-v2",
  INTERVALLES: [0, 1, 3, 7, 14, 30], // jours d'attente selon la boîte (indice = n° de boîte)

  lire() {
    try {
      const p = JSON.parse(localStorage.getItem(this.CLE));
      return p && p.cartes ? p : this.vide();
    } catch {
      return this.vide();
    }
  },
  vide() { return { cartes: {}, quiz: { bonnes: 0, total: 0 }, jours: [] }; },
  sauver(p) {
    try { localStorage.setItem(this.CLE, JSON.stringify(p)); } catch { /* navigation privée */ }
  },

  // Dates en heure locale (« aujourd'hui » pour la personne, pas pour Greenwich)
  jour(decalage = 0) {
    const d = new Date();
    d.setDate(d.getDate() + decalage);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },
  noterActivite(p) {
    const auj = this.jour();
    if (!p.jours.includes(auj)) p.jours.push(auj);
  },

  carte(k) { return this.lire().cartes[k] || null; },
  estAppris(k) { const c = this.carte(k); return !!(c && (c.appris || c.boite >= 3)); },

  /** Bouton « Marquer comme appris » : le signe entre dans les révisions (premier rappel demain). */
  basculerAppris(k) {
    const p = this.lire();
    const c = p.cartes[k];
    if (!c) p.cartes[k] = { boite: 1, prochaine: this.jour(1), appris: true, vues: 0, justes: 0 };
    else c.appris = !c.appris;
    this.noterActivite(p);
    this.sauver(p);
    return !!p.cartes[k].appris;
  },

  /** Réponse à une question de quiz sur le signe k. */
  repondre(k, juste) {
    const p = this.lire();
    const c = p.cartes[k] ||= { boite: 1, prochaine: this.jour(), appris: false, vues: 0, justes: 0 };
    c.vues++;
    if (juste) {
      c.justes++;
      c.boite = Math.min(5, c.boite + 1);
      c.prochaine = this.jour(this.INTERVALLES[c.boite]);
    } else {
      c.boite = 1;
      c.prochaine = this.jour();
    }
    p.quiz.total++;
    if (juste) p.quiz.bonnes++;
    this.noterActivite(p);
    this.sauver(p);
    return c;
  },

  /** Signes à réviser aujourd'hui (les plus en retard d'abord). */
  aReviser() {
    const auj = this.jour();
    return Object.entries(this.lire().cartes)
      .filter(([, c]) => c.prochaine <= auj)
      .sort((a, b) => a[1].prochaine.localeCompare(b[1].prochaine) || a[1].boite - b[1].boite)
      .map(([k]) => k);
  },
  parBoite() {
    const n = [0, 0, 0, 0, 0, 0];
    for (const c of Object.values(this.lire().cartes)) n[c.boite]++;
    return n;
  },
  serie() {
    const jours = new Set(this.lire().jours);
    let n = 0;
    while (jours.has(this.jour(-n))) n++;
    return n;
  },
  reinitialiser() { this.sauver(this.vide()); }
};

// Réglages de l'apprenant, rangés à part : « Réinitialiser ma progression » ne les efface pas.
//  - gaucher : vidéos et photos retournées comme dans un miroir, directions inversées.
const Reglages = {
  CLE: "lsf-reglages",
  DEFAUT: { gaucher: false },
  lire() {
    try { return { ...this.DEFAUT, ...JSON.parse(localStorage.getItem(this.CLE) || "{}") }; }
    catch { return { ...this.DEFAUT }; }
  },
  changer(cle, valeur) {
    const r = this.lire();
    r[cle] = valeur;
    try { localStorage.setItem(this.CLE, JSON.stringify(r)); } catch { /* navigation privée */ }
    return r;
  },
  get gaucher() { return !!this.lire().gaucher; }
};
