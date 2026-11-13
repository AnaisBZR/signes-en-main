// Pages du profil (« Mon compte ») :
//  #/compte             mes chiffres (série, moyennes, calendrier d'activité…)
//  #/compte/nouveau     créer un profil (prénom + personnage)
//  #/compte/personnage  modifier mon prénom et mon personnage
//  #/compte/profils     changer de profil, en ajouter, en supprimer
// Les profils restent dans ce navigateur (voir Profils, js/progress.js).

function pageCompte(mode) {
  if (mode === "nouveau") return editeurProfil(null);
  const profil = Profils.actif();
  if (!profil) return editeurProfil(null);
  if (mode === "personnage") return editeurProfil(profil);
  if (mode === "profils") return pageProfils();
  return pageMesChiffres(profil);
}

/** Après un changement de profil : réglages (thème, gaucher) et compteurs du nouveau profil. */
function profilChange() {
  appliquerReglages();
  majCompteurs();
}

// ---------------------------------------------------------------------
// Éditeur : créer un profil ou modifier le sien
// ---------------------------------------------------------------------
function editeurProfil(profil) {
  const creation = !profil;
  const premier = !Profils.lire().liste.length;
  let avatar = creation ? Avatar.auHasard() : { ...profil.avatar };
  const FORMES = ["coiffure", "lunettes", "barbe", "haut"]; // choix montrés en petits personnages

  app.innerHTML = `
    <a class="retour" href="${creation ? (premier ? "#/" : "#/compte/profils") : "#/compte"}">← ${creation ? (premier ? "Accueil" : "Profils") : "Mon profil"}</a>
    <h1>${creation ? (premier ? "Créer mon profil" : "Nouveau profil") : "Mon personnage"}</h1>
    ${creation && premier && Object.keys(Progression.lire().cartes).length
      ? `<p class="hero-sous">Votre progression actuelle sera rattachée à ce profil.</p>` : ""}
    <form class="editeur-profil" id="form-profil" autocomplete="off">
      <div class="apercu-avatar">
        <div id="apercu"></div>
        <button type="button" class="btn btn-second" id="hasard">Au hasard</button>
      </div>
      <div class="editeur-options">
        <label class="champ-nom">
          <span>Prénom ou pseudo</span>
          <input id="nom-profil" maxlength="${Profils.NOM_MAX}" required value="${creation ? "" : echapper(profil.nom)}" placeholder="Ex. : Camille">
          <span class="petit">Votre prénom et votre personnage restent dans ce navigateur : rien n'est envoyé sur Internet.</span>
        </label>
        ${Object.keys(Avatar.ETIQUETTES).map(trait => `
          <fieldset class="trait" data-trait="${trait}">
            <legend>${Avatar.ETIQUETTES[trait]}</legend>
            <div class="trait-choix ${FORMES.includes(trait) ? "formes" : "couleurs"}" id="choix-${trait}"></div>
          </fieldset>`).join("")}
        <div class="hero-actions">
          <button class="btn" type="submit">${creation ? "Créer mon profil" : "Enregistrer"}</button>
          <a class="btn btn-second" href="${creation ? (premier ? "#/" : "#/compte/profils") : "#/compte"}">Annuler</a>
        </div>
        <p id="erreur-profil" class="msg-ko" role="alert"></p>
      </div>
    </form>`;

  const dessiner = () => {
    document.getElementById("apercu").innerHTML = Avatar.svg(avatar, 160, "Aperçu de votre personnage");
    for (const trait of Object.keys(Avatar.ETIQUETTES)) {
      const zone = document.getElementById("choix-" + trait);
      zone.innerHTML = Avatar.CHOIX[trait].map(([valeur, nom], i) => `
        <label title="${echapper(nom)}">
          <input type="radio" name="${trait}" value="${i}" ${avatar[trait] === i ? "checked" : ""}>
          <span>${FORMES.includes(trait)
            ? Avatar.svg({ ...avatar, [trait]: i }, 52)
            : `<i style="background:${valeur}"></i>`}<b class="visuellement-cache">${echapper(nom)}</b></span>
        </label>`).join("");
    }
  };
  dessiner();

  const form = document.getElementById("form-profil");
  form.addEventListener("change", ev => {
    const t = ev.target;
    if (t.type !== "radio") return;
    avatar[t.name] = +t.value;
    dessiner();
    form.querySelector(`input[name="${t.name}"][value="${t.value}"]`).focus();
  });
  document.getElementById("hasard").onclick = () => { avatar = Avatar.auHasard(); dessiner(); };
  form.onsubmit = ev => {
    ev.preventDefault();
    const nom = document.getElementById("nom-profil").value;
    const erreur = document.getElementById("erreur-profil");
    if (!Profils.nettoyerNom(nom)) { erreur.textContent = "Indiquez un prénom ou un pseudo."; return; }
    if (creation) {
      if (!Profils.creer(nom, avatar)) { erreur.textContent = `Pas plus de ${Profils.MAX} profils sur un même appareil.`; return; }
    } else {
      Profils.modifier(profil.id, { nom, avatar });
    }
    profilChange();
    location.hash = "#/compte";
  };
  if (creation) document.getElementById("nom-profil").focus();
}

// ---------------------------------------------------------------------
// Liste des profils de l'appareil
// ---------------------------------------------------------------------
function pageProfils() {
  const { liste, actif } = Profils.lire();
  app.innerHTML = `
    <a class="retour" href="#/compte">← Mon profil</a>
    <h1>Profils</h1>
    <p class="hero-sous">Plusieurs personnes peuvent apprendre sur cet appareil : chaque profil a sa propre progression, ses records et ses réglages.</p>
    <div class="liste-profils">
      ${liste.map(p => `
        <div class="carte-profil ${p.id === actif ? "actif" : ""}">
          ${Avatar.svg(p.avatar, 64)}
          <div><strong>${echapper(p.nom)}</strong><span class="petit">${p.id === actif ? "Profil en cours" : "Depuis le " + jourFr(p.cree)}</span></div>
          ${p.id === actif ? "" : `<button class="btn btn-second" data-choisir="${p.id}">Utiliser</button>`}
        </div>`).join("")}
    </div>
    <div class="hero-actions">
      ${liste.length < Profils.MAX ? `<a class="btn" href="#/compte/nouveau">Ajouter un profil</a>` : ""}
    </div>
    <h2>Supprimer mon profil</h2>
    <p class="petit">Efface ce profil et toute sa progression sur cet appareil. Pensez à télécharger une sauvegarde avant (page Progression).</p>
    <button class="btn btn-second" id="supprimer-profil">Supprimer « ${echapper(Profils.actif().nom)} »</button>`;
  app.querySelectorAll("[data-choisir]").forEach(b => (b.onclick = () => {
    Profils.choisir(b.dataset.choisir);
    profilChange();
    location.hash = "#/compte";
  }));
  document.getElementById("supprimer-profil").onclick = () => {
    const p = Profils.actif();
    if (!confirm(`Supprimer le profil « ${p.nom} » et toute sa progression ? C'est définitif.`)) return;
    Profils.supprimer(p.id);
    profilChange();
    location.hash = Profils.actif() ? "#/compte/profils" : "#/";
  };
}

// ---------------------------------------------------------------------
// Mes chiffres
// ---------------------------------------------------------------------
/** Tous les chiffres du profil actif, calculés depuis la progression (testable sans page). */
function chiffresProfil() {
  const p = Progression.lire();
  const cartes = Object.values(p.cartes);
  const joursTravailles = new Set(p.jours).size;
  const appris = TOUS_LES_SIGNES.filter(e => Progression.estAppris(e.k)).length;
  const journal = Object.entries(p.journal || {});
  const meilleurJour = journal.reduce((m, [j, e]) => (e.q > (m?.q ?? 0) ? { jour: j, q: e.q } : m), null);
  const moyenne = n => (joursTravailles ? Math.round((n / joursTravailles) * 10) / 10 : 0);
  return {
    serie: Progression.serie(),
    meilleureSerie: Progression.meilleureSerie(),
    joursTravailles,
    appris,
    total: TOUS_LES_SIGNES.length,
    vus: cartes.length,
    maitrises: cartes.filter(c => c.boite >= 5).length,
    questions: p.quiz.total,
    reussite: p.quiz.total ? Math.round((100 * p.quiz.bonnes) / p.quiz.total) : null,
    apprisParJour: moyenne(appris),
    questionsParJour: moyenne(p.quiz.total),
    meilleurJour,
    lecons: Object.keys(Records.lire().lecons).length,
    totalLecons: (window.MINI_LECONS || []).length,
    defis: Records.nbDefis(),
    aReviser: Progression.aReviser().length
  };
}

const nombreFr = n => String(n).replace(".", ",");
/** Date d'un jour « AAAA-MM-JJ » en toutes lettres (lue à midi, heure locale : pas de décalage d'un jour). */
const jourFr = j => new Date(j + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function pageMesChiffres(profil) {
  const c = chiffresProfil();
  const tuile = (val, texte, detail = "") =>
    `<div class="stat"><span class="stat-val">${val}</span><span>${texte}</span>${detail ? `<span class="petit">${detail}</span>` : ""}</div>`;
  app.innerHTML = `
    <section class="entete-profil">
      ${Avatar.svg(profil.avatar, 104)}
      <div>
        <h1>${echapper(profil.nom)}</h1>
        <p class="petit">Profil créé le ${jourFr(profil.cree)} · enregistré sur cet appareil</p>
        <div class="hero-actions">
          <a class="btn btn-second" href="#/compte/personnage">Modifier mon personnage</a>
          <a class="btn btn-second" href="#/compte/profils">Changer de profil</a>
        </div>
      </div>
    </section>

    <h2>Régularité</h2>
    <div class="stats">
      ${tuile(c.serie, `jour${c.serie > 1 ? "s" : ""} d'affilée`, c.serie ? "Revenez demain pour continuer la série" : "Faites un exercice aujourd'hui pour lancer une série")}
      ${tuile(c.meilleureSerie, "jours d'affilée au maximum", "Votre meilleure série")}
      ${tuile(c.joursTravailles, `jour${c.joursTravailles > 1 ? "s" : ""} de travail au total`)}
    </div>

    <h2>Vocabulaire</h2>
    <div class="stats">
      ${tuile(`${c.appris}<small>/${c.total}</small>`, "signes appris", `${c.vus} signe${c.vus > 1 ? "s" : ""} déjà vus`)}
      ${tuile(nombreFr(c.apprisParJour), "signes appris par jour de travail", "En moyenne")}
      ${tuile(c.maitrises, `signe${c.maitrises > 1 ? "s" : ""} maîtrisé${c.maitrises > 1 ? "s" : ""}`, "Réussis assez souvent pour ne revenir que tous les 30 jours")}
      ${tuile(c.aReviser, "à réviser aujourd'hui", c.aReviser ? `<a href="#/reviser">Réviser maintenant</a>` : "Rien en retard")}
    </div>

    <h2>Exercices</h2>
    <div class="stats">
      ${tuile(c.questions, `question${c.questions > 1 ? "s" : ""} répondue${c.questions > 1 ? "s" : ""}`, c.reussite === null ? "" : `${c.reussite} % de bonnes réponses`)}
      ${tuile(nombreFr(c.questionsParJour), "questions par jour de travail", "En moyenne")}
      ${tuile(c.meilleurJour ? c.meilleurJour.q : "–", "questions sur votre meilleur jour", c.meilleurJour ? `le ${jourFr(c.meilleurJour.jour)}` : "Compté à partir d'aujourd'hui")}
      ${tuile(`${c.lecons}<small>/${c.totalLecons}</small>`, "mini-leçons « Comprendre » lues", `${c.defis} défi${c.defis > 1 ? "s" : ""} du jour réussi${c.defis > 1 ? "s" : ""}`)}
    </div>

    <h2>Mon activité</h2>
    ${htmlCalendrier()}`;
  brancherCalendrier();
}

// ---------------------------------------------------------------------
// Calendrier d'activité (les 17 dernières semaines) : une case par jour,
// d'autant plus foncée qu'on a travaillé ce jour-là.
// ---------------------------------------------------------------------
const SEMAINES_CALENDRIER = 17;

/** Niveau 0 à 4 d'un jour. Jour actif sans détail (avant le journal) : niveau 2. */
function niveauJour(e, actif) {
  if (!e) return actif ? 2 : 0;
  const score = e.q + e.n + 5 * e.x + 2 * e.a;
  if (!score) return actif ? 1 : 0;
  return score < 10 ? 1 : score < 25 ? 2 : score < 50 ? 3 : 4;
}

function texteJour(jour, e, actif) {
  const date = new Date(jour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  if (!actif && !e) return `${date} : pas d'activité`;
  if (!e) return `${date} : jour de travail`;
  const morceaux = [];
  if (e.q) morceaux.push(`${e.q} question${e.q > 1 ? "s" : ""}`);
  if (e.n) morceaux.push(`${e.n} nouveau${e.n > 1 ? "x" : ""} signe${e.n > 1 ? "s" : ""}`);
  if (e.a) morceaux.push(`${e.a} signe${e.a > 1 ? "s" : ""} appris`);
  if (e.x) morceaux.push(`${e.x} exercice${e.x > 1 ? "s" : ""} d'épellation ou de phrases`);
  return `${date} : ${morceaux.join(", ") || "jour de travail"}`;
}

function htmlCalendrier() {
  const p = Progression.lire(), actifs = new Set(p.jours);
  // on commence un lundi, pour que chaque colonne soit une semaine
  const auj = new Date(); auj.setHours(12, 0, 0, 0);
  const lundi = (auj.getDay() + 6) % 7; // 0 = lundi
  const debut = new Date(auj); debut.setDate(auj.getDate() - lundi - 7 * (SEMAINES_CALENDRIER - 1));
  const cases = [], mois = [];
  let nbActifs = 0, moisPrec = -1;
  for (let i = 0; i < SEMAINES_CALENDRIER * 7; i++) {
    const d = new Date(debut); d.setDate(debut.getDate() + i);
    const jour = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (i % 7 === 0) {
      mois.push(d.getMonth() !== moisPrec ? d.toLocaleDateString("fr-FR", { month: "short" }) : "");
      moisPrec = d.getMonth();
    }
    if (d > auj) { cases.push(`<span class="jour futur"></span>`); continue; }
    const e = p.journal?.[jour], actif = actifs.has(jour);
    if (actif) nbActifs++;
    cases.push(`<span class="jour n${niveauJour(e, actif)}" data-info="${echapper(texteJour(jour, e, actif))}"></span>`);
  }
  return `
    <div class="calendrier">
      <div class="cal-mois" aria-hidden="true">${mois.map(m => `<span>${m}</span>`).join("")}</div>
      <div class="cal-corps">
        <div class="cal-jours" aria-hidden="true"><span>lun.</span><span></span><span>mer.</span><span></span><span>ven.</span><span></span><span></span></div>
        <div class="cal-grille" role="img" aria-label="${nbActifs} jour${nbActifs > 1 ? "s" : ""} de travail sur les ${SEMAINES_CALENDRIER} dernières semaines">${cases.join("")}</div>
      </div>
      <div class="cal-pied">
        <p class="petit" id="cal-info" aria-live="polite">${nbActifs} jour${nbActifs > 1 ? "s" : ""} de travail sur les ${SEMAINES_CALENDRIER} dernières semaines. Survolez une case pour le détail.</p>
        <span class="cal-legende petit" aria-hidden="true">Moins <span class="jour n0"></span><span class="jour n1"></span><span class="jour n2"></span><span class="jour n3"></span><span class="jour n4"></span> Plus</span>
      </div>
    </div>`;
}

function brancherCalendrier() {
  const info = document.getElementById("cal-info"), grille = app.querySelector(".cal-grille");
  if (!grille) return;
  const defaut = info.textContent;
  const montrer = ev => {
    const c = ev.target.closest(".jour[data-info]");
    app.querySelectorAll(".jour.survol").forEach(x => x.classList.remove("survol"));
    if (c) { c.classList.add("survol"); info.textContent = c.dataset.info; }
  };
  grille.addEventListener("pointerover", montrer);
  grille.addEventListener("click", montrer);
  grille.addEventListener("pointerleave", () => {
    app.querySelectorAll(".jour.survol").forEach(x => x.classList.remove("survol"));
    info.textContent = defaut;
  });
}
