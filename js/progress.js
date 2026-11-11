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
//  - gaucher : vidéos et photos retournées comme dans un miroir, directions inversées ;
//  - theme : « clair » (par défaut), « sombre » (gris-vert doux) ou « auto » (comme l'appareil).
const Reglages = {
  CLE: "lsf-reglages",
  DEFAUT: { gaucher: false, theme: "clair" },
  THEMES: ["clair", "sombre", "auto"],
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
  get gaucher() { return !!this.lire().gaucher; },
  get theme() { const t = this.lire().theme; return this.THEMES.includes(t) ? t : "clair"; }
};

// Sauvegarde : la progression ne vit que dans ce navigateur. Pour ne pas la perdre (historique
// vidé, autre appareil), on peut la télécharger dans un fichier, ou la copier sous forme de
// code, puis la restaurer ailleurs.
const Sauvegarde = {
  APP: "signes-en-main",
  VERSION: 1,
  PREFIXE_CODE: "SEM1.",
  CLE_DATE: "lsf-derniere-sauvegarde",
  JOUR: /^\d{4}-\d{2}-\d{2}$/,

  creer() {
    return { app: this.APP, version: this.VERSION, date: new Date().toISOString(),
      progression: Progression.lire(), reglages: Reglages.lire() };
  },
  nomFichier() { return `signes-en-main-sauvegarde-${Progression.jour()}.json`; },

  /** Vérifie une sauvegarde lue dans un fichier ou un code. Renvoie la sauvegarde nettoyée, ou lève une erreur lisible. */
  verifier(s) {
    if (!s || typeof s !== "object" || s.app !== this.APP) throw new Error("Ce fichier n'est pas une sauvegarde de Signes en main.");
    if (s.version > this.VERSION) throw new Error("Cette sauvegarde vient d'une version plus récente du site.");
    const p = s.progression;
    if (!p || typeof p.cartes !== "object" || Array.isArray(p.cartes)) throw new Error("La sauvegarde est abîmée (progression illisible).");
    const cartes = {};
    for (const [k, c] of Object.entries(p.cartes)) {
      const boite = Math.round(+c?.boite);
      if (!(boite >= 1 && boite <= 5) || !this.JOUR.test(c.prochaine)) continue; // carte abîmée : ignorée
      cartes[k] = { boite, prochaine: c.prochaine, appris: !!c.appris,
        vues: Math.max(0, Math.round(+c.vues) || 0), justes: Math.max(0, Math.round(+c.justes) || 0) };
    }
    const quiz = { bonnes: Math.max(0, +p.quiz?.bonnes || 0), total: Math.max(0, +p.quiz?.total || 0) };
    const jours = [...new Set((Array.isArray(p.jours) ? p.jours : []).filter(j => this.JOUR.test(j)))].sort();
    const reglages = { ...Reglages.DEFAUT, ...(s.reglages && typeof s.reglages === "object" ? s.reglages : {}) };
    return { app: this.APP, version: this.VERSION, date: s.date, progression: { cartes, quiz, jours }, reglages };
  },

  /**
   * Fusion de deux progressions (ex. ordinateur + téléphone) : pour chaque signe, on garde
   * la version la plus travaillée ; les jours d'activité s'additionnent.
   */
  fusionner(a, b) {
    const cartes = { ...a.cartes };
    for (const [k, cb] of Object.entries(b.cartes)) {
      const ca = cartes[k];
      if (!ca) { cartes[k] = { ...cb }; continue; }
      const garder = cb.vues > ca.vues || (cb.vues === ca.vues && (cb.boite > ca.boite || (cb.boite === ca.boite && cb.prochaine > ca.prochaine))) ? cb : ca;
      cartes[k] = { ...garder, appris: ca.appris || cb.appris };
    }
    const quiz = (b.quiz.total > a.quiz.total ? b : a).quiz;
    return { cartes, quiz: { ...quiz }, jours: [...new Set([...a.jours, ...b.jours])].sort() };
  },

  /** mode « fusionner » (garde aussi la progression actuelle) ou « remplacer ». */
  restaurer(sauvegarde, mode = "fusionner") {
    const s = this.verifier(sauvegarde);
    const p = mode === "remplacer" ? s.progression : this.fusionner(Progression.lire(), s.progression);
    Progression.sauver(p);
    if (mode === "remplacer") {
      Reglages.changer("gaucher", !!s.reglages.gaucher);
      if (Reglages.THEMES.includes(s.reglages.theme)) Reglages.changer("theme", s.reglages.theme);
    }
    return p;
  },

  resume(p) {
    const vus = Object.keys(p.cartes).length;
    const appris = Object.values(p.cartes).filter(c => c.appris || c.boite >= 3).length;
    return { vus, appris, jours: p.jours.length };
  },

  noterExport() { try { localStorage.setItem(this.CLE_DATE, new Date().toISOString()); } catch { /* navigation privée */ } },
  derniereDate() { try { return localStorage.getItem(this.CLE_DATE); } catch { return null; } },
  /** Faut-il rappeler de sauvegarder ? (des signes travaillés, et pas de sauvegarde depuis 14 jours) */
  conseillee() {
    if (Object.keys(Progression.lire().cartes).length < 10) return false;
    const d = this.derniereDate();
    return !d || Date.now() - new Date(d).getTime() > 14 * 864e5;
  },

  // Code de transfert : la sauvegarde compressée (gzip) puis écrite en lettres et chiffres,
  // pour la coller sur un autre appareil (par message, e-mail…).
  async versCode(s = this.creer()) {
    const flux = new Blob([JSON.stringify(s)]).stream().pipeThrough(new CompressionStream("gzip"));
    const octets = new Uint8Array(await new Response(flux).arrayBuffer());
    let bin = "";
    for (let i = 0; i < octets.length; i += 8192) bin += String.fromCharCode(...octets.subarray(i, i + 8192));
    return this.PREFIXE_CODE + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  async depuisCode(code) {
    const brut = String(code).replace(/\s+/g, "");
    if (!brut.startsWith(this.PREFIXE_CODE)) throw new Error("Ce code n'est pas un code de Signes en main (il doit commencer par « SEM1. »).");
    try {
      const b64 = brut.slice(this.PREFIXE_CODE.length).replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
      const octets = Uint8Array.from(bin, c => c.charCodeAt(0));
      const flux = new Blob([octets]).stream().pipeThrough(new DecompressionStream("gzip"));
      return JSON.parse(await new Response(flux).text());
    } catch {
      throw new Error("Ce code est incomplet ou abîmé : recopiez-le en entier.");
    }
  }
};
