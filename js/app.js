// Application : navigation entre les pages (routage par #hash) et affichage.
// Toutes les vidéos sont de vrais signeurs (dictionnaire, licences libres).

const D = window.LSF_DATA;
const app = document.getElementById("app");

const echapper = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const melanger = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const auHasard = a => a[Math.floor(Math.random() * a.length)];

// Thèmes avec leurs entrées du dictionnaire (mots introuvables ignorés)
const THEMES = D.themes.map(t => ({ ...t, entrees: t.mots.map(m => Dico.trouver(m)).filter(Boolean) }));
const theme = id => THEMES.find(t => t.id === id);
const entree = k => Dico.entrees.find(e => e.k === k);
const TOUS_LES_SIGNES = [...new Map(THEMES.flatMap(t => t.entrees).map(e => [e.k, e])).values()];
const NIVEAUX = { 1: "Premiers pas", 2: "Vie de tous les jours", 3: "Pour aller plus loin" };

const ICONES = {
  main: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.5 14.5a1.5 1.5 0 0 1 2.4-1.8L7 14"/>',
  famille: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 6 4.8"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.9-.3-1 .4-2.1 1.5-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>',
  sourire: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  bulle: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>',
  pouce: '<path d="M7 11v9H4v-9h3zM7 11l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
  horloge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  tasse: '<path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M7 3v2M11 3v2"/>',
  patte: '<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="6" r="1.8"/><circle cx="15.5" cy="7" r="1.8"/><circle cx="18" cy="11" r="1.6"/><path d="M8 16c0-2.5 2-4.5 4.5-4.5S17 13 16.5 16c-.4 2-2.4 3-4.3 2.5C10 18 8 18.5 8 16z"/>',
  maison: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"/>',
  eclair: '<path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/>',
  alphabet: '<path d="M4 18l4-12 4 12M5.5 14h5M14 6h4a2.5 2.5 0 0 1 0 5h-4zm0 5h4.5a2.5 2.5 0 0 1 0 5H14z"/>',
  reviser: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/>',
  flamme: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.2-5.4 3.6-7.6.4 1.6 1.2 2.6 2.2 3.1-.2-2.9 1.1-5.7 3.4-7.3-.3 2.9 1 4.8 2.4 6.6 1.1 1.4 1.4 2.8 1.4 4.3C18.5 18.4 15.9 21 12 21z" fill="currentColor" stroke="none"/>',
  coche: '<path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="3"/>',
  etoile: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  chrono: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M10 3h4M12 3v3M18.5 6.5l1.5-1.5"/>',
  paires: '<rect x="3" y="5" width="9" height="13" rx="2"/><path d="M15 6.5l3.5 1a2 2 0 0 1 1.4 2.4l-2.4 8.7a2 2 0 0 1-2.4 1.4L12 19"/>',
  crayon: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4"/>',
  blocs: '<rect x="3" y="14" width="7" height="6" rx="1.5"/><rect x="14" y="14" width="7" height="6" rx="1.5"/><rect x="8.5" y="4" width="7" height="6" rx="1.5"/>',
  livre: '<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
  cible: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>'
};

/** Compteurs de la barre du haut : série de jours et signes appris. */
function majCompteurs() {
  const zone = document.getElementById("compteurs");
  if (!zone) return;
  const serie = Progression.serie();
  const appris = TOUS_LES_SIGNES.filter(e => Progression.estAppris(e.k)).length;
  const profil = Profils.actif();
  zone.innerHTML = `
    <a class="compteur serie" href="#/compte" title="Jours d'affilée">${icone("flamme")}${serie}<span>j</span></a>
    <a class="compteur appris" href="#/progression" title="Signes appris">${icone("etoile")}${appris}<span>/${TOUS_LES_SIGNES.length}</span></a>
    ${profil
      ? `<a class="compteur profil" href="#/compte" title="Mon profil : ${echapper(profil.nom)}">${Avatar.svg(profil.avatar, 30)}<span class="visuellement-cache">Mon profil : ${echapper(profil.nom)}</span></a>`
      : `<a class="compteur profil sans" href="#/compte/nouveau">${icone("sourire")}Créer mon profil</a>`}`;
}

/**
 * Mode gaucher : la classe « gaucher » sur <html> retourne vidéos et photos (style.css).
 * On met à jour la page en place, sans la recharger (un quiz en cours n'est pas perdu).
 */
function appliquerReglages() {
  document.documentElement.dataset.theme = Reglages.theme;
  document.querySelectorAll('input[name="theme"]').forEach(r => (r.checked = r.value === Reglages.theme));
  const gaucher = Reglages.gaucher;
  document.documentElement.classList.toggle("gaucher", gaucher);
  document.querySelectorAll(".btn-gaucher").forEach(b => b.setAttribute("aria-pressed", gaucher));
  document.querySelectorAll(".video-lsf video").forEach(v => (v.controls = !gaucher));
  const opt = document.getElementById("opt-gaucher");
  if (opt) opt.checked = gaucher;
}
function basculerGaucher() {
  Reglages.changer("gaucher", !Reglages.gaucher);
  appliquerReglages();
}
document.addEventListener("click", ev => { if (ev.target.closest(".btn-gaucher")) basculerGaucher(); });
appliquerReglages();

/**
 * Vidéo qui ne charge pas (coupure réseau, fichier retiré…) : au lieu d'un cadre vide,
 * on explique et on propose de réessayer. L'erreur arrive sur la dernière <source>
 * quand le navigateur a essayé toutes les versions (WebM puis MP4).
 */
document.addEventListener("error", ev => {
  const s = ev.target;
  if (s.tagName === "SOURCE" && s === s.parentElement?.lastElementChild) videoEnPanne(s.parentElement);
}, true);

function videoEnPanne(video) {
  if (video.previousElementSibling?.classList.contains("video-erreur")) return;
  const panne = document.createElement("div");
  panne.className = "video-erreur";
  panne.setAttribute("role", "alert");
  const petite = !!video.closest(".choix-video");
  panne.innerHTML = petite ? "<span>Vidéo indisponible</span>" : `
    <strong>La vidéo n'a pas pu se charger.</strong>
    <span>${navigator.onLine ? "La connexion est peut-être lente, ou la vidéo momentanément indisponible." : "Vous semblez hors ligne : vérifiez votre connexion internet."}</span>
    <div class="hero-actions">
      <button class="btn">Réessayer</button>
      ${video.dataset.page ? `<a class="btn btn-second" href="${echapper(video.dataset.page)}" target="_blank" rel="noopener">Voir sur Wikimedia Commons</a>` : ""}
    </div>`;
  video.hidden = true;
  video.before(panne);
  panne.querySelector("button")?.addEventListener("click", () => { panne.remove(); video.hidden = false; video.load(); });
}

// Bandeau « hors ligne » : les vidéos viennent d'internet, mais la progression reste enregistrée.
function majHorsLigne() {
  const b = document.getElementById("hors-ligne");
  if (b) b.hidden = navigator.onLine;
}
window.addEventListener("online", () => {
  majHorsLigne();
  document.querySelectorAll(".video-erreur .btn:not(a)").forEach(b => b.click()); // la connexion revient : on relance
});
window.addEventListener("offline", majHorsLigne);
majHorsLigne();

/** Thème à travailler ensuite : le premier qui n'est pas entièrement appris. */
const themeSuivant = () => THEMES.find(t => t.entrees.some(e => !Progression.estAppris(e.k))) || THEMES[0];
const nbAppris = t => t.entrees.filter(e => Progression.estAppris(e.k)).length;
const icone = nom => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nom] || ""}</svg>`;

/** Petite vidéo muette en boucle (quiz « choisis la bonne vidéo », vignettes). */
const miniVideo = (v, autres = "") => `<video muted loop playsinline autoplay preload="auto" data-page="${echapper(v.page)}" ${autres}>${sourcesVideo(v.url)}</video>`;

// ---------------------------------------------------------------------
// Accueil
// ---------------------------------------------------------------------
function pageAccueil() {
  const aReviser = Progression.aReviser().length;
  const appris = TOUS_LES_SIGNES.filter(e => Progression.estAppris(e.k)).length;
  const bonjour = Dico.trouver("Bonjour");
  app.innerHTML = `
    <section class="hero">
      <div class="hero-texte">
        <span class="surtitre">${Profils.actif() ? `Bonjour ${echapper(Profils.actif().nom)}` : "Langue des Signes Française"}</span>
        <h1>Apprenez à signer, un geste après l'autre.</h1>
        <p class="hero-sous">De vraies vidéos de personnes qui signent, des leçons par thème, des quiz,
          et des révisions qui reviennent au bon moment pour ne rien oublier.</p>
        <div class="hero-actions">
          <a class="btn" href="#/lecons">Commencer les leçons</a>
          <a class="btn btn-second" href="#/reviser">Réviser${aReviser ? ` (${aReviser})` : ""}</a>
        </div>
        <p class="petit">${appris} signe(s) appris sur ${TOUS_LES_SIGNES.length} dans les leçons · ${Dico.entrees.length} dans le dictionnaire</p>
      </div>
      <div class="hero-video" id="video-accueil"></div>
    </section>
    <section class="tableau">
      ${(() => {
        const t = themeSuivant(), n = nbAppris(t);
        return `<a class="tuile continuer" href="#/theme/${t.id}">
          <span class="petit">${n ? "Continuer" : "Prochaine leçon"} · Niveau ${t.niveau}</span>
          <span class="tuile-titre">${echapper(t.titre)}</span>
          <span class="barre"><span style="width:${(100 * n) / t.entrees.length}%"></span></span>
          <span class="petit">${n} / ${t.entrees.length} signes appris</span>
        </a>`;
      })()}
      <a class="tuile serie" href="#/progression">
        <span class="carte-icone" style="--c:var(--chaud)">${icone("flamme")}</span>
        <span class="tuile-chiffre">${Progression.serie()}</span>
        <span class="petit">jour(s) d'affilée</span>
      </a>
      <a class="tuile reviser" href="#/reviser">
        <span class="carte-icone" style="--c:var(--accent)">${icone("reviser")}</span>
        <span class="tuile-chiffre">${aReviser}</span>
        <span class="petit">signe${aReviser > 1 ? "s" : ""} à réviser aujourd'hui</span>
      </a>
    </section>
    ${(() => {
      const d = Records.defiDuJour();
      return `<a class="defi-carte ${d != null ? "fait" : ""}" href="#/entrainement/defi">
        <span class="carte-icone">${icone("cible")}</span>
        <span class="defi-texte"><span class="surtitre">Défi du jour</span>
          <strong>${d != null ? `Réussi aujourd'hui : ${d} / 10` : "10 questions variées pour garder la forme"}</strong>
          <span class="petit">${d != null ? "Revenez demain pour un nouveau défi." : "Environ 5 minutes · vidéos, mots et phrases"}</span></span>
        <span class="btn">${d != null ? "Refaire" : "C'est parti"}</span>
      </a>`;
    })()}
    ${Sauvegarde.conseillee() ? `
      <a class="rappel-sauvegarde" href="#/progression/sauvegarde">
        <strong>Pensez à sauvegarder votre progression</strong>
        <span class="petit">Elle n'est enregistrée que dans ce navigateur. Une sauvegarde prend deux secondes →</span>
      </a>` : ""}
    <section>
      <h2>Thèmes</h2>
      <div class="grille">${THEMES.slice(0, 4).map(carteTheme).join("")}${carteAlphabet()}</div>
      <p><a class="lien-plus" href="#/lecons">Voir les ${THEMES.length} thèmes →</a></p>
    </section>
    <section class="info">
      <h2>Bon à savoir</h2>
      <ul>
        <li>La LSF est une langue à part entière, avec sa propre grammaire, différente du français.</li>
        <li>L'expression du visage fait partie du signe : regardez aussi le visage de la personne qui signe.</li>
        <li>Un même mot peut se signer de plusieurs façons selon les régions : comparez les signeurs quand il y en a plusieurs.</li>
        <li>Rien ne remplace la pratique avec des personnes sourdes ou un cours avec un enseignant.</li>
      </ul>
      <p><a class="lien-plus" href="#/comprendre">Comprendre la LSF : ${MINI_LECONS.length} mini-leçons de grammaire et de culture →</a></p>
    </section>`;
  if (bonjour) {
    const zone = document.getElementById("video-accueil");
    zone.innerHTML = htmlVideo(bonjour.videos[0], { label: "Vidéo du signe « Bonjour »" });
    brancherVitesses(zone);
  }
}

function carteTheme(t) {
  const n = t.entrees.filter(e => Progression.estAppris(e.k)).length;
  return `
    <a class="carte" href="#/theme/${t.id}" style="--c:${t.couleur}">
      <span class="carte-icone">${icone(t.icone)}</span>
      <span class="carte-titre">${echapper(t.titre)}</span>
      <span class="petit">${t.entrees.length} signes</span>
      <span class="barre"><span style="width:${(n / t.entrees.length) * 100}%"></span></span>
      <span class="petit">${n} appris</span>
    </a>`;
}

function carteAlphabet() {
  return `
    <a class="carte" href="#/alphabet" style="--c:#3f7f8f">
      <span class="carte-icone">${icone("alphabet")}</span>
      <span class="carte-titre">L'alphabet</span>
      <span class="petit">26 lettres · épeler avec les doigts</span>
      <span class="barre"><span style="width:0"></span></span>
      <span class="petit">Leçon et exercices</span>
    </a>`;
}

// ---------------------------------------------------------------------
// Leçons
// ---------------------------------------------------------------------
// Couleur de chaque unité du parcours
const COULEURS_NIVEAUX = { 1: "#1f6f64", 2: "#3a6ea5", 3: "#93566b" };

function pageLecons() {
  const suivant = themeSuivant();
  const etape = t => {
    const n = nbAppris(t), p = Math.round((100 * n) / t.entrees.length);
    const etat = p === 100 ? "fini" : t === suivant ? "suivante" : "";
    return `
      <a class="etape ${etat}" href="#/theme/${t.id}" style="--c:${t.couleur};--p:${p}">
        ${t === suivant ? `<span class="bulle-suivante">${n ? "Continuer" : "Commencer"}</span>` : ""}
        <span class="pastille">${icone(p === 100 ? "coche" : t.icone)}</span>
        <span class="etape-nom">${echapper(t.titre)}</span>
        <span class="etape-info">${n} / ${t.entrees.length} signes</span>
      </a>`;
  };
  app.innerHTML = `
    <h1>Votre parcours</h1>
    <p class="hero-sous">Avancez étape par étape. Chaque pastille est un thème : elle se remplit à mesure que vous apprenez ses signes.
      Les pastilles en pointillés sont des mini-leçons de grammaire et de culture.</p>
    <p><a class="lien-plus" href="#/comprendre">Toutes les mini-leçons « Comprendre la LSF » →</a></p>
    ${Object.entries(NIVEAUX).map(([n, nom]) => {
      const ths = THEMES.filter(t => String(t.niveau) === n);
      const total = ths.reduce((s, t) => s + t.entrees.length, 0), faits = ths.reduce((s, t) => s + nbAppris(t), 0);
      return `
      <div class="unite" style="--c:${COULEURS_NIVEAUX[n]}">
        <div><small>Unité ${n}</small><strong>${nom}</strong></div>
        <span class="compte">${faits} / ${total} signes</span>
      </div>
      <div class="parcours">
        ${ths.map(etape).join("")}
        ${n === "1" ? `
        <a class="etape" href="#/alphabet" style="--c:#3f7f8f;--p:0">
          <span class="pastille">${icone("alphabet")}</span>
          <span class="etape-nom">L'alphabet</span>
          <span class="etape-info">26 lettres · épeler</span>
        </a>` : ""}
        ${MINI_LECONS.filter(l => String(l.niveau) === n).map(l => `
        <a class="etape etape-lecon ${Records.leconFaite(l.id) ? "fini" : ""}" href="#/comprendre/${l.id}" style="--c:${COULEURS_LECONS[l.type]};--p:${Records.leconFaite(l.id) ? 100 : 0}">
          <span class="pastille">${icone(Records.leconFaite(l.id) ? "coche" : l.icone)}</span>
          <span class="etape-nom">${echapper(l.titre)}</span>
          <span class="etape-info">Mini-leçon · ${l.type}</span>
        </a>`).join("")}
      </div>`;
    }).join("")}
    <p style="text-align:center"><a class="btn btn-second" href="#/quiz/tout">Quiz sur tous les thèmes</a></p>`;
}

function pageTheme(id) {
  const t = theme(id);
  if (!t) return page404();
  const premier = t.entrees.find(e => !Progression.estAppris(e.k)) || t.entrees[0];
  app.innerHTML = `
    <a class="retour" href="#/lecons">← Leçons</a>
    <h1 class="titre-icone" style="--c:${t.couleur}"><span class="carte-icone">${icone(t.icone)}</span>${echapper(t.titre)}</h1>
    <div class="actions-theme">
      <a class="btn" href="#/signe/${t.id}/${encodeURIComponent(premier.k)}">${t.entrees.some(e => Progression.estAppris(e.k)) ? "Continuer la leçon" : "Commencer la leçon"}</a>
      <a class="btn btn-second" href="#/quiz/${t.id}">Quiz sur ce thème</a>
    </div>
    <div class="liste-signes">
      ${t.entrees.map(e => {
        const c = Progression.carte(e.k);
        return `<a class="ligne-signe" href="#/signe/${t.id}/${encodeURIComponent(e.k)}" style="--c:${t.couleur}">
          <span>${echapper(e.mot)}</span>
          <span class="etat">${Progression.estAppris(e.k) ? "✓ appris" : c ? `boîte ${c.boite}/5` : ""}</span>
        </a>`;
      }).join("")}
    </div>`;
}

function pageSigne(themeId, k) {
  const t = theme(themeId);
  const e = entree(decodeURIComponent(k || ""));
  if (!t || !e) return page404();
  const i = t.entrees.indexOf(e);
  const prec = t.entrees[i - 1], suiv = t.entrees[i + 1];
  const lien = x => `#/signe/${t.id}/${encodeURIComponent(x.k)}`;

  app.innerHTML = `
    <a class="retour" href="#/theme/${t.id}">← ${echapper(t.titre)}</a>
    <div class="fiche">
      <div>
        <div id="zone-video"></div>
        ${e.videos.length > 1 ? `
          <div class="signeurs">
            <span class="petit">Voir un autre signeur :</span>
            ${e.videos.map((v, n) => `<button class="puce ${n === 0 ? "actif" : ""}" data-n="${n}">${echapper(v.auteur.split(/Video editing|:|,/)[0].trim() || "Version " + (n + 1))}</button>`).join("")}
          </div>` : ""}
      </div>
      <div class="fiche-info">
        <span class="surtitre">Signe ${i + 1} / ${t.entrees.length}</span>
        <h1>${echapper(e.mot)}</h1>
        ${htmlDescription(e) || `
        <ol class="conseils-signe">
          <li>Regardez le signe plusieurs fois, au ralenti si besoin (0,5×).</li>
          <li>Observez la <strong>forme de la main</strong>, son <strong>mouvement</strong>, son <strong>emplacement</strong> et l'<strong>expression du visage</strong>.</li>
          <li>Reproduisez-le face à un miroir, puis sans regarder la vidéo.</li>
        </ol>`}
        <button class="btn" id="btn-appris"></button>
        ${htmlSignaler(e)}
        ${liensExternes(e.mot)}
        <div class="nav-signes">
          ${prec ? `<a href="${lien(prec)}">← ${echapper(prec.mot)}</a>` : "<span></span>"}
          ${suiv ? `<a href="${lien(suiv)}">${echapper(suiv.mot)} →</a>` : `<a href="#/quiz/${t.id}">Faire le quiz →</a>`}
        </div>
      </div>
    </div>`;

  const zone = document.getElementById("zone-video");
  let actuelle = 0;
  const montrer = n => { actuelle = n; zone.innerHTML = htmlVideo(e.videos[n], { label: `Vidéo du signe « ${e.mot} »` }); brancherVitesses(zone); };
  montrer(0);
  brancherSignaler(app, e, () => e.videos[actuelle].page);
  app.querySelectorAll(".signeurs .puce").forEach(b => (b.onclick = () => {
    app.querySelectorAll(".signeurs .puce").forEach(x => x.classList.toggle("actif", x === b));
    montrer(+b.dataset.n);
  }));
  const btn = document.getElementById("btn-appris");
  const maj = () => {
    const ok = Progression.carte(e.k)?.appris;
    btn.textContent = ok ? "✓ Appris (sera révisé)" : "Je l'ai appris";
    btn.classList.toggle("btn-ok", !!ok);
  };
  btn.onclick = () => { Progression.basculerAppris(e.k); maj(); majCompteurs(); };
  maj();
}

// ---------------------------------------------------------------------
// Quiz : deux types de questions
//  - « vidéo -> mot » : quel mot est signé ?
//  - « mot -> vidéo » : quelle vidéo montre ce mot ?
// ---------------------------------------------------------------------
function pageQuiz(source) {
  let entrees, titre, retour;
  if (source === "revision") {
    entrees = Progression.aReviser().map(entree).filter(Boolean).slice(0, 12);
    titre = "Révision du jour"; retour = "#/reviser";
  } else if (theme(source)) {
    const t = theme(source);
    entrees = melanger(t.entrees).slice(0, 8);
    titre = t.titre; retour = `#/theme/${t.id}`;
  } else {
    entrees = melanger(TOUS_LES_SIGNES).slice(0, 10);
    titre = "Tous les thèmes"; retour = "#/lecons";
  }
  if (!entrees.length) { location.hash = "#/reviser"; return; }
  // distracteurs : de préférence le même thème (plus difficile, plus utile)
  const voisins = e => {
    const t = THEMES.find(th => th.entrees.includes(e));
    const pool = (t && t.entrees.length >= 4 ? t.entrees : TOUS_LES_SIGNES).filter(x => x !== e);
    return melanger(pool).slice(0, 3);
  };
  const questions = melanger(entrees).map((e, i) => ({ e, type: i % 2 ? "mot-video" : "video-mot", video: auHasard(e.videos) }));
  let n = 0, score = 0;

  const afficher = () => {
    if (n >= questions.length) {
      app.innerHTML = `
        <div class="quiz-fin">
          <h1>${score === questions.length ? "Parfait !" : score >= questions.length / 2 ? "Bien joué !" : "Continuez, ça vient !"}</h1>
          <div class="score-carte"><p class="score">${score} / ${questions.length}</p><span class="petit">bonnes réponses</span></div>
          <p class="petit">Les signes ratés reviendront dans vos révisions dès aujourd'hui ; les autres plus tard.</p>
          <div class="hero-actions">
            <a class="btn" href="#/quiz/${source || "tout"}" onclick="setTimeout(route)">Recommencer</a>
            <a class="btn btn-second" href="${retour}">Retour</a>
          </div>
        </div>`;
      return;
    }
    const q = questions[n];
    const choix = melanger([q.e, ...voisins(q.e)]);
    const entete = `
      <div class="quiz-tete">
        <a class="quitter" href="${retour}" title="Quitter le quiz" aria-label="Quitter le quiz">×</a>
        <div class="progression-quiz"><span style="width:${(100 * n) / questions.length}%"></span></div>
        <span class="quiz-compte">${n + 1} / ${questions.length}</span>
      </div>
      <span class="surtitre">Quiz · ${echapper(titre)}</span>`;
    if (q.type === "video-mot") {
      app.innerHTML = `${entete}
        <p class="consigne">Quel mot est signé ?</p>
        <div class="quiz">
          <div id="zone-video"></div>
          <div class="choix">${choix.map(c => `<button class="btn-choix" data-k="${echapper(c.k)}">${echapper(c.mot)}</button>`).join("")}</div>
        </div>
        <div id="retour-quiz" role="status" aria-live="polite"></div>`;
      const zone = document.getElementById("zone-video");
      zone.innerHTML = htmlVideo(q.video, { label: "Vidéo du signe à deviner" });
      brancherVitesses(zone);
    } else {
      app.innerHTML = `${entete}
        <p class="consigne">Quelle vidéo montre « <strong>${echapper(q.e.mot)}</strong> » ?</p>
        <div class="choix-videos">${choix.map((c, i) => `<button class="choix-video" data-k="${echapper(c.k)}" aria-label="Vidéo ${i + 1}">${miniVideo(auHasard(c.videos))}</button>`).join("")}</div>
        <div id="retour-quiz" role="status" aria-live="polite"></div>`;
    }
    app.querySelectorAll("[data-k]").forEach(b => (b.onclick = () => {
      const juste = b.dataset.k === q.e.k;
      if (juste) score++;
      const carte = Progression.repondre(q.e.k, juste); majCompteurs();
      app.querySelectorAll("[data-k]").forEach(x => {
        x.disabled = true;
        if (x.dataset.k === q.e.k) x.classList.add("juste");
        else if (x === b) x.classList.add("faux");
      });
      const prochain = juste ? (Progression.INTERVALLES[carte.boite] === 1 ? "demain" : `dans ${Progression.INTERVALLES[carte.boite]} jours`) : "aujourd'hui";
      const bandeau = document.getElementById("retour-quiz");
      bandeau.className = juste ? "ok" : "ko";
      bandeau.innerHTML = `
        <p class="${juste ? "msg-ok" : "msg-ko"}">${juste ? "Bravo !" : `Pas tout à fait : c'était « ${echapper(q.e.mot)} ».`}
          <span class="petit">Prochaine révision de ce signe : ${prochain}.</span></p>
        <button class="btn ${juste ? "btn-ok" : "btn-ko"}" id="suivant">${n + 1 < questions.length ? "Continuer" : "Voir le résultat"}</button>`;
      document.getElementById("suivant").focus();
      document.getElementById("suivant").onclick = () => { n++; afficher(); };
    }));
  };
  afficher();
}

// ---------------------------------------------------------------------
// Révision intelligente
// ---------------------------------------------------------------------
function pageReviser() {
  const aReviser = Progression.aReviser();
  const boites = Progression.parBoite();
  const total = boites.reduce((s, x) => s + x, 0);
  app.innerHTML = `
    <h1>Réviser</h1>
    <p class="hero-sous">Les signes que vous avez vus reviennent au bon moment : souvent quand vous les oubliez,
      de plus en plus rarement quand vous les connaissez.</p>
    <div class="carte-revision">
      ${aReviser.length ? `
        <p class="score">${aReviser.length}</p>
        <p>signe${aReviser.length > 1 ? "s" : ""} à réviser aujourd'hui</p>
        <a class="btn btn-grand" href="#/quiz/revision">Commencer la révision</a>` : total ? `
        <p class="score">✓</p>
        <p>Rien à réviser aujourd'hui. Revenez demain, ou apprenez de nouveaux signes !</p>
        <a class="btn" href="#/lecons">Apprendre de nouveaux signes</a>` : `
        <p>Vous n'avez encore aucun signe à réviser.</p>
        <p class="petit">Faites une leçon ou un quiz : les signes rencontrés seront ensuite proposés ici.</p>
        <a class="btn" href="#/lecons">Commencer une leçon</a>`}
    </div>
    ${total ? `<h2>Où en sont vos signes</h2>${htmlBoites(boites)}` : ""}`;
}

function htmlBoites(boites) {
  const max = Math.max(1, ...boites);
  const noms = ["", "À revoir", "En cours", "Presque su", "Bien su", "Maîtrisé"];
  return `<div class="boites">${[1, 2, 3, 4, 5].map(b => `
    <div class="boite">
      <div class="boite-barre"><span style="height:${(100 * boites[b]) / max}%"></span></div>
      <strong>${boites[b]}</strong>
      <span class="petit">${noms[b]}</span>
    </div>`).join("")}</div>`;
}

// ---------------------------------------------------------------------
// Alphabet dactylologique
// ---------------------------------------------------------------------
// (adresses sans les paramètres de suivi « ?utm_… » ajoutés par Wikimedia)
const ALPHA = (window.ALPHABET || []).map(a => ({ ...a, image: a.image.split("?")[0] }));
const lettre = l => ALPHA.find(a => a.lettre === l);
const sansAccents = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

// ---------------------------------------------------------------------
// Photos de l'alphabet SANS la lettre écrite dessus, pour les exercices
// (« Lire un mot épelé », quiz des lettres, « Épeler avec les doigts ») :
// les photos d'origine portent la lettre en haut à gauche, ce qui donnait la réponse.
// La zone du texte est repeinte avec la couleur du mur autour, puis chaque photo est
// posée dans le même cadre 200 × 150, pour que la taille ne change pas d'une lettre à l'autre.
// ---------------------------------------------------------------------
// [x0, y0, x1, y1] : zone du texte, en pixels de la photo d'origine.
// bloc : étiquette blanche à effacer en entier ; largeur : colonnes utiles (R a une marge blanche à droite).
const TEXTE_PHOTOS = {
  A: [8, 0, 52, 25], B: [3, 9, 36, 30], C: [6, 12, 55, 42], D: [2, 14, 50, 44], E: [8, 12, 58, 42],
  F: [10, 10, 54, 42], G: [4, 14, 50, 44], H: [14, 18, 58, 43], I: [10, 13, 34, 38], J: [6, 10, 39, 44],
  K: [15, 15, 58, 40], L: [18, 18, 48, 43], M: [0, 0, 79, 41, { bloc: true }], N: [0, 0, 77, 40, { bloc: true }],
  O: [18, 12, 64, 37], P: [70, 10, 120, 44], Q: [26, 18, 78, 52], R: [5, 12, 45, 37, { largeur: 132 }],
  S: [8, 10, 47, 35], T: [0, 6, 40, 36], U: [13, 15, 57, 40], V: [9, 16, 54, 41], W: [8, 16, 65, 41],
  X: [4, 17, 50, 46], Y: [3, 13, 47, 43], Z: [19, 16, 60, 40]
};
const CADRE_PHOTO = { l: 200, h: 150 };
const photosSansLettre = new Map();

/** Promesse de l'adresse (data:) de la photo sans sa lettre ; l'originale si le traitement échoue. */
function photoSansLettre(a) {
  if (!photosSansLettre.has(a.lettre)) photosSansLettre.set(a.lettre, new Promise(ok => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Wikimedia autorise la lecture des pixels (CORS)
    img.onload = () => { try { ok(effacerLettre(img, a.lettre)); } catch (e) { ok(a.image); } };
    img.onerror = () => ok(a.image);
    img.src = a.image;
  }));
  return photosSansLettre.get(a.lettre);
}

function effacerLettre(img, l) {
  const [x0, y0, x1, y1, opt = {}] = TEXTE_PHOTOS[l] || [0, 0, -1, -1];
  const W = Math.min(img.naturalWidth, opt.largeur || Infinity), H = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H), d = image.data;
  // 1. Masque : les pixels sombres et gris (le texte) dans la zone, élargis de 2 pixels pour l'antialiasing
  const m = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = (y * W + x) * 4, r = d[k], g = d[k + 1], b = d[k + 2];
    if (opt.bloc || (0.3 * r + 0.59 * g + 0.11 * b < 185 && Math.max(r, g, b) - Math.min(r, g, b) < 40)) m[y * W + x] = 1;
  }
  const voisins = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const dedans = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  if (!opt.bloc) for (let passe = 0; passe < 2; passe++) {
    const m2 = m.slice();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
      if (!m[y * W + x] && voisins.slice(0, 4).some(([dx, dy]) => dedans(x + dx, y + dy) && m[(y + dy) * W + x + dx])) m2[y * W + x] = 1;
    m.set(m2);
  }
  // 2. Remplissage de l'extérieur vers l'intérieur avec la moyenne des pixels voisins déjà connus
  for (let reste = true; reste;) {
    const fixes = [];
    for (let y = Math.max(0, y0 - 2); y <= Math.min(H - 1, y1 + 2); y++) for (let x = Math.max(0, x0 - 2); x <= Math.min(W - 1, x1 + 2); x++) {
      if (!m[y * W + x]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (const [dx, dy] of voisins) {
        const xx = x + dx, yy = y + dy;
        if (!dedans(xx, yy) || m[yy * W + xx]) continue;
        const k = (yy * W + xx) * 4;
        r += d[k]; g += d[k + 1]; b += d[k + 2]; n++;
      }
      if (n) fixes.push([y * W + x, r / n, g / n, b / n]);
    }
    for (const [p, r, g, b] of fixes) { d[p * 4] = r; d[p * 4 + 1] = g; d[p * 4 + 2] = b; m[p] = 0; }
    reste = fixes.length > 0;
  }
  ctx.putImageData(image, 0, 0);
  // 3. Même cadre pour toutes les lettres. Photo presque au format : on l'agrandit un peu et on
  //    coupe le bas (le poignet) ; photo en hauteur : centrée, bords prolongés sur les côtés.
  const { l: CL, h: CH } = CADRE_PHOTO;
  const s = document.createElement("canvas");
  s.width = CL; s.height = CH;
  const sx = s.getContext("2d");
  const remplir = W / H >= 1.15;
  const k = (remplir ? Math.max : Math.min)(CL / W, CH / H), w = Math.round(W * k), h = Math.round(H * k);
  const ox = Math.round((CL - w) / 2), oy = remplir ? 0 : Math.round((CH - h) / 2);
  sx.drawImage(c, ox, oy, w, h);
  if (ox > 0) {
    sx.drawImage(s, ox, 0, 1, CH, 0, 0, ox, CH);
    sx.drawImage(s, ox + w - 1, 0, 1, CH, ox + w, 0, CL - ox - w, CH);
  }
  if (oy > 0) {
    sx.drawImage(s, 0, oy, CL, 1, 0, 0, CL, oy);
    sx.drawImage(s, 0, oy + h - 1, CL, 1, 0, oy + h, CL, CH - oy - h);
  }
  return s.toDataURL("image/jpeg", 0.92);
}

/** Prépare les photos sans lettre, puis lance « suite » (sauf si on a changé de page entre-temps). */
function avecPhotosSansLettre(lettres, suite) {
  const ici = location.hash;
  app.innerHTML = `<p class="petit" role="status">Préparation des photos…</p>`;
  Promise.all(lettres.map(photoSansLettre)).then(urls => {
    if (location.hash !== ici) return;
    const parLettre = Object.fromEntries(lettres.map((a, i) => [a.lettre, urls[i]]));
    suite(parLettre);
  });
}

function pageAlphabet(mode) {
  if (mode === "quiz") return quizAlphabet();
  if (mode === "epeler") return exerciceEpeler();
  app.innerHTML = `
    <a class="retour" href="#/lecons">← Leçons</a>
    <h1 class="titre-icone" style="--c:#3f7f8f"><span class="carte-icone">${icone("alphabet")}</span>L'alphabet</h1>
    <p class="hero-sous">L'alphabet dactylologique sert à épeler avec les doigts : prénoms, noms propres, mots qui n'ont pas de signe.
      Cliquez sur une lettre pour l'agrandir.</p>
    <div class="actions-theme">
      <a class="btn" href="#/alphabet/quiz">Quiz des lettres</a>
      <a class="btn btn-second" href="#/alphabet/epeler">Lire un mot épelé</a>
      ${boutonGaucher("btn btn-second")}
    </div>
    <div class="alphabet">${ALPHA.map(a => `
      <button class="lettre" data-l="${a.lettre}"><img src="${echapper(a.image)}" alt="Lettre ${a.lettre} en LSF" loading="lazy" decoding="async" width="200" height="150"><strong>${a.lettre}</strong></button>`).join("")}
    </div>
    <p class="credits">Photos : Wikimedia Commons (${[...new Set(ALPHA.map(a => a.auteur))].map(echapper).join(", ")}), licence CC BY-SA 3.0.</p>
    <div class="zoom" id="zoom" hidden></div>`;
  const zoom = document.getElementById("zoom");
  app.querySelectorAll(".lettre").forEach(b => (b.onclick = () => {
    const a = lettre(b.dataset.l);
    zoom.innerHTML = `<div class="zoom-carte" role="dialog" aria-modal="true" aria-label="Lettre ${a.lettre}"><img src="${echapper(a.image)}" alt="Lettre ${a.lettre} en LSF"><strong>${a.lettre}</strong><a href="${echapper(a.page)}" target="_blank" rel="noopener" class="petit">Source</a>
      <button class="btn btn-second" id="fermer-zoom">Fermer</button></div>`;
    zoom.hidden = false;
    document.getElementById("fermer-zoom").focus();
    zoom.dataset.depuis = a.lettre;
  }));
  const fermer = () => {
    zoom.hidden = true;
    app.querySelector(`.lettre[data-l="${zoom.dataset.depuis}"]`)?.focus();
  };
  zoom.onclick = ev => { if (!ev.target.closest("a")) fermer(); };
  zoom.onkeydown = ev => { if (ev.key === "Escape") fermer(); };
}

function quizAlphabet() {
  avecPhotosSansLettre(ALPHA.slice(), photos => quizAlphabetPret(photos));
}

function quizAlphabetPret(photos) {
  const questions = melanger(ALPHA).slice(0, 10);
  let n = 0, score = 0;
  const afficher = () => {
    if (n >= questions.length) {
      app.innerHTML = `<div class="quiz-fin"><h1>Quiz terminé</h1><p class="score">${score} / ${questions.length}</p>
        <div class="hero-actions"><a class="btn" href="#/alphabet/quiz" onclick="setTimeout(route)">Recommencer</a><a class="btn btn-second" href="#/alphabet">Retour à l'alphabet</a></div></div>`;
      return;
    }
    const q = questions[n];
    const choix = melanger([q, ...melanger(ALPHA.filter(a => a !== q)).slice(0, 3)]);
    app.innerHTML = `
      <div class="quiz-tete">
        <a class="quitter" href="#/alphabet" title="Quitter le quiz" aria-label="Quitter le quiz">×</a>
        <div class="progression-quiz"><span style="width:${(100 * n) / questions.length}%"></span></div>
        <span class="quiz-compte">${n + 1} / ${questions.length}</span>
      </div>
      <span class="surtitre">Quiz des lettres</span>
      <p class="consigne">Quelle lettre est représentée ?</p>
      <div class="quiz">
        <div class="lettre-grande"><img src="${echapper(photos[q.lettre])}" alt="Lettre de l'alphabet à deviner" width="200" height="150"></div>
        <div class="choix choix-lettres">${choix.map(c => `<button class="btn-choix" data-l="${c.lettre}">${c.lettre}</button>`).join("")}</div>
      </div>
      <div id="retour-quiz" role="status" aria-live="polite"></div>`;
    app.querySelectorAll("[data-l]").forEach(b => (b.onclick = () => {
      const juste = b.dataset.l === q.lettre;
      if (juste) score++;
      app.querySelectorAll("[data-l]").forEach(x => { x.disabled = true; if (x.dataset.l === q.lettre) x.classList.add("juste"); else if (x === b) x.classList.add("faux"); });
      const bandeau = document.getElementById("retour-quiz");
      bandeau.className = juste ? "ok" : "ko";
      bandeau.innerHTML = `<p class="${juste ? "msg-ok" : "msg-ko"}">${juste ? "Bravo !" : "C'était la lettre " + q.lettre + "."}</p><button class="btn ${juste ? "btn-ok" : "btn-ko"}" id="suivant">Continuer</button>`;
      document.getElementById("suivant").focus();
      document.getElementById("suivant").onclick = () => { n++; afficher(); };
    }));
  };
  afficher();
}

let minuteurEpeler = null;
function exerciceEpeler() {
  // mots des leçons qui ne contiennent que des lettres (3 à 7)
  const mots = TOUS_LES_SIGNES.map(e => e.mot).filter(m => /^[A-Za-zÀ-ÿ]{3,7}$/.test(m));
  const mot = auHasard(mots);
  const lettres = [...sansAccents(mot)];
  avecPhotosSansLettre([...new Set(lettres)].map(lettre), photos => lireMotEpele(mot, lettres, photos));
}

function lireMotEpele(mot, lettres, photos) {
  let vitesse = 1200;
  app.innerHTML = `
    <a class="retour" href="#/alphabet">← Alphabet</a>
    <h1>Lire un mot épelé</h1>
    <p class="consigne">Un mot est épelé lettre par lettre. Lequel ?</p>
    <div class="epeler">
      <div class="lettre-grande" id="lettre-courante"></div>
      <div class="pastilles">${lettres.map((_, i) => `<span data-i="${i}"></span>`).join("")}</div>
      <div class="hero-actions">
        <button class="btn btn-second" id="revoir">Revoir</button>
        <button class="btn btn-second" id="lent">Plus lent</button>
      </div>
      <form class="reponse-epeler" id="form-epeler">
        <input id="saisie" autocomplete="off" placeholder="Tapez le mot…" aria-label="Le mot épelé" required>
        <button class="btn" type="submit">Vérifier</button>
      </form>
      <p id="resultat-epeler"></p>
    </div>`;
  const zone = document.getElementById("lettre-courante");
  const jouer = () => {
    clearTimeout(minuteurEpeler);
    let i = 0;
    const etape = () => {
      app.querySelectorAll(".pastilles span").forEach(p => p.classList.toggle("actif", +p.dataset.i === i));
      if (i >= lettres.length) { zone.innerHTML = `<span class="fin-mot">?</span>`; return; }
      zone.innerHTML = `<img src="${echapper(photos[lettres[i]])}" alt="Lettre ${i + 1} sur ${lettres.length}" width="200" height="150">`;
      i++;
      minuteurEpeler = setTimeout(etape, vitesse);
    };
    etape();
  };
  document.getElementById("revoir").onclick = jouer;
  document.getElementById("lent").onclick = () => { vitesse = Math.min(2500, vitesse + 400); jouer(); };
  document.getElementById("form-epeler").onsubmit = ev => {
    ev.preventDefault();
    const ok = sansAccents(document.getElementById("saisie").value.trim()) === lettres.join("");
    document.getElementById("resultat-epeler").innerHTML = ok
      ? `<span class="msg-ok">Bravo, c'était « ${echapper(mot)} » !</span> <a class="btn" href="#/alphabet/epeler" onclick="setTimeout(route)">Mot suivant</a>`
      : `<span class="msg-ko">Ce n'est pas ça. Revoyez-le, ou </span><button class="btn btn-second" id="solution">voir la réponse</button>`;
    document.getElementById("solution")?.addEventListener("click", () => {
      document.getElementById("resultat-epeler").innerHTML = `C'était « <strong>${echapper(mot)}</strong> ». <a class="btn" href="#/alphabet/epeler" onclick="setTimeout(route)">Mot suivant</a>`;
    });
  };
  jouer();
}

// ---------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------
function pageProgression() {
  const p = Progression.lire();
  const vus = Object.keys(p.cartes).length;
  const appris = TOUS_LES_SIGNES.filter(e => Progression.estAppris(e.k)).length;
  const taux = p.quiz.total ? Math.round((p.quiz.bonnes / p.quiz.total) * 100) : 0;
  app.innerHTML = `
    <h1>Ma progression</h1>
    <div class="stats">
      <div class="stat"><span class="stat-val">${appris}/${TOUS_LES_SIGNES.length}</span><span>signes appris (${vus} vus)</span></div>
      <div class="stat"><span class="stat-val">${Progression.aReviser().length}</span><span>à réviser aujourd'hui</span></div>
      <div class="stat"><span class="stat-val">${taux} %</span><span>de bonnes réponses (${p.quiz.total} questions)</span></div>
      <div class="stat"><span class="stat-val">${Progression.serie()}</span><span>jour(s) d'affilée</span></div>
    </div>
    ${vus ? `<h2>Mémorisation</h2>${htmlBoites(Progression.parBoite())}` : ""}
    <h2>Par thème</h2>
    <div class="grille">${THEMES.map(carteTheme).join("")}</div>
    <h2>Réglages</h2>
    <label class="reglage">
      <input type="checkbox" id="opt-gaucher" ${Reglages.gaucher ? "checked" : ""}>
      <span class="interrupteur" aria-hidden="true"></span>
      <span><strong>Je signe de la main gauche</strong>
        <span class="petit">Les vidéos et les photos sont retournées comme dans un miroir : vous voyez les signes faits avec la main gauche.
        Les directions des descriptions (« vers votre droite ») sont inversées aussi.</span></span>
    </label>
    <fieldset class="reglage reglage-theme">
      <legend><strong>Apparence</strong></legend>
      <div class="choix-theme">
        ${[["clair", "Clair"], ["sombre", "Sombre doux"], ["auto", "Comme l'appareil"]].map(([v, nom]) => `
          <label><input type="radio" name="theme" value="${v}" ${Reglages.theme === v ? "checked" : ""}><span>${nom}</span></label>`).join("")}
      </div>
      <span class="petit">« Sombre doux » : un gris-vert reposant pour le soir, sans noir pur.</span>
    </fieldset>
    <h2 id="sauvegarde">Sauvegarde</h2>
    ${htmlSauvegarde()}
    <button class="btn btn-second" id="reset">Réinitialiser ma progression</button>`;
  document.getElementById("opt-gaucher").onchange = basculerGaucher;
  app.querySelectorAll('input[name="theme"]').forEach(r => (r.onchange = () => { Reglages.changer("theme", r.value); appliquerReglages(); }));
  brancherSauvegarde();
  if (location.hash.endsWith("/sauvegarde")) document.getElementById("sauvegarde").scrollIntoView();
  document.getElementById("reset").onclick = () => {
    if (confirm("Effacer toute votre progression ?")) { Progression.reinitialiser(); pageProgression(); }
  };
}

// ---------------------------------------------------------------------
// Sauvegarde de la progression (fichier ou code de transfert)
// ---------------------------------------------------------------------
const dateFr = iso => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function htmlSauvegarde() {
  const d = Sauvegarde.derniereDate();
  return `
    <div class="sauvegarde">
      <p>Votre progression est enregistrée <strong>dans ce navigateur uniquement</strong>. Si vous videz l'historique
        ou changez d'appareil, elle est perdue : gardez-en une sauvegarde.</p>
      <p class="petit ${Sauvegarde.conseillee() ? "a-faire" : ""}">Dernière sauvegarde : ${d ? `le ${dateFr(d)}` : "jamais"}.</p>
      <div class="hero-actions">
        <button class="btn" id="exporter">Télécharger une sauvegarde</button>
        <button class="btn btn-second" id="importer">Restaurer une sauvegarde</button>
        <input type="file" id="fichier-sauvegarde" accept=".json,application/json" hidden>
      </div>
      <details class="transfert">
        <summary>Passer sur un autre appareil avec un code</summary>
        <p class="petit">Copiez votre code, envoyez-le-vous (message, e-mail…), puis collez-le ici sur l'autre appareil.</p>
        <div class="hero-actions"><button class="btn btn-second" id="copier-code">Copier mon code</button></div>
        <textarea id="code-transfert" rows="3" placeholder="Collez ici un code qui commence par SEM1." spellcheck="false" aria-label="Code de transfert"></textarea>
        <div class="hero-actions"><button class="btn btn-second" id="utiliser-code">Utiliser ce code</button></div>
      </details>
      <div id="choix-restauration" aria-live="polite"></div>
    </div>`;
}

function brancherSauvegarde() {
  const zone = document.getElementById("choix-restauration");
  const message = (html, classe = "") => (zone.innerHTML = `<p class="message-sauvegarde ${classe}">${html}</p>`);

  document.getElementById("exporter").onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(Sauvegarde.creer(), null, 1)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: Sauvegarde.nomFichier() });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    Sauvegarde.noterExport();
    message(`Sauvegarde téléchargée : <strong>${echapper(Sauvegarde.nomFichier())}</strong> (dans vos Téléchargements). Gardez-la précieusement.`, "ok");
    document.querySelector(".sauvegarde .a-faire")?.classList.remove("a-faire");
  };

  // Une sauvegarde lue (fichier ou code) : on montre ce qu'elle contient, puis on demande quoi faire.
  const proposer = brute => {
    let s;
    try { s = Sauvegarde.verifier(brute); } catch (err) { return message(echapper(err.message), "ko"); }
    const r = Sauvegarde.resume(s.progression), actuel = Sauvegarde.resume(Progression.lire());
    const quoi = `${r.vus} signe(s) vu(s), dont ${r.appris} appris, ${r.jours} jour(s) d'activité`;
    const appliquer = mode => {
      Sauvegarde.restaurer(s, mode);
      appliquerReglages(); majCompteurs(); pageProgression();
      document.getElementById("choix-restauration").innerHTML =
        `<p class="message-sauvegarde ok">Progression restaurée${mode === "fusionner" ? " et fusionnée avec celle de cet appareil" : ""}.</p>`;
      document.getElementById("sauvegarde").scrollIntoView({ block: "start" });
    };
    if (!actuel.vus) return appliquer("remplacer"); // rien à perdre ici : on restaure directement
    zone.innerHTML = `
      <div class="carte-restauration">
        <p><strong>Sauvegarde${s.date ? ` du ${dateFr(s.date)}` : ""}</strong> : ${quoi}.<br>
        <span class="petit">Sur cet appareil : ${actuel.vus} signe(s) vu(s), dont ${actuel.appris} appris.</span></p>
        <div class="hero-actions">
          <button class="btn" data-mode="fusionner">Fusionner les deux</button>
          <button class="btn btn-second" data-mode="remplacer">Remplacer par la sauvegarde</button>
          <button class="btn btn-second" data-mode="">Annuler</button>
        </div>
        <p class="petit">« Fusionner » garde, pour chaque signe, la version la plus travaillée : rien n'est perdu.</p>
      </div>`;
    zone.querySelectorAll("[data-mode]").forEach(b => (b.onclick = () => (b.dataset.mode ? appliquer(b.dataset.mode) : (zone.innerHTML = ""))));
  };

  const fichier = document.getElementById("fichier-sauvegarde");
  document.getElementById("importer").onclick = () => fichier.click();
  fichier.onchange = async () => {
    const f = fichier.files[0];
    fichier.value = "";
    if (!f) return;
    try { proposer(JSON.parse(await f.text())); }
    catch { message("Ce fichier est illisible : choisissez le fichier <em>signes-en-main-sauvegarde-….json</em>.", "ko"); }
  };

  document.getElementById("copier-code").onclick = async ev => {
    const code = await Sauvegarde.versCode();
    const champ = document.getElementById("code-transfert");
    try { await navigator.clipboard.writeText(code); ev.target.textContent = "Code copié ✓"; }
    catch { champ.value = code; champ.select(); ev.target.textContent = "Code affiché ci-dessous : copiez-le"; }
    Sauvegarde.noterExport();
  };
  document.getElementById("utiliser-code").onclick = async () => {
    const code = document.getElementById("code-transfert").value.trim();
    if (!code) return message("Collez d'abord un code dans la case.", "ko");
    try { proposer(await Sauvegarde.depuisCode(code)); } catch (err) { message(echapper(err.message), "ko"); }
  };
}

function page404() {
  app.innerHTML = `<h1>Page introuvable</h1><a class="btn" href="#/">Retour à l'accueil</a>`;
}

// ---------------------------------------------------------------------
// Routeur
// ---------------------------------------------------------------------
let premiereVisite = true;
function route() {
  clearTimeout(minuteurEpeler);
  quitterPage(); // arrête l'exercice en cours (minuteurs, clavier) : voir exercices.js
  const [, page, p1, p2] = (location.hash || "#/").slice(1).split("/");
  const rubrique = { theme: "lecons", signe: "lecons", mot: "dictionnaire", quiz: "reviser" }[page] || page || "";
  document.querySelectorAll(".topbar nav a").forEach(a => {
    const ici = a.getAttribute("href") === "#/" + rubrique;
    a.classList.toggle("actif", ici);
    if (ici) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  majCompteurs();
  afficherPage(page, p1, p2);
  annoncerPage(!premiereVisite);
  premiereVisite = false;
}

/**
 * Après chaque changement de page : titre de l'onglet, et (sauf au premier chargement)
 * focus sur le titre de la page, pour que les lecteurs d'écran et la navigation au
 * clavier repartent du début du nouveau contenu.
 */
function annoncerPage(deplacerFocus) {
  const h1 = app.querySelector("h1"), sur = app.querySelector(".surtitre");
  const nom = (h1 && !h1.closest(".hero") ? h1.textContent : "") || (app.querySelector(".quiz-tete") && sur ? sur.textContent : "");
  document.title = nom.trim() ? `${nom.trim()} · Signes en main` : "Signes en main";
  if (!deplacerFocus) return;
  const cible = h1 || app;
  cible.setAttribute("tabindex", "-1");
  cible.focus({ preventScroll: true });
}

function afficherPage(page, p1, p2) {
  switch (page) {
    case "": case undefined: return pageAccueil();
    case "lecons": return pageLecons();
    case "theme": return pageTheme(p1);
    case "signe": return pageSigne(p1, p2);
    case "quiz": return pageQuiz(p1);
    case "reviser": return pageReviser();
    case "alphabet": return pageAlphabet(p1);
    case "progression": return pageProgression();
    case "compte": return pageCompte(p1);
    case "connexion": return pageConnexion(p1);
    case "amis": return pageAmis();
    case "dictionnaire": return pageDictionnaire(p1);
    case "mot": return pageMot(p1);
    case "entrainement": return pageEntrainement(p1, p2);
    case "comprendre": return pageComprendre(p1);
    case "credits": return pageCredits();
    default: return page404();
  }
}

// Le studio 3D (expérimental) n'existe que sur l'ordinateur où le site est développé, pas en ligne
if (["127.0.0.1", "localhost", ""].includes(location.hostname)) document.getElementById("lien-studio")?.removeAttribute("hidden");

window.addEventListener("hashchange", route);
route();

// Compte en ligne : au chargement, on récupère la progression du compte (autre appareil) ;
// quand on quitte la page, on envoie ce qui n'est pas encore parti.
if (EnLigne.connecte()) {
  EnLigne.synchroniser().then(() => {
    majCompteurs();
    const page = (location.hash || "#/").split("/")[1] || "";
    if (["", "compte", "amis", "progression", "lecons"].includes(page)) route();
  }).catch(() => {});
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && EnLigne.minuteur) EnLigne.envoyer(true).catch(() => {});
});
