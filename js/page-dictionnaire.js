// Page "Dictionnaire" : recherche par mot ou par catégorie, avec de vraies vidéos LSF
// (licences libres, Wikimedia Commons). Les données viennent de js/dictionnaire.js.

const Dico = {
  entrees: [],
  categories: [],
  cle: s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(),

  init() {
    this.entrees = (window.DICTIONNAIRE || []).map(e => ({ ...e, k: this.cle(e.mot) }));
    const compte = {};
    this.entrees.forEach(e => (compte[e.categorie] = (compte[e.categorie] || 0) + 1));
    this.categories = Object.keys(compte).sort((a, b) => a.localeCompare(b, "fr")).map(nom => ({ nom, n: compte[nom] }));
  },

  /** Recherche : le texte peut correspondre au mot OU au nom de la catégorie. */
  chercher(texte, categorie) {
    const q = this.cle(texte || "");
    let res = this.entrees;
    if (categorie) res = res.filter(e => e.categorie === categorie);
    if (q) {
      res = res
        .map(e => {
          let score = -1;
          if (e.k === q) score = 0;
          else if (e.k.startsWith(q)) score = 1;
          else if (e.k.split(/[\s,'()-]+/).some(m => m.startsWith(q))) score = 2;
          else if (e.k.includes(q)) score = 3;
          else if (this.cle(e.categorie).includes(q)) score = 4;
          return { e, score };
        })
        .filter(x => x.score >= 0)
        .sort((a, b) => a.score - b.score || a.e.k.localeCompare(b.e.k, "fr"))
        .map(x => x.e);
    }
    return res;
  },

  trouver(mot) {
    const k = this.cle(mot), k2 = k.replace(/[?!.]/g, "").trim();
    return this.entrees.find(e => e.k === k) || this.entrees.find(e => e.k === k2);
  }
};
Dico.init();

const PAR_PAGE = 60;

function pageDictionnaire(param) {
  const params = new URLSearchParams(param || "");
  const etat = { q: params.get("q") || "", cat: params.get("cat") || "", max: PAR_PAGE };
  const nbVideos = Dico.entrees.reduce((s, e) => s + e.videos.length, 0);

  app.innerHTML = `
    <div class="dico-entete">
      <div>
        <h1>Dictionnaire</h1>
        <p class="petit">${Dico.entrees.length} mots · ${nbVideos} vidéos de signeurs, sous licence libre</p>
      </div>
    </div>
    <div class="recherche">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="champ-recherche" type="search" aria-label="Chercher un mot ou une catégorie" placeholder="Chercher un mot ou une catégorie (ex. : bonjour, animaux…)" value="${echapper(etat.q)}" autocomplete="off">
    </div>
    <div class="puces" id="puces">
      <button class="puce" data-cat="">Toutes</button>
      ${Dico.categories.map(c => `<button class="puce" data-cat="${echapper(c.nom)}">${echapper(c.nom)} <span>${c.n}</span></button>`).join("")}
    </div>
    <p class="petit" id="nb-resultats"></p>
    <div class="dico-grille" id="resultats"></div>
    <div id="plus"></div>
    <p class="credits">
      Vidéos issues de <a href="https://commons.wikimedia.org/wiki/Category:Videos_of_French_Sign_Language" target="_blank" rel="noopener">Wikimedia Commons</a>
      (projets <a href="https://lingualibre.org" target="_blank" rel="noopener">Lingua Libre</a>, Elix, vidéos de Laura Jauvert…),
      sous licences CC BY, CC BY-SA ou CC0. L'auteur et la licence sont indiqués sur chaque vidéo.
    </p>`;

  const champ = document.getElementById("champ-recherche");
  const afficher = () => {
    const res = Dico.chercher(etat.q, etat.cat);
    document.querySelectorAll(".puce").forEach(p => p.classList.toggle("actif", p.dataset.cat === etat.cat));
    document.getElementById("nb-resultats").textContent =
      res.length ? `${res.length} résultat${res.length > 1 ? "s" : ""}` : "Aucun résultat. Essayez un autre mot ou une autre orthographe.";
    document.getElementById("resultats").innerHTML = res.slice(0, etat.max).map(e => `
      <a class="dico-carte" href="#/mot/${encodeURIComponent(e.k)}">
        <span class="dico-mot">${echapper(e.mot)}</span>
        <span class="dico-cat">${echapper(e.categorie)}</span>
        ${e.videos.length > 1 ? `<span class="dico-nb">${e.videos.length} vidéos</span>` : ""}
      </a>`).join("");
    document.getElementById("plus").innerHTML = res.length > etat.max
      ? `<button class="btn btn-second" id="voir-plus">Afficher plus (${res.length - etat.max} restants)</button>` : "";
    const bouton = document.getElementById("voir-plus");
    if (bouton) bouton.onclick = () => { etat.max += PAR_PAGE; afficher(); };
    // garde la recherche dans l'adresse (retour arrière, partage) sans recharger la page
    const p = new URLSearchParams();
    if (etat.q) p.set("q", etat.q);
    if (etat.cat) p.set("cat", etat.cat);
    history.replaceState(null, "", "#/dictionnaire" + (p.toString() ? "/" + p.toString() : ""));
  };

  champ.oninput = () => { etat.q = champ.value; etat.max = PAR_PAGE; afficher(); };
  document.getElementById("puces").onclick = ev => {
    const b = ev.target.closest(".puce");
    if (!b) return;
    etat.cat = b.dataset.cat;
    etat.max = PAR_PAGE;
    afficher();
  };
  afficher();
  if (!etat.q) champ.focus({ preventScroll: true });
}

/**
 * « Pour aller plus loin » : liens vers les grands dictionnaires LSF en ligne.
 * Leurs vidéos ne sont pas sous licence libre (on ne peut pas les copier dans le site),
 * mais on peut y renvoyer : définitions, variantes régionales, exemples en phrase.
 */
function liensExternes(mot) {
  const m = mot.replace(/\s*\(.*?\)\s*/g, " ").replace(/[?!…]/g, "").trim().toLowerCase();
  const q = encodeURIComponent(m);
  return `
    <div class="plus-loin">
      <strong>Pour aller plus loin</strong>
      <p class="petit">D'autres signeurs, des variantes et des définitions sur les dictionnaires LSF en ligne :</p>
      <div class="liens-plus">
        <a href="https://dico.elix-lsf.fr/dictionnaire/${q}" target="_blank" rel="noopener">Elix ↗<span>définitions et signes</span></a>
        <a href="https://www.spreadthesign.com/fr.fr/search/?q=${q}" target="_blank" rel="noopener">Spread The Sign ↗<span>dictionnaire international</span></a>
      </div>
    </div>`;
}

/**
 * « Comment faire le signe » : description générée automatiquement en analysant la vidéo
 * (js/descriptions.js, produit par outils/descriptions.html). Elle peut contenir des erreurs,
 * d'où l'étiquette « à vérifier » : la vidéo fait toujours foi.
 */
function htmlDescription(e) {
  const d = (window.DESCRIPTIONS || {})[e.k];
  if (!d || d.erreur) return "";
  const maj = s => s.charAt(0).toUpperCase() + s.slice(1);
  const lignes = [];
  let mains = d.mains === "deux mains" ? "Les deux mains" : "Une seule main";
  if (d.deuxMains) mains += ` — ${d.deuxMains}`;
  lignes.push(["Mains", mains + "."]);
  const fiable = d.taillePx >= 45 && d.formeSure >= 0.6;
  let forme = fiable ? maj(d.forme) : "Difficile à voir sur cette vidéo : regardez-la au ralenti.";
  if (fiable && d.mains === "deux mains" && d.formeAutre && d.formeAutre !== d.forme) forme += ` (autre main : ${d.formeAutre})`;
  lignes.push(["Forme de la main", forme + (fiable ? "." : "")]);
  if (d.emplacement) {
    const tenu = /immobile/.test(d.mouvement);
    lignes.push(["Emplacement", d.emplacementFin && d.emplacementFin !== d.emplacement && !tenu
      ? `Commence ${d.emplacement}, finit ${d.emplacementFin}.` : maj(d.emplacement) + "."]);
  }
  const mouvement = /immobile/.test(d.mouvement) ? "La main se déplace peu : regardez surtout la forme et l'orientation des doigts."
    : d.mouvement === "petit mouvement" ? "Petit mouvement, peu marqué." : maj(d.mouvement) + ".";
  lignes.push(["Mouvement", mouvement]);
  lignes.push(["Visage", d.visage && d.visage.length ? maj(d.visage.join(", ")) + "." : "Pas d'expression particulière repérée."]);
  const video = e.videos.find(v => v.url === d.video);
  return `
    <div class="description-auto">
      <div class="description-tete">
        <strong>Comment faire le signe</strong>
        <span class="etiquette-auto" title="Description produite par un ordinateur qui a analysé la vidéo">Automatique · à vérifier</span>
      </div>
      <dl>${lignes.map(([t, v]) => `<dt>${t}</dt><dd>${directions(echapper(v))}</dd>`).join("")}</dl>
      <p class="petit">Analyse automatique de la première vidéo${video ? ` (${echapper(video.auteur.split(/Video editing|:|,/)[0].trim())})` : ""}. Elle peut se tromper :
      en cas de doute, fiez-vous à la vidéo.
      <span class="si-droitier">Les directions sont celles de la personne qui signe : ce sont les vôtres quand vous l'imitez.</span>
      <span class="si-gaucher">Mode gaucher : la vidéo est retournée comme dans un miroir et les directions sont inversées, pour signer de la main gauche.</span></p>
    </div>`;
}

/**
 * « vers sa droite » -> « vers votre droite », écrit de façon à s'inverser tout seul en
 * mode gaucher (la feuille de style choisit le mot : voir .dir dans style.css).
 */
const directions = html => html.replace(/\bsa (droite|gauche)\b/g, 'votre <span class="dir" data-d="$1"></span>');

/** Bouton « Gaucher » : retourne vidéos et photos comme dans un miroir (voir basculerGaucher). */
const boutonGaucher = (classe = "") => `
  <button class="btn-gaucher ${classe}" aria-pressed="${Reglages.gaucher}"
    title="Retourner les vidéos comme dans un miroir, pour signer de la main gauche">Mode gaucher</button>`;

/**
 * Sources d'une vidéo Wikimedia : l'original (WebM), puis la version MP4 que Wikimedia
 * fabrique automatiquement, pour les iPhone et iPad qui lisent mal le WebM.
 * Le navigateur prend la première qu'il sait lire ; si aucune ne marche, voir videoEnPanne().
 */
function sourcesVideo(url) {
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(\w\/\w\w\/([^/?#]+))$/);
  const mp4 = m ? `${m[1]}/transcoded/${m[2]}/${m[3]}.360p.mpeg4.mov` : "";
  return `<source src="${echapper(url)}" type="video/webm">${mp4 ? `<source src="${echapper(mp4)}" type="video/mp4">` : ""}`;
}

/** Lecteur vidéo réutilisable (vraie vidéo LSF + crédits). label : ce que lit un lecteur d'écran. */
function htmlVideo(v, { autoplay = true, label = "Vidéo du signe" } = {}) {
  // En mode gaucher, l'image est retournée : les commandes du navigateur le seraient aussi
  // (barre de temps à l'envers), on les remplace donc par les nôtres (.video-lecture).
  const gaucher = Reglages.gaucher;
  return `
    <div class="video-lsf">
      <video ${autoplay ? "autoplay" : ""} muted loop playsinline ${gaucher ? "" : "controls"} preload="metadata"
        aria-label="${echapper(label)}" data-page="${echapper(v.page)}">${sourcesVideo(v.url)}</video>
      <div class="video-barre">
        <div class="video-lecture">
          <button class="lire" aria-label="Pause">❚❚</button>
          <input type="range" min="0" max="1000" value="0" step="1" aria-label="Position dans la vidéo">
        </div>
        <div class="vitesses video-vitesses">
          <button data-v="0.5">0,5×</button><button data-v="0.75">0,75×</button><button data-v="1" class="actif">1×</button>
        </div>
        ${boutonGaucher()}
        <span class="video-credit">
          ${echapper(v.auteur)} · ${echapper(v.source)} ·
          <a href="${echapper(v.page)}" target="_blank" rel="noopener">${echapper(v.licence || "licence")}</a>
        </span>
      </div>
    </div>`;
}

function brancherVitesses(zone) {
  const video = zone.querySelector("video");
  zone.querySelectorAll(".video-vitesses button").forEach(b => (b.onclick = () => {
    video.playbackRate = parseFloat(b.dataset.v);
    zone.querySelectorAll(".video-vitesses button").forEach(x => x.classList.toggle("actif", x === b));
  }));
  // Commandes maison (mode gaucher) : lecture/pause et barre de temps
  const lire = zone.querySelector(".video-lecture .lire"), barre = zone.querySelector(".video-lecture input");
  if (!lire) return;
  const majBouton = () => {
    lire.textContent = video.paused ? "▶" : "❚❚";
    lire.setAttribute("aria-label", video.paused ? "Lire" : "Pause");
  };
  const basculer = () => (video.paused ? video.play().catch(() => {}) : video.pause());
  lire.onclick = basculer;
  video.addEventListener("click", () => { if (!video.controls) basculer(); });
  video.addEventListener("play", majBouton);
  video.addEventListener("pause", majBouton);
  video.addEventListener("timeupdate", () => {
    if (video.duration && document.activeElement !== barre) barre.value = Math.round((1000 * video.currentTime) / video.duration);
  });
  barre.oninput = () => { if (video.duration) video.currentTime = (barre.value / 1000) * video.duration; };
}

function pageMot(k) {
  const e = Dico.entrees.find(x => x.k === decodeURIComponent(k || ""));
  if (!e) return page404();
  const memeCat = Dico.entrees.filter(x => x.categorie === e.categorie && x !== e);
  const i = Dico.entrees.indexOf(e);

  app.innerHTML = `
    <a class="retour" href="#/dictionnaire" onclick="history.length > 1 && (event.preventDefault(), history.back())">← Dictionnaire</a>
    <div class="fiche">
      <div>
        <div id="zone-video"></div>
        ${e.videos.length > 1 ? `
          <div class="signeurs">
            <span class="petit">Autres signeurs :</span>
            ${e.videos.map((v, n) => `<button class="puce ${n === 0 ? "actif" : ""}" data-n="${n}">${echapper(v.auteur.split(/Video editing|:|,/)[0].trim() || "Version " + (n + 1))}</button>`).join("")}
          </div>` : ""}
      </div>
      <div class="fiche-info">
        <a class="surtitre" href="#/dictionnaire/cat=${encodeURIComponent(e.categorie)}">${echapper(e.categorie)}</a>
        <h1>${echapper(e.mot)}</h1>
        <p class="hero-sous">Regardez le signe plusieurs fois, au ralenti si besoin, puis reproduisez-le face à un miroir.
        Observez la forme de la main, son mouvement, son emplacement et l'expression du visage.</p>
        ${htmlDescription(e)}
        ${liensExternes(e.mot)}
        <div class="nav-signes">
          ${i > 0 ? `<a href="#/mot/${encodeURIComponent(Dico.entrees[i - 1].k)}">← ${echapper(Dico.entrees[i - 1].mot)}</a>` : "<span></span>"}
          ${i < Dico.entrees.length - 1 ? `<a href="#/mot/${encodeURIComponent(Dico.entrees[i + 1].k)}">${echapper(Dico.entrees[i + 1].mot)} →</a>` : "<span></span>"}
        </div>
      </div>
    </div>
    ${memeCat.length ? `
      <h2>Dans la même catégorie</h2>
      <div class="dico-grille">
        ${memeCat.slice(0, 12).map(x => `<a class="dico-carte" href="#/mot/${encodeURIComponent(x.k)}"><span class="dico-mot">${echapper(x.mot)}</span></a>`).join("")}
      </div>` : ""}`;

  const zone = document.getElementById("zone-video");
  const montrer = n => { zone.innerHTML = htmlVideo(e.videos[n], { label: `Vidéo du signe « ${e.mot} »` }); brancherVitesses(zone); };
  montrer(0);
  app.querySelectorAll(".signeurs .puce").forEach(b => (b.onclick = () => {
    app.querySelectorAll(".signeurs .puce").forEach(x => x.classList.toggle("actif", x === b));
    montrer(+b.dataset.n);
  }));
}
