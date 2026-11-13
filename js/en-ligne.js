// Compte en ligne (Supabase) : se connecter avec son pseudo depuis n'importe quel appareil,
// retrouver sa progression, et avoir des amis.
//
// Le site parle directement à Supabase par de simples requêtes web (pas de bibliothèque).
// La base et ses règles de sécurité sont décrites dans supabase/schema.sql.
// Tant que l'adresse du projet et sa clé publique ne sont pas renseignées dans
// CONFIG_SITE (js/signalements.js), tout ce qui est « en ligne » reste caché.
//
// Connexion : pseudo + mot de passe. Supabase demande une adresse e-mail : on en fabrique
// une à partir du pseudo (elle ne reçoit jamais rien). Conséquence : un mot de passe
// oublié ne peut pas être réinitialisé par e-mail.
//
// Une session est rattachée à un profil local (voir Profils, js/progress.js) : chaque
// personne de l'appareil peut avoir son propre compte en ligne.

const EnLigne = {
  PSEUDO: /^[A-Za-z0-9_-]{3,20}$/,
  MDP_MIN: 8,
  get CLE_SESSION() { return Profils.cle("lsf-session"); },
  transport: null, // remplacé par les tests
  minuteur: null,
  envoiEnCours: null,

  disponible() { return !!(CONFIG_SITE.supabase?.url && CONFIG_SITE.supabase?.cle); },
  identifiant(pseudo) { return `${String(pseudo).toLowerCase()}@${CONFIG_SITE.supabase?.domaine || "pseudo.signes-en-main.invalid"}`; },

  // --- session (jetons de connexion) ---
  session() {
    try { return JSON.parse(localStorage.getItem(this.CLE_SESSION)) || null; } catch { return null; }
  },
  garderSession(r, pseudo) {
    const s = { jeton: r.access_token, renouv: r.refresh_token, expire: Date.now() + (r.expires_in || 3600) * 1000,
      id: r.user?.id || this.session()?.id, pseudo: pseudo || this.session()?.pseudo, synchro: this.session()?.synchro || null };
    try { localStorage.setItem(this.CLE_SESSION, JSON.stringify(s)); } catch { /* navigation privée */ }
    return s;
  },
  oublierSession() { try { localStorage.removeItem(this.CLE_SESSION); } catch { /* navigation privée */ } },
  connecte() { return this.disponible() && !!this.session(); },

  // --- requêtes ---
  async requete(chemin, { methode = "POST", corps, jeton, garder = false } = {}) {
    const { url, cle } = CONFIG_SITE.supabase;
    const envoyer = this.transport || ((u, o) => fetch(u, o));
    // Jeton de la personne connectée ; sinon l'ancienne clé « anon » (un JWT, « eyJ… »).
    // Les nouvelles clés « publishable » (sb_publishable_…) ne vont que dans « apikey ».
    const porteur = jeton || (cle.startsWith("eyJ") ? cle : "");
    let rep;
    try {
      rep = await envoyer(url.replace(/\/$/, "") + chemin, {
        method: methode, keepalive: garder,
        headers: { apikey: cle, ...(porteur ? { Authorization: `Bearer ${porteur}` } : {}), "Content-Type": "application/json" },
        body: corps === undefined ? undefined : JSON.stringify(corps)
      });
    } catch {
      throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion à Internet.");
    }
    const texte = await rep.text();
    let donnees = null;
    try { donnees = texte ? JSON.parse(texte) : null; } catch { donnees = texte; }
    if (!rep.ok) {
      const e = new Error(this.messageErreur(rep.status, donnees));
      e.status = rep.status;
      throw e;
    }
    return donnees;
  },
  messageErreur(status, d) {
    const brut = `${d?.error_code || d?.code || ""} ${d?.msg || d?.message || d?.error_description || d?.error || ""}`.toLowerCase();
    if (/already registered|user_already_exists|duplicate|unique/.test(brut)) return "Ce pseudo est déjà pris.";
    if (/invalid login|invalid_credentials|invalid_grant/.test(brut)) return "Pseudo ou mot de passe incorrect.";
    if (/weak_password|password should/.test(brut)) return `Mot de passe trop faible : au moins ${this.MDP_MIN} caractères.`;
    if (/email.*(invalid|not authorized)|email_address_invalid/.test(brut)) return "Le serveur refuse les identifiants fabriqués : la configuration du projet est à vérifier.";
    if (/confirm/.test(brut)) return "Le serveur demande de confirmer un e-mail : il faut désactiver « Confirm email » dans Supabase.";
    if (status === 429 || /rate limit/.test(brut)) return "Trop d'essais d'affilée : réessayez dans quelques minutes.";
    if (status >= 500) return "Le serveur a un problème. Réessayez plus tard.";
    return "Une erreur est survenue. Réessayez.";
  },
  /** Jeton valable (renouvelé s'il expire bientôt). Sans session valable : null, et on se déconnecte. */
  async jeton() {
    const s = this.session();
    if (!s) return null;
    if (s.expire - 60000 > Date.now()) return s.jeton;
    try {
      const r = await this.requete("/auth/v1/token?grant_type=refresh_token", { corps: { refresh_token: s.renouv } });
      return this.garderSession(r).jeton;
    } catch (e) {
      if (e.status && e.status < 500) this.oublierSession(); // session révoquée ou trop ancienne
      return null;
    }
  },
  async rpc(nom, args = {}, options = {}) {
    const jeton = await this.jeton();
    if (!jeton) throw new Error("Vous n'êtes plus connecté : reconnectez-vous.");
    return this.requete(`/rest/v1/rpc/${nom}`, { corps: args, jeton, ...options });
  },

  // --- inscription, connexion ---
  verifierPseudo(p) {
    if (!this.PSEUDO.test(p)) return "Le pseudo doit faire 3 à 20 caractères : lettres sans accent, chiffres, « _ » ou « - ».";
    return "";
  },
  /** Crée le compte en ligne et le rattache au profil local actif (créé s'il n'existe pas). */
  async inscrire(pseudo, mdp) {
    const erreur = this.verifierPseudo(pseudo);
    if (erreur) throw new Error(erreur);
    if (String(mdp).length < this.MDP_MIN) throw new Error(`Le mot de passe doit faire au moins ${this.MDP_MIN} caractères.`);
    if (!(await this.requete("/rest/v1/rpc/pseudo_libre", { corps: { p: pseudo } }))) throw new Error("Ce pseudo est déjà pris.");
    const r = await this.requete("/auth/v1/signup", { corps: { email: this.identifiant(pseudo), password: mdp } });
    if (!r?.access_token) throw new Error(this.messageErreur(400, { msg: "confirm" }));
    const profil = this.rattacher(r.user.id, pseudo, null);
    this.garderSession(r, pseudo);
    await this.rpc("creer_compte", { p: pseudo, av: profil.avatar });
    await this.synchroniser();
    return profil;
  },
  /**
   * Connexion. Le profil local déjà rattaché à ce compte est repris ; sinon on en crée un,
   * sauf si « avecProfilActif » : le profil actif (non rattaché) est alors rattaché, et sa
   * progression ajoutée à celle du compte.
   */
  async connecter(pseudo, mdp, { avecProfilActif = false } = {}) {
    if (!this.PSEUDO.test(pseudo)) throw new Error("Pseudo ou mot de passe incorrect.");
    const r = await this.requete("/auth/v1/token?grant_type=password", { corps: { email: this.identifiant(pseudo), password: mdp } });
    let fiche = null;
    try {
      const f = await this.requete("/rest/v1/rpc/mon_compte", { corps: {}, jeton: r.access_token });
      fiche = Array.isArray(f) ? f[0] : f;
    } catch { /* la fiche sera recréée */ }
    const profil = this.rattacher(r.user.id, fiche?.pseudo || pseudo, fiche?.avatar, avecProfilActif);
    this.garderSession(r, fiche?.pseudo || pseudo);
    if (!fiche) await this.rpc("creer_compte", { p: pseudo, av: profil.avatar });
    await this.synchroniser();
    return profil;
  },
  /** Choisit (ou crée) le profil local du compte, et l'active. */
  rattacher(id, pseudo, avatar, avecProfilActif = true) {
    const deja = Profils.lire().liste.find(p => p.compte?.id === id);
    let profil = deja;
    if (!profil) {
      const actif = Profils.actif();
      profil = actif && !actif.compte && avecProfilActif ? actif : Profils.creer(pseudo, avatar || Avatar.auHasard());
      if (!profil) throw new Error(`Pas plus de ${Profils.MAX} profils sur un même appareil : supprimez-en un d'abord.`);
    }
    Profils.choisir(profil.id);
    return Profils.modifier(profil.id, { nom: pseudo, compte: { id, pseudo }, ...(avatar && Object.keys(avatar).length ? { avatar } : {}) });
  },
  async deconnecter() {
    const s = this.session();
    clearTimeout(this.minuteur);
    if (s) {
      try { await this.envoyer(); } catch { /* tant pis : la progression reste sur l'appareil */ }
      try { await this.requete("/auth/v1/logout", { corps: {}, jeton: s.jeton }); } catch { /* déjà déconnecté */ }
    }
    this.oublierSession();
  },
  async changerMotDePasse(mdp) {
    if (String(mdp).length < this.MDP_MIN) throw new Error(`Le mot de passe doit faire au moins ${this.MDP_MIN} caractères.`);
    const jeton = await this.jeton();
    if (!jeton) throw new Error("Vous n'êtes plus connecté : reconnectez-vous.");
    await this.requete("/auth/v1/user", { methode: "PUT", corps: { password: mdp }, jeton });
  },
  /** Supprime le compte en ligne et ses données. La progression reste sur cet appareil. */
  async supprimerCompte() {
    await this.rpc("supprimer_mon_compte");
    const p = Profils.actif();
    if (p) Profils.modifier(p.id, { compte: null });
    this.oublierSession();
  },

  // --- synchronisation ---
  /** Ce que voient les amis : personnage et quelques chiffres. */
  chiffresPublics() {
    const p = Progression.lire();
    const appris = Object.values(p.cartes).filter(c => Progression.appris(c)).length;
    return { av: Profils.actif()?.avatar || null, s: Progression.serie(), ms: Progression.meilleureSerie(), a: appris, j: new Set(p.jours).size };
  },
  /** Récupère la progression du compte, la fusionne avec celle de l'appareil, puis renvoie le tout. */
  async synchroniser() {
    if (!this.connecte()) return false;
    const distant = await this.rpc("lire_progression");
    if (distant && typeof distant === "object") {
      try { Sauvegarde.restaurer(distant, "fusionner"); } catch { /* sauvegarde distante illisible : on garde l'appareil */ }
    }
    await this.envoyer();
    return true;
  },
  /** Envoie la progression et les chiffres (garder : envoi qui survit à la fermeture de la page). */
  async envoyer(garder = false) {
    if (!this.connecte()) return;
    clearTimeout(this.minuteur);
    this.envoiEnCours = (async () => {
      await this.rpc("sauver_progression", { d: Sauvegarde.creer() }, { garder });
      await this.rpc("maj_compte", this.chiffresPublics(), { garder });
      const s = this.session();
      if (s) { s.synchro = new Date().toISOString(); try { localStorage.setItem(this.CLE_SESSION, JSON.stringify(s)); } catch { /* */ } }
    })();
    try { await this.envoiEnCours; } finally { this.envoiEnCours = null; }
  },
  /** Appelé à chaque enregistrement local : envoi groupé quelques secondes plus tard. */
  changement() {
    if (!this.connecte()) return;
    clearTimeout(this.minuteur);
    this.minuteur = setTimeout(() => this.envoyer().catch(() => {}), 4000);
  },

  // --- amis ---
  async amis() { return (await this.rpc("mes_amis")) || []; },
  async demanderAmi(pseudo) {
    const p = String(pseudo).trim();
    if (!this.PSEUDO.test(p)) return "inconnu";
    return this.rpc("demander_ami", { p });
  },
  repondreAmi(id, accepter) { return this.rpc("repondre_ami", { autre: id, accepter }); },
  retirerAmi(id) { return this.rpc("retirer_ami", { autre: id }); }
};
