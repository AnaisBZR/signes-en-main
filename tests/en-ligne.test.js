// Tests du compte en ligne (js/en-ligne.js) avec un faux serveur Supabase en mémoire :
// on vérifie ce que fait le site (inscription, connexion sur un autre appareil,
// synchronisation, amis), pas la base elle-même (supabase/schema.sql).
const test = require("node:test");
const assert = require("node:assert/strict");
const { chargerSite } = require("./charger");

function fauxSupabase() {
  const users = new Map(), jetons = new Map(), comptes = new Map(), sauvegardes = new Map(), amities = [];
  let n = 0;
  const session = id => {
    const access_token = "a" + ++n, refresh_token = "r" + n;
    jetons.set(access_token, id); jetons.set(refresh_token, id);
    return { access_token, refresh_token, expires_in: 3600, user: { id } };
  };
  const rep = (status, corps) => ({ ok: status < 300, status, text: async () => (corps === undefined ? "" : JSON.stringify(corps)) });
  const rpc = {
    pseudo_libre: (moi, { p }) => ![...comptes.values()].some(c => c.pseudo.toLowerCase() === p.toLowerCase()),
    creer_compte: (moi, { p, av }) => { comptes.set(moi, { id: moi, pseudo: p, avatar: av, serie: 0, meilleure_serie: 0, appris: 0, jours: 0, maj: new Date().toISOString() }); },
    mon_compte: moi => (comptes.has(moi) ? [comptes.get(moi)] : []),
    maj_compte: (moi, { av, s, ms, a, j }) => Object.assign(comptes.get(moi), { avatar: av, serie: s, meilleure_serie: ms, appris: a, jours: j }),
    sauver_progression: (moi, { d }) => { sauvegardes.set(moi, JSON.parse(JSON.stringify(d))); },
    lire_progression: moi => sauvegardes.get(moi) ?? null,
    demander_ami: (moi, { p }) => {
      const lui = [...comptes.values()].find(c => c.pseudo.toLowerCase() === p.toLowerCase())?.id;
      if (!lui) return "inconnu";
      if (lui === moi) return "soi";
      const inverse = amities.find(a => a.demandeur === lui && a.destinataire === moi);
      if (inverse) { inverse.statut = "acceptee"; return "acceptee"; }
      if (amities.some(a => a.demandeur === moi && a.destinataire === lui)) return "deja";
      amities.push({ demandeur: moi, destinataire: lui, statut: "attente" });
      return "envoyee";
    },
    repondre_ami: (moi, { autre, accepter }) => {
      const i = amities.findIndex(a => a.demandeur === autre && a.destinataire === moi);
      if (i >= 0) { if (accepter) amities[i].statut = "acceptee"; else amities.splice(i, 1); }
    },
    mes_amis: moi => amities.filter(a => [a.demandeur, a.destinataire].includes(moi)).map(a => {
      const c = comptes.get(a.demandeur === moi ? a.destinataire : a.demandeur), ok = a.statut === "acceptee";
      return { id: c.id, pseudo: c.pseudo, avatar: c.avatar, statut: a.statut, recue: a.destinataire === moi,
        serie: ok ? c.serie : null, appris: ok ? c.appris : null, jours: ok ? c.jours : null, meilleure_serie: ok ? c.meilleure_serie : null, maj: ok ? c.maj : null };
    })
  };
  const transport = async (url, o) => {
    const chemin = url.replace("https://projet.supabase.co", ""), corps = o.body ? JSON.parse(o.body) : {};
    const moi = jetons.get((o.headers.Authorization || "").replace("Bearer ", ""));
    if (chemin === "/auth/v1/signup") {
      if (users.has(corps.email)) return rep(422, { error_code: "user_already_exists" });
      const id = "u" + users.size;
      users.set(corps.email, { id, mdp: corps.password });
      return rep(200, session(id));
    }
    if (chemin === "/auth/v1/token?grant_type=password") {
      const u = users.get(corps.email);
      return u && u.mdp === corps.password ? rep(200, session(u.id)) : rep(400, { error_code: "invalid_credentials" });
    }
    if (chemin === "/auth/v1/logout") return rep(204);
    const m = chemin.match(/^\/rest\/v1\/rpc\/(\w+)$/);
    if (m) {
      if (m[1] !== "pseudo_libre" && !moi) return rep(401, { message: "JWT" });
      return rep(200, rpc[m[1]](moi, corps));
    }
    return rep(404, {});
  };
  return { transport, comptes, sauvegardes, users };
}

function appareil(serveur) {
  const site = chargerSite();
  site.CONFIG_SITE.supabase = { url: "https://projet.supabase.co", cle: "anon", domaine: "pseudo.test.invalid" };
  site.EnLigne.transport = serveur.transport;
  site.EnLigne.changement = () => {}; // pas d'envoi différé pendant les tests
  return site;
}

test("sans configuration, le compte en ligne est caché", () => {
  const { EnLigne, CONFIG_SITE } = chargerSite();
  CONFIG_SITE.supabase = { url: "", cle: "" };
  assert.equal(EnLigne.disponible(), false);
  assert.equal(EnLigne.connecte(), false);
});

test("pseudo : règles et identifiant fabriqué", async () => {
  const { EnLigne, CONFIG_SITE } = chargerSite();
  CONFIG_SITE.supabase = { url: "u", cle: "c", domaine: "d.invalid" };
  assert.equal(EnLigne.verifierPseudo("Lou_42"), "");
  for (const p of ["ab", "trop-long-pour-un-pseudo", "Zoé", "a b", "x.y"]) assert.ok(EnLigne.verifierPseudo(p), p);
  assert.equal(EnLigne.identifiant("Lou_42"), "lou_42@d.invalid");
});

test("inscription : le profil actif devient le compte, sa progression part en ligne", async () => {
  const serveur = fauxSupabase();
  const a = appareil(serveur);
  a.Profils.creer("Camille", { coiffure: 4 });
  a.Progression.repondre("chat", true);
  await a.EnLigne.inscrire("Camille", "motdepasse1");
  const p = a.Profils.actif();
  assert.equal(p.compte.pseudo, "Camille");
  assert.ok(a.EnLigne.connecte());
  assert.ok(serveur.sauvegardes.get(p.compte.id).progression.cartes.chat, "progression envoyée");
  assert.equal(serveur.comptes.get(p.compte.id).avatar.coiffure, 4, "personnage envoyé");
  await assert.rejects(appareil(serveur).EnLigne.inscrire("camille", "autremotdepasse"), /déjà pris/);
});

test("connexion sur un autre appareil : on retrouve profil, personnage et progression", async () => {
  const serveur = fauxSupabase();
  const a = appareil(serveur);
  a.Profils.creer("Lou", { cheveux: 7 });
  a.Progression.repondre("chien", true);
  await a.EnLigne.inscrire("Lou", "motdepasse1");

  const b = appareil(serveur);
  b.Profils.creer("Sacha");
  b.Progression.repondre("maison", true);
  await assert.rejects(b.EnLigne.connecter("Lou", "mauvais"), /incorrect/);
  await b.EnLigne.connecter("Lou", "motdepasse1");
  const p = b.Profils.actif();
  assert.equal(p.nom, "Lou");
  assert.equal(p.avatar.cheveux, 7);
  assert.ok(b.Progression.carte("chien"), "progression du compte récupérée");
  assert.equal(b.Progression.carte("maison"), null, "le profil Sacha de l'appareil n'est pas mélangé");
  assert.equal(b.Profils.lire().liste.length, 2);
});

test("connexion en ajoutant la progression du profil actif", async () => {
  const serveur = fauxSupabase();
  await appareil(serveur).EnLigne.inscrire("Noa", "motdepasse1");
  const b = appareil(serveur);
  b.Profils.creer("Noa (tablette)");
  b.Progression.repondre("maison", true);
  await b.EnLigne.connecter("noa", "motdepasse1", { avecProfilActif: true });
  assert.equal(b.Profils.lire().liste.length, 1);
  assert.ok(b.Progression.carte("maison"));
  const id = b.Profils.actif().compte.id;
  assert.ok(serveur.sauvegardes.get(id).progression.cartes.maison, "la progression de la tablette est partie en ligne");
});

test("amis : demande, acceptation, chiffres visibles seulement une fois amis", async () => {
  const serveur = fauxSupabase();
  const a = appareil(serveur), b = appareil(serveur);
  await a.EnLigne.inscrire("Alix", "motdepasse1");
  b.Profils.creer("Bao");
  b.Progression.repondre("chat", true);
  b.Progression.repondre("chat", true); // appris
  await b.EnLigne.inscrire("Bao", "motdepasse1");

  assert.equal(await a.EnLigne.demanderAmi("personne"), "inconnu");
  assert.equal(await a.EnLigne.demanderAmi("Alix"), "soi");
  assert.equal(await a.EnLigne.demanderAmi("bao"), "envoyee");
  assert.equal(await a.EnLigne.demanderAmi("Bao"), "deja");

  const vuParA = (await a.EnLigne.amis())[0];
  assert.equal(vuParA.statut, "attente");
  assert.equal(vuParA.appris, null, "pas de chiffres avant d'être amis");
  const recue = (await b.EnLigne.amis())[0];
  assert.equal(recue.recue, true);
  await b.EnLigne.repondreAmi(recue.id, true);

  const ami = (await a.EnLigne.amis())[0];
  assert.equal(ami.statut, "acceptee");
  assert.equal(ami.pseudo, "Bao");
  assert.equal(ami.appris, 1);
  assert.equal(ami.jours, 1);
});

test("déconnexion : la session est oubliée, la progression reste sur l'appareil", async () => {
  const serveur = fauxSupabase();
  const a = appareil(serveur);
  await a.EnLigne.inscrire("Eden", "motdepasse1");
  a.Progression.repondre("chat", true);
  await a.EnLigne.deconnecter();
  assert.equal(a.EnLigne.connecte(), false);
  assert.ok(a.Progression.carte("chat"));
  assert.ok(serveur.sauvegardes.get(a.Profils.actif().compte.id).progression.cartes.chat, "dernier envoi avant de partir");
});
