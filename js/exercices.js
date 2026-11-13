// Page « S'entraîner » : exercices variés, records et défi du jour.
//
//  - Sprint vrai ou faux (60 s)       - Jeu des paires (vidéo ↔ mot)
//  - Écrire le mot                     - Épeler avec les doigts (+ « Épeler mon prénom »)
//  - Comprendre une phrase             - Construire une phrase (ordre de la LSF)
//  - Défi du jour : 10 questions variées, les mêmes toute la journée
//
// Ce fichier est chargé avant app.js : il n'utilise les outils d'app.js (echapper, THEMES,
// htmlVideo…) qu'à l'intérieur de fonctions, appelées une fois toute la page chargée.

const EXERCICES = [
  { id: "sprint", nom: "Sprint vrai ou faux", icone: "chrono", desc: "60 secondes : la vidéo montre-t-elle bien ce mot ? Répondez le plus vite possible.", record: v => `${v} bonne${v > 1 ? "s" : ""} réponse${v > 1 ? "s" : ""}` },
  { id: "paires", nom: "Jeu des paires", icone: "paires", desc: "Retournez les cartes et associez chaque vidéo à son mot, en un minimum de coups.", record: v => `${v} coups` },
  { id: "ecrire", nom: "Écrire le mot", icone: "crayon", desc: "Regardez le signe et tapez le mot. Le plus efficace pour retenir durablement.", record: v => `${v} / 10` },
  { id: "epeler", nom: "Épeler avec les doigts", icone: "alphabet", desc: "Retrouvez, dans l'ordre, les lettres de l'alphabet dactylologique qui forment un mot.", record: v => `${v} / 5 sans faute`, sansFiltre: true },
  { id: "comprendre", nom: "Comprendre une phrase", icone: "bulle", desc: "Plusieurs signes à la suite : que veut dire la phrase ?", record: v => `${v} / 8`, sansFiltre: true },
  { id: "construire", nom: "Construire une phrase", icone: "blocs", desc: "Remettez les signes dans l'ordre de la LSF : quand, où, qui, quoi.", record: v => `${v} / 8`, sansFiltre: true }
];
const exercice = id => EXERCICES.find(x => x.id === id);

// ---------------------------------------------------------------------
// Outils (sans affichage : testés dans tests/exercices.test.js)
// ---------------------------------------------------------------------

/** Réponse tapée -> forme comparable : minuscules, sans accents, ponctuation ni parenthèses. */
function normaliserReponse(s) {
  return String(s).toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/[’`]/g, "'")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[?!.,;:«»"]/g, " ")
    .replace(/\s*([-'])\s*/g, "$1")
    .replace(/\s+/g, " ").trim();
}

/** Nombre de lettres à changer pour passer d'un mot à l'autre (distance de Levenshtein). */
function distanceMots(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return d[b.length];
}

/** « exact », « presque » (une faute de frappe) ou « faux ». */
function comparerReponse(tape, attendu) {
  const a = normaliserReponse(tape), b = normaliserReponse(attendu);
  if (!a) return "faux";
  if (a === b) return "exact";
  const tolerance = b.length >= 8 ? 2 : b.length >= 4 ? 1 : 0;
  return distanceMots(a, b) <= tolerance ? "presque" : "faux";
}

/** Hasard « avec graine » : la même graine donne toujours la même suite (défi du jour). */
function aleaGraine(texte) {
  let h = 1779033703 ^ texte.length;
  for (const c of texte) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
const melangerAvec = (a, rnd) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Mots qu'on peut épeler avec l'alphabet (lettres seulement, 3 à 8). */
const motsEpelables = mots => [...new Set(mots.filter(m => /^[A-Za-zÀ-ÿ]{3,8}$/.test(m)))];

/** Phrases « voisines » (pour les mauvaises réponses) : même structure de préférence. */
function phrasesVoisines(p, toutes, n, rnd = Math.random) {
  const autres = toutes.filter(x => x !== p);
  const proches = melangerAvec(autres.filter(x => x.roles.join() === p.roles.join()), rnd);
  const reste = melangerAvec(autres.filter(x => !proches.includes(x)), rnd);
  return [...proches, ...reste].slice(0, n);
}

// ---------------------------------------------------------------------
// Arrêt propre quand on quitte un exercice (minuteurs, touches du clavier)
// ---------------------------------------------------------------------
let nettoyagesExo = [];
function arreterExercice() {
  nettoyagesExo.forEach(f => { try { f(); } catch { /* déjà arrêté */ } });
  nettoyagesExo = [];
}
// Numéro de la page affichée : change à chaque navigation (route), pour qu'un exercice
// qu'on a quitté ne continue pas en arrière-plan.
let pageCourante = 0;
function quitterPage() { arreterExercice(); pageCourante++; }
const surNettoyage = f => nettoyagesExo.push(f);
const attendreMs = ms => new Promise(r => { const t = setTimeout(r, ms); surNettoyage(() => clearTimeout(t)); });
/** Une page d'exercice est encore affichée tant que son élément racine est dans la page. */
const toujoursLa = el => document.body.contains(el);

// ---------------------------------------------------------------------
// Signes utilisés selon le filtre choisi sur la page « S'entraîner »
// ---------------------------------------------------------------------
let filtreEntrainement = "tout";
function signesPour(filtre) {
  if (filtre === "vus") {
    const cartes = Progression.lire().cartes;
    const vus = TOUS_LES_SIGNES.filter(e => cartes[e.k]);
    if (vus.length >= 6) return vus;
  }
  const t = theme(filtre);
  return t ? t.entrees : TOUS_LES_SIGNES;
}
const nomFiltre = f => f === "vus" ? "signes déjà vus" : theme(f)?.titre || "tous les thèmes";

// ---------------------------------------------------------------------
// Page « S'entraîner »
// ---------------------------------------------------------------------
function pageEntrainement(exo, filtre) {
  if (filtre) filtreEntrainement = decodeURIComponent(filtre);
  const lancer = {
    sprint: exoSprint, paires: exoPaires, ecrire: exoEcrire, epeler: exoEpeler,
    comprendre: exoComprendre, construire: exoConstruire, defi: exoDefi, prenom: exoPrenom
  }[exo];
  if (lancer) return lancer(filtreEntrainement);
  if (exo) return page404();

  const nbVus = Object.keys(Progression.lire().cartes).length;
  const filtres = [["tout", "Tous les thèmes"], ...(nbVus >= 6 ? [["vus", `Déjà vus (${nbVus})`]] : []), ...THEMES.map(t => [t.id, t.titre])];
  if (!filtres.some(([id]) => id === filtreEntrainement)) filtreEntrainement = "tout";
  const defi = Records.defiDuJour();
  app.innerHTML = `
    <h1>S'entraîner</h1>
    <p class="hero-sous">Des exercices variés pour retenir les signes : chaque réponse compte aussi pour vos révisions.</p>
    <a class="defi-carte ${defi != null ? "fait" : ""}" href="#/entrainement/defi">
      <span class="carte-icone">${icone("cible")}</span>
      <span class="defi-texte">
        <span class="surtitre">Défi du jour</span>
        <strong>${defi != null ? `Réussi : ${defi} / 10` : "10 questions variées, les mêmes toute la journée"}</strong>
        <span class="petit">${defi != null ? "Vous pouvez le refaire pour améliorer votre score." : "Vidéos, mots, phrases : un peu de tout."} · ${Records.nbDefis()} défi(s) relevé(s)</span>
      </span>
      <span class="btn">${defi != null ? "Refaire" : "Relever le défi"}</span>
    </a>
    <h2>Avec quels signes ?</h2>
    <div class="puces filtres-exo" role="group" aria-label="Choisir les signes des exercices">
      ${filtres.map(([id, nom]) => `<button class="puce ${id === filtreEntrainement ? "actif" : ""}" data-f="${echapper(id)}" aria-pressed="${id === filtreEntrainement}">${echapper(nom)}</button>`).join("")}
    </div>
    <div class="grille-exos">
      ${EXERCICES.map(x => {
        const r = Records.meilleur(x.id);
        return `
        <a class="exo-carte" href="#/entrainement/${x.id}/${encodeURIComponent(filtreEntrainement)}" data-exo="${x.id}">
          <span class="carte-icone">${icone(x.icone)}</span>
          <span class="carte-titre">${x.nom}</span>
          <span class="petit">${x.desc}</span>
          <span class="exo-pied">
            <span class="record">${r != null ? `${icone("etoile")} Record : ${x.record(r)}` : "Pas encore de record"}</span>
            ${x.sansFiltre ? `<span class="petit">tous les signes</span>` : ""}
          </span>
        </a>`;
      }).join("")}
    </div>
    <h2>Aussi</h2>
    <div class="liens-exos">
      <a href="#/lecons">Quiz par thème</a>
      <a href="#/alphabet/quiz">Quiz des lettres</a>
      <a href="#/alphabet/epeler">Lire un mot épelé</a>
      <a href="#/entrainement/prenom">Épeler mon prénom</a>
    </div>`;
  app.querySelectorAll(".filtres-exo .puce").forEach(b => (b.onclick = () => { filtreEntrainement = b.dataset.f; pageEntrainement(); }));
}

// ---------------------------------------------------------------------
// Briques communes
// ---------------------------------------------------------------------
function enteteExo(titre, n, total, retour = "#/entrainement") {
  return `
    <div class="quiz-tete">
      <a class="quitter" href="${retour}" title="Quitter l'exercice" aria-label="Quitter l'exercice">×</a>
      <div class="progression-quiz"><span style="width:${(100 * n) / total}%"></span></div>
      <span class="quiz-compte">${Math.min(n + 1, total)} / ${total}</span>
    </div>
    <span class="surtitre">S'entraîner · ${echapper(titre)}</span>`;
}

/** Bandeau de réponse en bas de l'écran ; se résout quand on clique « Continuer ». */
function bandeauReponse(juste, html, libelle = "Continuer") {
  return new Promise(ok => {
    const b = document.getElementById("retour-quiz");
    b.className = juste ? "ok" : "ko";
    b.innerHTML = `<p class="${juste ? "msg-ok" : "msg-ko"}">${html}</p><button class="btn ${juste ? "btn-ok" : "btn-ko"}" id="suivant">${libelle}</button>`;
    const s = document.getElementById("suivant");
    s.focus();
    s.onclick = () => ok();
  });
}

/** Écran de fin commun : score, record, et liste des signes à revoir. */
function finExo({ titre, score, total, recordId, valeurRecord = score, rejouer, aRevoir = [], bravo }) {
  const nouveau = recordId ? Records.noter(recordId, valeurRecord) : false;
  const meilleur = recordId ? Records.meilleur(recordId) : null;
  const x = exercice(recordId);
  app.innerHTML = `
    <div class="quiz-fin">
      <span class="surtitre">S'entraîner · ${echapper(titre)}</span>
      <h1>${bravo || (score === total ? "Parfait !" : score >= total / 2 ? "Bien joué !" : "Continuez, ça vient !")}</h1>
      <div class="score-carte"><p class="score">${total ? `${score} / ${total}` : score}</p>
        <span class="petit">${nouveau ? "Nouveau record !" : meilleur != null && x ? `Record : ${x.record(meilleur)}` : ""}</span></div>
      ${aRevoir.length ? `
        <div class="a-revoir">
          <strong>À revoir</strong>
          <div class="puces">${[...new Map(aRevoir.map(e => [e.k, e])).values()].map(e => `<a class="puce" href="#/mot/${encodeURIComponent(e.k)}">${echapper(e.mot)}</a>`).join("")}</div>
        </div>` : ""}
      <div class="hero-actions">
        <button class="btn" id="rejouer">Recommencer</button>
        <a class="btn btn-second" href="#/entrainement">Autres exercices</a>
      </div>
    </div>`;
  document.getElementById("rejouer").onclick = rejouer;
  if (nouveau) app.querySelector(".score-carte").classList.add("record-battu");
}

// --- Questions réutilisables (exercices et défi du jour). Chacune se résout avec true/false.

function qVideoMot(e, pool, entete) {
  const choix = melanger([e, ...melanger(pool.filter(x => x !== e)).slice(0, 3)]);
  app.innerHTML = `${entete}
    <p class="consigne">Quel mot est signé ?</p>
    <div class="quiz"><div id="zone-video"></div>
      <div class="choix">${choix.map(c => `<button class="btn-choix" data-k="${echapper(c.k)}">${echapper(c.mot)}</button>`).join("")}</div></div>
    <div id="retour-quiz" role="status" aria-live="polite"></div>`;
  const zone = document.getElementById("zone-video");
  zone.innerHTML = htmlVideo(auHasard(e.videos), { label: "Vidéo du signe à deviner" });
  brancherVitesses(zone);
  return reponseParBoutons(e);
}

function qMotVideo(e, pool, entete) {
  const choix = melanger([e, ...melanger(pool.filter(x => x !== e)).slice(0, 3)]);
  app.innerHTML = `${entete}
    <p class="consigne">Quelle vidéo montre « <strong>${echapper(e.mot)}</strong> » ?</p>
    <div class="choix-videos">${choix.map((c, i) => `<button class="choix-video" data-k="${echapper(c.k)}" aria-label="Vidéo ${i + 1}">${miniVideo(auHasard(c.videos))}</button>`).join("")}</div>
    <div id="retour-quiz" role="status" aria-live="polite"></div>`;
  return reponseParBoutons(e);
}

function reponseParBoutons(e) {
  return new Promise(ok => {
    app.querySelectorAll("[data-k]").forEach(b => (b.onclick = async () => {
      const juste = b.dataset.k === e.k;
      Progression.repondre(e.k, juste); majCompteurs();
      app.querySelectorAll("[data-k]").forEach(x => {
        x.disabled = true;
        if (x.dataset.k === e.k) x.classList.add("juste"); else if (x === b) x.classList.add("faux");
      });
      await bandeauReponse(juste, juste ? "Bravo !" : `Pas tout à fait : c'était « ${echapper(e.mot)} ».`);
      ok(juste);
    }));
  });
}

function qVraiFaux(e, pool, entete) {
  const vrai = Math.random() < .5;
  const mot = vrai ? e : auHasard(pool.filter(x => x !== e));
  app.innerHTML = `${entete}
    <p class="consigne">Cette vidéo montre-t-elle « <strong>${echapper(mot.mot)}</strong> » ?</p>
    <div class="quiz"><div id="zone-video"></div>
      <div class="choix vrai-faux"><button class="btn-choix" data-r="faux">Faux</button><button class="btn-choix" data-r="vrai">Vrai</button></div></div>
    <div id="retour-quiz" role="status" aria-live="polite"></div>`;
  const zone = document.getElementById("zone-video");
  zone.innerHTML = htmlVideo(auHasard(e.videos), { label: "Vidéo d'un signe" });
  brancherVitesses(zone);
  return new Promise(ok => {
    app.querySelectorAll("[data-r]").forEach(b => (b.onclick = async () => {
      const juste = (b.dataset.r === "vrai") === vrai;
      if (vrai) { Progression.repondre(e.k, juste); majCompteurs(); } else Progression.activite();
      app.querySelectorAll("[data-r]").forEach(x => { x.disabled = true; if ((x.dataset.r === "vrai") === vrai) x.classList.add("juste"); else x.classList.add("faux"); });
      await bandeauReponse(juste, (juste ? "Bravo ! " : "Raté : ") + (vrai ? `c'est bien « ${echapper(e.mot)} ».` : `c'était « ${echapper(e.mot)} », pas « ${echapper(mot.mot)} ».`));
      ok(juste);
    }));
  });
}

function qEcrire(e, entete) {
  app.innerHTML = `${entete}
    <p class="consigne">Quel est ce signe ? Tapez le mot.</p>
    <div class="quiz"><div id="zone-video"></div>
      <form class="ecrire" id="form-ecrire" autocomplete="off">
        <input id="saisie-mot" aria-label="Le mot signé" placeholder="Tapez le mot…" autocapitalize="off" spellcheck="false">
        <div class="hero-actions"><button class="btn" type="submit">Vérifier</button><button class="btn btn-second" type="button" id="indice">Un indice</button></div>
        <p class="petit indice" id="texte-indice" aria-live="polite"></p>
        <p class="petit">Les accents et majuscules ne comptent pas ; une petite faute de frappe est acceptée.</p>
      </form></div>
    <div id="retour-quiz" role="status" aria-live="polite"></div>`;
  const zone = document.getElementById("zone-video");
  zone.innerHTML = htmlVideo(auHasard(e.videos), { label: "Vidéo du signe à deviner" });
  brancherVitesses(zone);
  const champ = document.getElementById("saisie-mot");
  champ.focus({ preventScroll: true });
  let indices = 0;
  const motAffiche = e.mot.replace(/\s*\(.*?\)\s*/g, " ").trim();
  document.getElementById("indice").onclick = () => {
    indices++;
    const lettres = [...motAffiche];
    document.getElementById("texte-indice").textContent = indices === 1
      ? `${lettres.filter(c => /\p{L}/u.test(c)).length} lettres : ${lettres.map(c => /\p{L}/u.test(c) ? "_" : c).join(" ")}`
      : `Commence par « ${lettres[0]} » : ${lettres.map((c, i) => i === 0 || !/\p{L}/u.test(c) ? c : "_").join(" ")}`;
  };
  return new Promise(ok => {
    document.getElementById("form-ecrire").onsubmit = async ev => {
      ev.preventDefault();
      if (!champ.value.trim()) return champ.focus();
      const verdict = comparerReponse(champ.value, e.mot);
      const juste = verdict !== "faux";
      champ.disabled = true;
      app.querySelectorAll("#form-ecrire button").forEach(b => (b.disabled = true));
      Progression.repondre(e.k, juste); majCompteurs();
      await bandeauReponse(juste, verdict === "exact" ? "Bravo !" : verdict === "presque"
        ? `Presque ! Attention à l'orthographe : « ${echapper(motAffiche)} ».` : `C'était « ${echapper(motAffiche)} ».`);
      ok(juste);
    };
  });
}

/**
 * Lecteur de phrase : les vidéos des signes jouées l'une après l'autre (préchargées et
 * empilées : une seule visible à la fois, pour enchaîner sans attente).
 */
/**
 * Partie utile d'une vidéo : l'analyse automatique (js/descriptions.js) a repéré où le geste
 * commence et finit. On garde un peu de marge pour voir la main arriver et repartir ;
 * sans analyse, on lit toute la vidéo.
 */
function segmentGeste(e, v) {
  const d = (window.DESCRIPTIONS || {})[e.k];
  if (!d || d.video !== v.url || d.tDebut == null || d.tFin == null) return null;
  return { debut: Math.max(0, d.tDebut - .35), fin: d.tFin + .35 };
}

function lecteurPhrase(zone, phrase, { boucle = true } = {}) {
  const entrees = phrase.signes.map(s => Dico.trouver(s));
  zone.innerHTML = `
    <div class="lecteur-phrase">
      <div class="pile">${entrees.map((e, i) => `<video muted playsinline preload="auto" data-page="${echapper(e.videos[0].page)}"
        aria-label="Signe ${i + 1} sur ${entrees.length}">${sourcesVideo(e.videos[0].url)}</video>`).join("")}</div>
      <div class="pips" aria-hidden="true">${entrees.map(() => "<span></span>").join("")}</div>
      <div class="lecteur-actions">
        <button class="btn btn-second" data-action="revoir">↺ Revoir</button>
        <button class="btn btn-second" data-action="lent" aria-pressed="false">Ralenti</button>
      </div>
    </div>`;
  const vids = [...zone.querySelectorAll("video")], pips = [...zone.querySelectorAll(".pips span")];
  const segments = entrees.map(e => segmentGeste(e, e.videos[0]));
  let vitesse = 1, actif = true, attente = null;
  const montrer = n => {
    clearTimeout(attente);
    vids.forEach((v, j) => { v.classList.toggle("actif", j === n); if (j !== n) v.pause(); });
    pips.forEach((p, j) => { p.classList.toggle("fait", j < n); p.classList.toggle("actif", j === n); });
    const v = vids[n];
    v.currentTime = segments[n]?.debut || 0; v.playbackRate = vitesse;
    v.play().catch(() => {});
  };
  const suivant = j => {
    if (!actif || !toujoursLa(vids[j])) return;
    if (j + 1 < vids.length) montrer(j + 1);
    else { pips.forEach(p => p.classList.add("fait")); if (boucle) attente = setTimeout(() => actif && toujoursLa(vids[0]) && montrer(0), 1500); }
  };
  vids.forEach((v, j) => {
    v.addEventListener("ended", () => suivant(j));
    // fin du geste atteinte : on passe au signe suivant sans attendre le retour au repos
    v.addEventListener("timeupdate", () => {
      if (segments[j] && v.classList.contains("actif") && !v.paused && v.currentTime >= segments[j].fin) { v.pause(); suivant(j); }
    });
  });
  zone.querySelector('[data-action="revoir"]').onclick = () => montrer(0);
  zone.querySelector('[data-action="lent"]').onclick = ev => {
    vitesse = vitesse === 1 ? .6 : 1;
    ev.currentTarget.setAttribute("aria-pressed", vitesse !== 1);
    vids.forEach(v => (v.playbackRate = vitesse));
  };
  surNettoyage(() => { actif = false; clearTimeout(attente); });
  montrer(0);
}

/** Explication après une phrase : les signes, leur rôle, et les règles d'ordre. */
function htmlGloses(p) {
  const regles = [...new Set(p.roles)].map(r => REGLES_PHRASES[r]).filter(Boolean);
  return `
    <div class="gloses">${p.signes.map((s, i) => `<span class="glose role-${p.roles[i].normalize("NFD").replace(/[̀-ͯ]/g, "")}"><strong>${echapper(s)}</strong><small>${p.roles[i]}</small></span>`).join("")}</div>
    <ul class="regles">${regles.map(r => `<li>${echapper(r)}</li>`).join("")}</ul>`;
}

function qComprendre(p, entete, rnd = Math.random) {
  const choix = melangerAvec([p, ...phrasesVoisines(p, PHRASES, 2, rnd)], rnd);
  app.innerHTML = `${entete}
    <p class="consigne">Que veut dire cette phrase ?</p>
    <div class="quiz"><div id="zone-phrase"></div>
      <div class="choix choix-phrases">${choix.map((c, i) => `<button class="btn-choix" data-i="${i}">${echapper(c.fr)}</button>`).join("")}</div></div>
    <div id="explication"></div>
    <div id="retour-quiz" role="status" aria-live="polite"></div>`;
  lecteurPhrase(document.getElementById("zone-phrase"), p);
  return new Promise(ok => {
    app.querySelectorAll("[data-i]").forEach(b => (b.onclick = async () => {
      const juste = choix[+b.dataset.i] === p;
      Progression.activite(); majCompteurs();
      app.querySelectorAll("[data-i]").forEach(x => { x.disabled = true; if (choix[+x.dataset.i] === p) x.classList.add("juste"); else if (x === b) x.classList.add("faux"); });
      document.getElementById("explication").innerHTML = htmlGloses(p);
      await bandeauReponse(juste, juste ? "Bravo !" : `C'était : « ${echapper(p.fr)} »`);
      ok(juste);
    }));
  });
}

function qConstruire(p, entete) {
  // cartes mélangées (jamais déjà dans le bon ordre, sinon c'est trop facile)
  let ordre = melanger(p.signes.map((_, i) => i));
  while (p.signes.length > 1 && ordre.every((x, i) => x === i)) ordre = melanger(ordre);
  const choisies = [];
  app.innerHTML = `${entete}
    <p class="consigne">Mettez les signes dans l'ordre de la LSF</p>
    <p class="phrase-fr">« ${echapper(p.fr)} »</p>
    <div class="ligne-reponse" id="ligne-reponse" aria-label="Votre phrase en LSF"></div>
    <div class="banque" id="banque" aria-label="Signes à placer"></div>
    <div class="hero-actions"><button class="btn" id="valider" disabled>Vérifier</button><button class="btn btn-second" id="effacer">Tout reprendre</button></div>
    <p class="petit">Astuce : en LSF, on dit d'abord <strong>quand</strong>, puis <strong>où</strong>, puis <strong>qui</strong>, puis <strong>ce qui se passe</strong>.</p>
    <div id="explication"></div>
    <div id="retour-quiz" role="status" aria-live="polite"></div>`;
  const ligne = document.getElementById("ligne-reponse"), banque = document.getElementById("banque"), valider = document.getElementById("valider");
  const dessiner = () => {
    ligne.innerHTML = choisies.length ? choisies.map((i, n) => `<button class="carte-signe placee" data-i="${i}" aria-label="${echapper(p.signes[i])}, position ${n + 1} : retirer">${echapper(p.signes[i])}</button>`).join("")
      : `<span class="petit vide">Touchez les signes ci-dessous dans le bon ordre.</span>`;
    banque.innerHTML = ordre.filter(i => !choisies.includes(i)).map(i => `<button class="carte-signe" data-i="${i}">${echapper(p.signes[i])}</button>`).join("");
    valider.disabled = choisies.length !== p.signes.length;
    ligne.querySelectorAll("button").forEach(b => (b.onclick = () => { choisies.splice(choisies.indexOf(+b.dataset.i), 1); dessiner(); }));
    banque.querySelectorAll("button").forEach(b => (b.onclick = () => { choisies.push(+b.dataset.i); dessiner(); (banque.querySelector("button") || valider).focus(); }));
  };
  dessiner();
  document.getElementById("effacer").onclick = () => { choisies.length = 0; dessiner(); };
  return new Promise(ok => {
    valider.onclick = async () => {
      // deux signes identiques (rare) sont interchangeables : on compare les mots
      const juste = choisies.map(i => p.signes[i]).join("|") === p.signes.join("|");
      Progression.activite(); majCompteurs();
      ligne.querySelectorAll("button").forEach((b, n) => { b.disabled = true; b.classList.add(p.signes[choisies[n]] === p.signes[n] ? "juste" : "faux"); });
      app.querySelectorAll("#valider, #effacer").forEach(b => (b.disabled = true));
      const expl = document.getElementById("explication");
      expl.innerHTML = `${htmlGloses(p)}<div id="zone-phrase"></div>`;
      lecteurPhrase(document.getElementById("zone-phrase"), p);
      await bandeauReponse(juste, juste ? "Bravo, c'est le bon ordre !" : "Pas tout à fait : regardez l'ordre ci-dessus.");
      ok(juste);
    };
  });
}

/** Enchaîne des questions ; fin(score, aRevoir) à la fin. */
async function serieQuestions({ titre, questions, fin }) {
  const page = pageCourante;
  let score = 0;
  const aRevoir = [];
  for (let n = 0; n < questions.length; n++) {
    const { poser, entree } = questions[n];
    const juste = await poser(enteteExo(titre, n, questions.length));
    if (page !== pageCourante) return; // on a quitté l'exercice
    if (juste) score++; else if (entree) aRevoir.push(entree);
    arreterExercice(); // arrête les lecteurs de phrase de la question précédente
  }
  fin(score, aRevoir);
}

// ---------------------------------------------------------------------
// Les exercices
// ---------------------------------------------------------------------
function exoEcrire(filtre) {
  const pool = signesPour(filtre);
  const signes = melanger(pool).slice(0, 10);
  serieQuestions({
    titre: "Écrire le mot",
    questions: signes.map(e => ({ entree: e, poser: entete => qEcrire(e, entete) })),
    fin: (score, aRevoir) => finExo({ titre: "Écrire le mot", score, total: signes.length, recordId: signes.length === 10 ? "ecrire" : null, aRevoir, rejouer: () => exoEcrire(filtre) })
  });
}

function exoComprendre() {
  const phrases = melanger(PHRASES).slice(0, 8);
  serieQuestions({
    titre: "Comprendre une phrase",
    questions: phrases.map(p => ({ poser: entete => qComprendre(p, entete) })),
    fin: score => finExo({ titre: "Comprendre une phrase", score, total: 8, recordId: "comprendre", rejouer: exoComprendre })
  });
}

function exoConstruire() {
  // des phrases d'au moins 3 signes de préférence (plus intéressantes à ordonner)
  const longues = melanger(PHRASES.filter(p => p.signes.length >= 3));
  const phrases = [...longues.slice(0, 6), ...melanger(PHRASES.filter(p => p.signes.length === 2)).slice(0, 2)];
  serieQuestions({
    titre: "Construire une phrase",
    questions: melanger(phrases).map(p => ({ poser: entete => qConstruire(p, entete) })),
    fin: score => finExo({ titre: "Construire une phrase", score, total: 8, recordId: "construire", rejouer: exoConstruire })
  });
}

/** Défi du jour : 10 questions de types variés, tirées avec la date comme graine. */
function exoDefi() {
  const rnd = aleaGraine("defi-" + Progression.jour());
  // signes des niveaux déjà ouverts (jusqu'à celui de la prochaine leçon) : stable toute la
  // journée, et pas de signes d'un niveau qu'on n'a pas encore commencé
  const niveau = themeSuivant().niveau;
  const pool = [...new Map(THEMES.filter(t => t.niveau <= niveau).flatMap(t => t.entrees).map(e => [e.k, e])).values()];
  const signes = melangerAvec(pool, rnd).slice(0, 8);
  const phrases = melangerAvec(PHRASES, rnd);
  const types = melangerAvec(["video-mot", "video-mot", "mot-video", "mot-video", "vrai-faux", "vrai-faux", "ecrire", "ecrire", "comprendre", "construire"], rnd);
  let s = 0, ph = 0;
  const questions = types.map(type => {
    if (type === "comprendre" || type === "construire") {
      const p = phrases[ph++];
      return { poser: entete => type === "comprendre" ? qComprendre(p, entete, rnd) : qConstruire(p, entete) };
    }
    const e = signes[s++];
    const f = { "video-mot": qVideoMot, "mot-video": qMotVideo, "vrai-faux": qVraiFaux }[type];
    return { entree: e, poser: entete => f ? f(e, pool, entete) : qEcrire(e, entete) };
  });
  serieQuestions({
    titre: "Défi du jour",
    questions,
    fin: (score, aRevoir) => {
      Records.noterDefi(score);
      finExo({ titre: "Défi du jour", score, total: 10, aRevoir, rejouer: exoDefi });
      app.querySelector(".score-carte .petit").textContent = `Défi du jour relevé · ${Records.nbDefis()} au total. Revenez demain pour un nouveau défi !`;
    }
  });
}

/** Sprint : 60 secondes de vrai ou faux, réponses au clavier possibles (← faux, → vrai). */
function exoSprint(filtre) {
  const pool = signesPour(filtre);
  const DUREE = 60;
  app.innerHTML = `
    <div class="quiz-tete"><a class="quitter" href="#/entrainement" aria-label="Quitter l'exercice">×</a><span class="surtitre">S'entraîner · Sprint vrai ou faux</span></div>
    <div class="depart">
      <h1>Sprint vrai ou faux</h1>
      <p class="hero-sous">Une vidéo, un mot : est-ce le bon signe ? Vous avez <strong>${DUREE} secondes</strong> pour répondre au plus grand nombre.
        Au clavier : <kbd>←</kbd> faux, <kbd>→</kbd> vrai.</p>
      <p class="petit">Signes : ${echapper(nomFiltre(filtre))}${Records.meilleur("sprint") != null ? ` · Record : ${exercice("sprint").record(Records.meilleur("sprint"))}` : ""}</p>
      <button class="btn" id="partir">C'est parti !</button>
    </div>`;
  document.getElementById("partir").onclick = () => sprint(pool, DUREE, filtre);
  document.getElementById("partir").focus();
}

function sprint(pool, duree, filtre) {
  let score = 0, vus = 0;
  const erreurs = [];
  const tirer = () => {
    const e = auHasard(pool), vrai = Math.random() < .5;
    return { e, vrai, mot: vrai ? e : auHasard(pool.filter(x => x !== e)), v: auHasard(e.videos) };
  };
  app.innerHTML = `
    <div class="quiz-tete">
      <a class="quitter" href="#/entrainement" aria-label="Quitter l'exercice">×</a>
      <div class="progression-quiz chrono"><span id="chrono-barre" style="width:100%"></span></div>
      <span class="quiz-compte" id="chrono-texte">${duree} s</span>
    </div>
    <div class="sprint">
      <div class="sprint-video" id="sprint-video"></div>
      <div class="sprint-cote">
        <p class="sprint-score"><span id="sprint-score">0</span> <span class="petit">bonne(s) réponse(s)</span></p>
        <p class="consigne">Est-ce « <strong id="sprint-mot"></strong> » ?</p>
        <div class="choix vrai-faux">
          <button class="btn-choix" data-r="faux"><kbd aria-hidden="true">←</kbd> Faux</button>
          <button class="btn-choix" data-r="vrai">Vrai <kbd aria-hidden="true">→</kbd></button>
        </div>
      </div>
    </div>`;
  const zone = document.getElementById("sprint-video");
  let courant = tirer(), suivant = tirer();
  // deux vidéos superposées : celle qu'on regarde, et la suivante qui se charge déjà
  const creer = q => {
    const v = document.createElement("video");
    Object.assign(v, { muted: true, loop: true, playsInline: true, preload: "auto" });
    v.setAttribute("aria-label", "Vidéo d'un signe");
    v.dataset.page = q.v.page;
    v.innerHTML = sourcesVideo(q.v.url);
    zone.appendChild(v);
    return v;
  };
  let vCourante = creer(courant), vSuivante = creer(suivant);
  vCourante.classList.add("actif"); vCourante.play().catch(() => {});
  const afficherMot = () => (document.getElementById("sprint-mot").textContent = courant.mot.mot);
  afficherMot();

  const fin = Date.now() + duree * 1000;
  const barre = document.getElementById("chrono-barre"), texte = document.getElementById("chrono-texte");
  const tic = setInterval(() => {
    const reste = Math.max(0, fin - Date.now());
    barre.style.width = `${(100 * reste) / (duree * 1000)}%`;
    texte.textContent = `${Math.ceil(reste / 1000)} s`;
    barre.parentElement.classList.toggle("urgent", reste < 10000);
    if (!reste) terminer();
  }, 100);
  surNettoyage(() => clearInterval(tic));

  let fini = false, verrou = false;
  const repondre = async dit => {
    if (fini || verrou) return;
    verrou = true;
    const juste = dit === courant.vrai;
    vus++;
    if (juste) score++; else erreurs.push(courant.e);
    if (courant.vrai) Progression.repondre(courant.e.k, juste); else Progression.activite();
    document.getElementById("sprint-score").textContent = score;
    const sprintEl = app.querySelector(".sprint");
    sprintEl.classList.remove("eclair-ok", "eclair-ko"); void sprintEl.offsetWidth;
    sprintEl.classList.add(juste ? "eclair-ok" : "eclair-ko");
    // question suivante (sa vidéo est déjà chargée)
    vCourante.remove();
    courant = suivant; vCourante = vSuivante;
    vCourante.classList.add("actif"); vCourante.play().catch(() => {});
    afficherMot();
    suivant = tirer(); vSuivante = creer(suivant);
    verrou = false;
  };
  app.querySelectorAll("[data-r]").forEach(b => (b.onclick = () => repondre(b.dataset.r === "vrai")));
  const clavier = ev => {
    if (ev.key === "ArrowRight" || ev.key.toLowerCase() === "v") { ev.preventDefault(); repondre(true); }
    if (ev.key === "ArrowLeft" || ev.key.toLowerCase() === "f") { ev.preventDefault(); repondre(false); }
  };
  document.addEventListener("keydown", clavier);
  surNettoyage(() => document.removeEventListener("keydown", clavier));

  function terminer() {
    if (fini) return;
    fini = true;
    arreterExercice();
    majCompteurs();
    finExo({ titre: "Sprint vrai ou faux", score, total: 0, recordId: "sprint", aRevoir: erreurs, rejouer: () => exoSprint(filtre),
      bravo: score >= 20 ? "Impressionnant !" : score >= 10 ? "Bien joué !" : "Continuez, ça vient !" });
    app.querySelector(".score-carte .petit").insertAdjacentHTML("afterbegin", `${vus} question(s) en ${duree} s. `);
  }
}

/** Jeu des paires : 6 vidéos et 6 mots face cachée. */
function exoPaires(filtre) {
  const pool = signesPour(filtre);
  const signes = melanger(pool).slice(0, Math.min(6, pool.length));
  const cartes = melanger(signes.flatMap(e => [{ e, type: "video", v: auHasard(e.videos) }, { e, type: "mot" }]));
  let coups = 0, trouvees = 0, ouvertes = [], bloque = false;
  app.innerHTML = `
    <div class="quiz-tete">
      <a class="quitter" href="#/entrainement" aria-label="Quitter l'exercice">×</a>
      <div class="progression-quiz"><span id="paires-barre" style="width:0"></span></div>
      <span class="quiz-compte" id="paires-coups">0 coup</span>
    </div>
    <span class="surtitre">S'entraîner · Jeu des paires</span>
    <p class="consigne">Associez chaque vidéo à son mot</p>
    <div class="paires">${cartes.map((c, i) => `<button class="carte-paire" data-i="${i}" aria-label="Carte ${i + 1}, face cachée"><span class="dos" aria-hidden="true"></span></button>`).join("")}</div>
    <p class="petit">${Records.meilleur("paires") != null ? `Record : ${Records.meilleur("paires")} coups (le minimum possible est 6).` : "Le minimum possible est 6 coups."}</p>`;
  const boutons = [...app.querySelectorAll(".carte-paire")];
  const montrer = (i, visible) => {
    const b = boutons[i], c = cartes[i];
    b.classList.toggle("ouverte", visible);
    b.innerHTML = !visible ? `<span class="dos" aria-hidden="true"></span>`
      : c.type === "video" ? miniVideo(c.v) : `<span class="mot-paire">${echapper(c.e.mot)}</span>`;
    b.setAttribute("aria-label", visible ? (c.type === "video" ? `Carte ${i + 1} : une vidéo` : `Carte ${i + 1} : ${c.e.mot}`) : `Carte ${i + 1}, face cachée`);
  };
  boutons.forEach((b, i) => (b.onclick = async () => {
    if (bloque || b.classList.contains("trouvee") || ouvertes.includes(i)) return;
    montrer(i, true);
    ouvertes.push(i);
    if (ouvertes.length < 2) return;
    coups++;
    document.getElementById("paires-coups").textContent = `${coups} coup${coups > 1 ? "s" : ""}`;
    const [a, c] = ouvertes.map(j => cartes[j]);
    if (a.e === c.e && a.type !== c.type) {
      ouvertes.forEach(j => { boutons[j].classList.add("trouvee"); boutons[j].disabled = true; });
      ouvertes = [];
      trouvees++;
      document.getElementById("paires-barre").style.width = `${(100 * trouvees) / signes.length}%`;
      Progression.activite();
      if (trouvees === signes.length) {
        await attendreMs(900);
        if (!toujoursLa(b)) return;
        majCompteurs();
        finExo({ titre: "Jeu des paires", score: coups, total: 0, recordId: signes.length === 6 ? "paires" : null, valeurRecord: coups, rejouer: () => exoPaires(filtre),
          bravo: coups <= 8 ? "Excellente mémoire !" : coups <= 12 ? "Bien joué !" : "Toutes les paires trouvées !" });
        app.querySelector(".score-carte .petit").insertAdjacentHTML("afterbegin", "coups pour trouver les 6 paires. ");
      }
    } else {
      bloque = true;
      ouvertes.forEach(j => boutons[j].classList.add("rate"));
      await attendreMs(1300);
      if (!toujoursLa(b)) return;
      ouvertes.forEach(j => { boutons[j].classList.remove("rate"); montrer(j, false); });
      ouvertes = [];
      bloque = false;
    }
  }));
}

/** Épeler : retrouver les photos de l'alphabet, dans l'ordre, pour 5 mots. */
function exoEpeler() {
  // photos sans la lettre écrite dessus (voir photoSansLettre dans app.js)
  avecPhotosSansLettre(ALPHA.slice(), exoEpelerPret);
}

function exoEpelerPret(photos) {
  const mots = melanger(motsEpelables(TOUS_LES_SIGNES.map(e => e.mot))).slice(0, 5);
  const ordrePhotos = melanger(ALPHA);
  let n = 0, sansFaute = 0;
  const page = pageCourante;
  const motSuivant = () => {
    if (page !== pageCourante) return;
    if (n >= mots.length) {
      return finExo({ titre: "Épeler avec les doigts", score: sansFaute, total: mots.length, recordId: "epeler", rejouer: exoEpeler });
    }
    const mot = mots[n], lettres = [...sansAccents(mot)];
    let pos = 0, fautes = 0, fautesIci = 0;
    app.innerHTML = `${enteteExo("Épeler avec les doigts", n, mots.length)}
      <p class="consigne">Épelez « <strong>${echapper(mot)}</strong> » : touchez les lettres dans l'ordre</p>
      <div class="mot-cases" aria-live="polite">${lettres.map((l, i) => `<span class="case" data-i="${i}"></span>`).join("")}</div>
      <div class="grille-photos">${ordrePhotos.map(a => `<button class="photo-lettre" data-l="${a.lettre}" aria-label="Une configuration de la main"><img src="${echapper(photos[a.lettre])}" alt="" width="200" height="150" decoding="async"></button>`).join("")}</div>
      <p class="petit">Les lettres ne sont pas écrites sous les photos : c'est à vous de les reconnaître. Après deux erreurs, la bonne photo s'allume.</p>
      <div id="retour-quiz" role="status" aria-live="polite"></div>`;
    const cases = [...app.querySelectorAll(".case")];
    const marquerCourante = () => cases.forEach((c, i) => c.classList.toggle("courante", i === pos));
    marquerCourante();
    app.querySelectorAll(".photo-lettre").forEach(b => (b.onclick = async () => {
      if (pos >= lettres.length) return;
      if (b.dataset.l === lettres[pos]) {
        cases[pos].textContent = lettres[pos];
        cases[pos].classList.add("trouvee");
        app.querySelectorAll(".photo-lettre.indice").forEach(x => x.classList.remove("indice"));
        b.classList.remove("secoue"); b.classList.add("bonne"); setTimeout(() => b.classList.remove("bonne"), 400);
        pos++; fautesIci = 0;
        marquerCourante();
        if (pos === lettres.length) {
          Progression.activite(); majCompteurs();
          if (!fautes) sansFaute++;
          await bandeauReponse(!fautes, fautes ? `« ${echapper(mot)} » épelé, avec ${fautes} erreur(s).` : `Parfait, « ${echapper(mot)} » sans faute !`, n + 1 < mots.length ? "Mot suivant" : "Voir le résultat");
          n++;
          motSuivant();
        }
      } else {
        fautes++; fautesIci++;
        b.classList.remove("secoue"); void b.offsetWidth; b.classList.add("secoue");
        if (fautesIci >= 2) app.querySelector(`.photo-lettre[data-l="${lettres[pos]}"]`)?.classList.add("indice");
      }
    }));
  };
  motSuivant();
}

/** Épeler mon prénom : on tape un mot, les photos de l'alphabet défilent. */
function exoPrenom() {
  app.innerHTML = `
    <a class="retour" href="#/entrainement">← S'entraîner</a>
    <h1>Épeler mon prénom</h1>
    <p class="hero-sous">Tapez votre prénom (ou n'importe quel mot) : les lettres défilent en alphabet dactylologique. Imitez-les avec votre main.</p>
    <form class="reponse-epeler" id="form-prenom" autocomplete="off">
      <input id="prenom" placeholder="Votre prénom…" aria-label="Prénom ou mot à épeler" maxlength="24" required>
      <button class="btn" type="submit">Épeler</button>
    </form>
    <div class="epeler" id="zone-prenom" hidden>
      <div class="lettre-grande" id="lettre-prenom"></div>
      <p class="lettre-legende" id="legende-prenom" aria-live="polite"></p>
      <div class="pastilles" id="pastilles-prenom"></div>
      <div class="hero-actions"><button class="btn btn-second" id="revoir-prenom">Revoir</button><button class="btn btn-second" id="vitesse-prenom">Plus lent</button></div>
    </div>`;
  let lettres = [], vitesse = 1200, minuteur = null;
  const page = pageCourante;
  surNettoyage(() => clearTimeout(minuteur));
  const jouer = () => {
    clearTimeout(minuteur);
    let i = 0;
    const etape = () => {
      if (page !== pageCourante) return;
      document.querySelectorAll("#pastilles-prenom span").forEach((p, j) => p.classList.toggle("actif", j === i));
      if (i >= lettres.length) { document.getElementById("legende-prenom").textContent = "Fin du mot"; return; }
      const a = lettre(lettres[i]);
      document.getElementById("lettre-prenom").innerHTML = `<img src="${echapper(a.image)}" alt="Lettre ${a.lettre} en LSF" width="200" height="150">`;
      document.getElementById("legende-prenom").textContent = a.lettre;
      i++;
      minuteur = setTimeout(etape, vitesse);
    };
    etape();
  };
  document.getElementById("form-prenom").onsubmit = ev => {
    ev.preventDefault();
    lettres = [...sansAccents(document.getElementById("prenom").value)].filter(c => lettre(c));
    if (!lettres.length) return;
    document.getElementById("zone-prenom").hidden = false;
    document.getElementById("pastilles-prenom").innerHTML = lettres.map(() => "<span></span>").join("");
    Progression.activite(); majCompteurs();
    jouer();
  };
  document.getElementById("revoir-prenom").onclick = jouer;
  document.getElementById("vitesse-prenom").onclick = ev => {
    vitesse = vitesse === 1200 ? 2000 : 1200;
    ev.currentTarget.textContent = vitesse === 1200 ? "Plus lent" : "Vitesse normale";
    jouer();
  };
  document.getElementById("prenom").focus();
}
