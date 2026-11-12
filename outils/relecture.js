// Outil de relecture des descriptions automatiques (outils/relecture.html).
//
// Pour chaque signe décrit : la vidéo, l'analyse automatique, et des champs pour corriger.
// La relecture est enregistrée dans data/relecture-descriptions.json :
//   { "bonjour": { "statut": "verifiee" | "corrigee" | "fausse", "date": "2026-11-12",
//                  "champs": { "forme": "…" } } }   (champs : seulement ce qui diffère de l'analyse)
// puis scripts/construire_descriptions.py l'applique à js/descriptions.js.
// Avec « Ouvrir le site.bat » (scripts/serveur.py), tout est enregistré et reconstruit
// automatiquement ; sinon, un bouton permet de télécharger le fichier.

const BROUILLON = "lsf-relecture-brouillon";
const VALEURS = {
  mains: ["une main", "deux mains"],
  deuxMains: ["l'autre main reste immobile, elle sert de base", "les deux mains bougent en miroir",
    "les deux mains bougent ensemble, dans le même sens", "les deux mains bougent"],
  forme: ["main plate, doigts serrés", "main ouverte, doigts écartés", "main ouverte, doigts un peu écartés",
    "main ouverte, un doigt replié", "main arrondie (forme « C »)", "main en « O » (pouce et index qui se touchent)",
    "poing fermé", "poing fermé, pouce sorti", "index tendu, autres doigts repliés", "index et majeur tendus, serrés",
    "index et majeur tendus et écartés (forme « V »)", "trois doigts tendus (index, majeur, annulaire)",
    "pouce et index tendus (forme « L »)", "pouce et auriculaire tendus (forme « Y »)", "auriculaire tendu",
    "index et auriculaire tendus (cornes)", "pouce et index qui se touchent, autres doigts tendus", "doigts mi-pliés"],
  emplacement: ["au-dessus de la tête", "au niveau du front", "au niveau des yeux", "au niveau du nez", "devant la bouche",
    "au niveau du menton", "sous le menton, au niveau du cou", "à côté de la tête (tempe)", "à côté du visage (joue)",
    "à hauteur de la tête, sur le côté", "au niveau des épaules", "devant la poitrine", "devant le ventre", "à hauteur de la taille"],
  mouvement: ["la main reste presque immobile (signe tenu)", "petit mouvement", "mouvement bref", "mouvement répété",
    "mouvement circulaire", "vers le haut", "vers le bas", "vers l'avant", "vers soi", "vers sa droite", "vers sa gauche"],
  visage: ["sourcils levés", "sourcils froncés", "yeux grands ouverts", "yeux plissés", "joues gonflées", "sourire",
    "coins de la bouche vers le bas", "la bouche articule le mot", "la tête fait « oui » (hochements)", "la tête fait « non » (va-et-vient)"]
};
VALEURS.formeAutre = VALEURS.forme;
VALEURS.emplacementFin = VALEURS.emplacement;
const CHAMPS = [
  ["mains", "Mains"], ["deuxMains", "Les deux mains"], ["forme", "Forme de la main"], ["formeAutre", "Forme de l'autre main"],
  ["emplacement", "Emplacement (début)"], ["emplacementFin", "Emplacement (fin)"], ["mouvement", "Mouvement"]
];
const NOMS_STATUTS = { verifiee: "✓ Validée", corrigee: "✎ Corrigée", fausse: "✗ Inutilisable" };

const etat = {
  brutes: {},      // analyse automatique d'origine (data/descriptions-brutes.jsonl)
  relecture: {},   // relecture en cours
  enregistre: {},  // dernière version enregistrée
  serveur: true,   // false si l'enregistrement automatique n'est pas disponible
  actuel: null,
  ordre: Object.keys(window.DESCRIPTIONS || {})
};
const $ = s => document.querySelector(s);
const entree = k => Dico.entrees.find(e => e.k === k);
const memes = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Valeurs affichées pour un signe : l'analyse, avec les corrections déjà faites par-dessus. */
function valeurs(k) {
  const b = etat.brutes[k] || window.DESCRIPTIONS[k] || {};
  const v = { ...b, visage: [...(b.visage || [])], conseil: b.conseil || "" };
  const champs = etat.relecture[k]?.champs || {};
  for (const [c, x] of Object.entries(champs)) v[c] = c === "visage" ? [...x] : x;
  return v;
}

function statut(k) { return etat.relecture[k]?.statut || ""; }
const nbSignales = k => Signalements.pour(k).length;

// ------------------------------------------------------------------ chargement
async function charger() {
  try {
    const t = await (await fetch("../data/descriptions-brutes.jsonl", { cache: "no-store" })).text();
    for (const l of t.split(/\r?\n/)) if (l.trim()) { const d = JSON.parse(l); etat.brutes[d.k] = d; }
  } catch { /* on se contente de js/descriptions.js */ }
  try {
    const r = await fetch("../data/relecture-descriptions.json", { cache: "no-store" });
    if (r.ok) etat.relecture = await r.json();
  } catch { /* pas encore de relecture */ }
  etat.enregistre = JSON.parse(JSON.stringify(etat.relecture));
  try {
    const b = JSON.parse(localStorage.getItem(BROUILLON));
    if (b && b.relecture && !memes(b.relecture, etat.relecture)) {
      etat.relecture = b.relecture;
      afficherSauvegarde("Travail non enregistré repris", "attente");
      planifierEnregistrement();
    }
  } catch { /* rien */ }
  const k = decodeURIComponent(location.hash.slice(1));
  dessinerListe();
  ouvrir(etat.ordre.includes(k) ? k : premierARelire() || etat.ordre[0]);
}

/** Prochain signe à relire après « apres » (au départ : d'abord les signes signalés). */
function premierARelire(apres) {
  if (!apres) return etat.ordre.find(k => nbSignales(k)) || etat.ordre.find(k => !statut(k));
  const i = etat.ordre.indexOf(apres);
  return [...etat.ordre.slice(i + 1), ...etat.ordre.slice(0, i)].find(k => !statut(k) || nbSignales(k));
}

// ------------------------------------------------------------------ liste
function dessinerListe() {
  const filtre = $("#rl-filtre").value, q = Dico.cle($("#rl-recherche").value || "");
  const garder = k => {
    if (q && !Dico.cle(entree(k)?.mot || k).includes(q)) return false;
    if (filtre === "a-relire") return !statut(k) || nbSignales(k) > 0;
    if (filtre === "signales") return nbSignales(k) > 0;
    if (filtre === "tout") return true;
    return statut(k) === filtre;
  };
  const ks = etat.ordre.filter(garder);
  $("#rl-signes").innerHTML = ks.length ? ks.map(k => {
    const s = statut(k), n = nbSignales(k);
    return `<a href="#${encodeURIComponent(k)}" class="rl-item ${k === etat.actuel ? "actif" : ""} ${s}" data-k="${echapper(k)}"
      ${k === etat.actuel ? 'aria-current="true"' : ""}>
      <span class="rl-pastille" aria-hidden="true">${{ verifiee: "✓", corrigee: "✎", fausse: "✗" }[s] || "○"}</span>
      <span>${echapper(entree(k)?.mot || k)}</span>
      ${n ? `<span class="rl-drapeau" title="${n} signalement(s)">⚑ ${n}</span>` : ""}
    </a>`;
  }).join("") : `<p class="petit">Rien à afficher ici.</p>`;
  const faits = etat.ordre.filter(statut).length;
  $("#rl-compte").textContent = `${faits} / ${etat.ordre.length} signes relus`;
  $("#rl-barre").style.width = `${(100 * faits) / Math.max(1, etat.ordre.length)}%`;
}

// ------------------------------------------------------------------ fiche d'un signe
function ouvrir(k) {
  if (!k) return;
  etat.actuel = k;
  if (decodeURIComponent(location.hash.slice(1)) !== k) history.replaceState(null, "", "#" + encodeURIComponent(k));
  const e = entree(k), d = window.DESCRIPTIONS[k], v = valeurs(k), auto = etat.brutes[k] || d;
  const video = e?.videos.find(x => x.url === d.video) || e?.videos[0];
  const s = statut(k), sig = Signalements.pour(k);
  const liste = (c, val) => `<input id="champ-${c}" name="${c}" list="liste-${c}" value="${echapper(val || "")}" autocomplete="off">
    <datalist id="liste-${c}">${VALEURS[c].map(x => `<option value="${echapper(x)}">`).join("")}</datalist>`;
  $("#rl-principal").innerHTML = `
    <div class="rl-titre">
      <h2>${echapper(e?.mot || k)}</h2>
      ${s ? `<span class="rl-statut ${s}">${NOMS_STATUTS[s]}${etat.relecture[k].date ? ` · ${etat.relecture[k].date}` : ""}</span>` : `<span class="rl-statut">À relire</span>`}
      <span class="rl-liens">
        <a href="../#/mot/${encodeURIComponent(k)}" target="_blank" rel="noopener">Page du site ↗</a>
        <a href="https://dico.elix-lsf.fr/dictionnaire/${encodeURIComponent((e?.mot || k).toLowerCase())}" target="_blank" rel="noopener">Elix ↗</a>
      </span>
    </div>
    ${sig.length ? `
      <div class="rl-signalements">
        <strong>⚑ ${sig.length} signalement(s) sur ce signe</strong>
        <ul>${sig.map(x => `<li><span class="petit">${echapper(x.date)}</span>
          ${x.points.map(p => `<span class="rl-puce">${echapper(Signalements.POINTS[p] || p)}</span>`).join("")}
          ${x.texte ? `<q>${echapper(x.texte)}</q>` : ""}</li>`).join("")}</ul>
        <button class="btn btn-second" id="rl-traiter">Marquer comme traités</button>
      </div>` : ""}
    <div class="rl-fiche">
      <div class="rl-video">
        ${video ? `<video id="rl-video" muted loop playsinline autoplay preload="auto">${sourcesVideo(video.url)}</video>` : "<p>Vidéo introuvable.</p>"}
        <div class="rl-boutons-video">
          <button class="puce actif" data-geste="1" ${d.tDebut == null ? "disabled" : ""}>Le geste seul</button>
          <button class="puce" data-geste="0">Vidéo entière</button>
          <button class="puce" data-vitesse="0.5">0,5×</button>
          <button class="puce actif" data-vitesse="1">1×</button>
        </div>
        <p class="petit">Les directions (« vers sa droite ») sont celles de la personne qui signe.</p>
      </div>
      <form id="rl-form" class="rl-form">
        <div class="rl-champ">
          <label for="champ-mains">Mains</label>
          <select id="champ-mains" name="mains">${VALEURS.mains.map(x => `<option ${x === v.mains ? "selected" : ""}>${x}</option>`).join("")}</select>
          ${indice("mains", v, auto)}
        </div>
        ${CHAMPS.slice(1).map(([c, nom]) => `
          <div class="rl-champ ${["deuxMains", "formeAutre"].includes(c) ? "si-deux" : ""}">
            <label for="champ-${c}">${nom}</label>${liste(c, v[c])}
            ${indice(c, v, auto)}
          </div>`).join("")}
        <fieldset class="rl-champ rl-visage">
          <legend>Visage</legend>
          <div class="rl-cases">${[...new Set([...VALEURS.visage, ...v.visage])].map(x => `
            <label><input type="checkbox" name="visage" value="${echapper(x)}" ${v.visage.includes(x) ? "checked" : ""}> ${echapper(x)}</label>`).join("")}
          </div>
          <input name="visageAutre" placeholder="Autre (séparez par des virgules)" aria-label="Autre expression du visage">
          ${indice("visage", v, auto)}
        </fieldset>
        <div class="rl-champ">
          <label for="champ-conseil">Conseil pour apprendre <span class="petit">(facultatif, affiché sur le site)</span></label>
          <textarea id="champ-conseil" name="conseil" rows="2" maxlength="300">${echapper(v.conseil || "")}</textarea>
        </div>
        <div class="rl-actions">
          <button class="btn" type="submit" id="rl-valider"></button>
          <button class="btn btn-second" type="button" id="rl-fausse">✗ Description inutilisable</button>
          ${s ? `<button class="btn btn-second" type="button" id="rl-annuler">Remettre « à relire »</button>` : ""}
        </div>
        <p class="petit rl-raccourcis">Raccourcis (hors des champs) : <kbd>J</kbd> tout est juste · <kbd>N</kbd> signe suivant · <kbd>P</kbd> précédent · <kbd>Espace</kbd> pause</p>
      </form>
    </div>
    <h3>Aperçu sur le site</h3>
    <div id="rl-apercu"></div>`;
  brancherFiche(k, d);
  dessinerListe();
  document.querySelector(".rl-item.actif")?.scrollIntoView({ block: "nearest" });
}

/** Rappel de la valeur trouvée par l'analyse, quand on l'a modifiée. */
function indice(c, v, auto) {
  const a = c === "visage" ? (auto.visage || []).join(", ") : auto[c] || "";
  const x = c === "visage" ? v.visage.join(", ") : v[c] || "";
  if (a === x) return "";
  return `<span class="rl-indice">Analyse automatique : ${echapper(a || "(vide)")}${c === "forme" && auto.formeSure != null ? ` · sûre à ${Math.round(auto.formeSure * 100)} %` : ""}</span>`;
}

function lireForm() {
  const f = $("#rl-form"), v = {};
  for (const [c] of CHAMPS) v[c] = f.elements[c].value.trim();
  v.visage = [...f.querySelectorAll("input[name=visage]:checked")].map(x => x.value);
  v.visage.push(...f.elements.visageAutre.value.split(",").map(x => x.trim()).filter(Boolean));
  v.visage = [...new Set(v.visage)];
  v.conseil = f.elements.conseil.value.trim();
  if (v.mains !== "deux mains") { v.deuxMains = ""; v.formeAutre = ""; }
  return v;
}

/** Ce qui diffère de l'analyse automatique (ce qu'on enregistre). */
function differences(k, v) {
  const auto = etat.brutes[k] || window.DESCRIPTIONS[k], champs = {};
  for (const [c] of CHAMPS) if ((v[c] || "") !== (auto[c] || "")) champs[c] = v[c];
  if (!memes(v.visage, auto.visage || [])) champs.visage = v.visage;
  if (v.conseil) champs.conseil = v.conseil;
  return champs;
}

function brancherFiche(k, d) {
  const f = $("#rl-form"), vid = $("#rl-video");
  let gesteSeul = d.tDebut != null;
  const debut = () => Math.max(0, d.tDebut - .35), fin = () => d.tFin + .35;
  if (vid) {
    vid.addEventListener("loadedmetadata", () => { if (gesteSeul) vid.currentTime = debut(); });
    vid.addEventListener("timeupdate", () => { if (gesteSeul && (vid.currentTime > fin() || vid.currentTime < debut() - .05)) vid.currentTime = debut(); });
  }
  document.querySelectorAll("[data-geste]").forEach(b => (b.onclick = () => {
    gesteSeul = b.dataset.geste === "1";
    document.querySelectorAll("[data-geste]").forEach(x => x.classList.toggle("actif", x === b));
    if (gesteSeul && vid) vid.currentTime = debut();
  }));
  document.querySelectorAll("[data-vitesse]").forEach(b => (b.onclick = () => {
    if (vid) vid.playbackRate = +b.dataset.vitesse;
    document.querySelectorAll("[data-vitesse]").forEach(x => x.classList.toggle("actif", x === b));
  }));

  const maj = () => {
    const v = lireForm(), champs = differences(k, v), corrige = Object.keys(champs).some(c => c !== "conseil");
    f.classList.toggle("deux-mains", v.mains === "deux mains");
    $("#rl-valider").textContent = corrige ? "✓ Valider mes corrections" : "✓ Tout est juste";
    const e = entree(k);
    $("#rl-apercu").innerHTML = e ? htmlDescription({ ...e, k: "__apercu__" }) : "";
  };
  // l'aperçu utilise htmlDescription du site : on lui prête une description temporaire
  const apercu = () => {
    const v = lireForm();
    window.DESCRIPTIONS.__apercu__ = { ...(etat.brutes[k] || d), ...v, verifiee: true, erreur: undefined };
    for (const c of ["deuxMains", "formeAutre", "conseil", "emplacementFin"]) if (!v[c]) delete window.DESCRIPTIONS.__apercu__[c];
  };
  f.addEventListener("input", () => { apercu(); maj(); });
  f.addEventListener("change", () => { apercu(); maj(); });
  apercu(); maj();

  f.onsubmit = ev => { ev.preventDefault(); valider(k); };
  $("#rl-fausse").onclick = () => decider(k, { statut: "fausse", date: Signalements.jour() });
  const annuler = $("#rl-annuler");
  if (annuler) annuler.onclick = () => { delete etat.relecture[k]; modifie(); ouvrir(k); };
  const traiter = $("#rl-traiter");
  if (traiter) traiter.onclick = () => { Signalements.traiter(k); ouvrir(k); };
}

function valider(k) {
  const v = lireForm(), champs = differences(k, v);
  const corrige = Object.keys(champs).some(c => c !== "conseil");
  decider(k, { statut: corrige ? "corrigee" : "verifiee", date: Signalements.jour(), ...(Object.keys(champs).length ? { champs } : {}) });
}

function decider(k, rev) {
  etat.relecture[k] = rev;
  if (nbSignales(k)) Signalements.traiter(k);
  modifie();
  const suivant = premierARelire(k);
  ouvrir(suivant && suivant !== k ? suivant : k);
}

// ------------------------------------------------------------------ enregistrement
let minuterie = null;
function modifie() {
  try { localStorage.setItem(BROUILLON, JSON.stringify({ relecture: etat.relecture })); } catch { /* rien */ }
  afficherSauvegarde("Modifications en attente…", "attente");
  planifierEnregistrement();
}
function planifierEnregistrement() { clearTimeout(minuterie); minuterie = setTimeout(enregistrer, 600); }

async function enregistrer() {
  if (!etat.serveur) return montrerTelechargement();
  try {
    const r = await fetch("enregistrer-relecture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(etat.relecture) });
    const rep = await r.json().catch(() => ({}));
    if (!r.ok || !rep.ok) throw new Error(rep.message || `erreur ${r.status}`);
    etat.enregistre = JSON.parse(JSON.stringify(etat.relecture));
    try { localStorage.removeItem(BROUILLON); } catch { /* rien */ }
    afficherSauvegarde("✓ Enregistré, site mis à jour", "ok");
  } catch (err) {
    // serveur simple (python -m http.server) ou fichier ouvert directement : pas d'écriture possible
    if (/501|405|404|Failed to fetch|NetworkError|Unexpected/.test(String(err.message))) { etat.serveur = false; return montrerTelechargement(); }
    afficherSauvegarde("Échec de l'enregistrement : " + err.message, "ko");
  }
}

function montrerTelechargement() {
  $("#rl-telecharger").hidden = false;
  afficherSauvegarde("Gardé dans ce navigateur : pensez à télécharger le fichier", "attente");
}
$("#rl-btn-telecharger").onclick = () => {
  const blob = new Blob([JSON.stringify(etat.relecture, null, 1) + "\n"], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "relecture-descriptions.json" });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

function afficherSauvegarde(texte, classe) {
  const el = $("#rl-sauvegarde");
  el.textContent = texte;
  el.className = "rl-sauvegarde " + (classe || "");
}

// ------------------------------------------------------------------ navigation
$("#rl-filtre").onchange = dessinerListe;
$("#rl-recherche").oninput = dessinerListe;
window.addEventListener("hashchange", () => {
  const k = decodeURIComponent(location.hash.slice(1));
  if (k !== etat.actuel && etat.ordre.includes(k)) ouvrir(k);
});
document.addEventListener("keydown", ev => {
  if (ev.target.closest("input, textarea, select") || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const i = etat.ordre.indexOf(etat.actuel);
  if (ev.key === "j" || ev.key === "J") { ev.preventDefault(); valider(etat.actuel); }
  else if (ev.key === "n" || ev.key === "N") ouvrir(etat.ordre[(i + 1) % etat.ordre.length]);
  else if (ev.key === "p" || ev.key === "P") ouvrir(etat.ordre[(i - 1 + etat.ordre.length) % etat.ordre.length]);
  else if (ev.key === " " && !ev.target.closest("button, a")) {
    ev.preventDefault();
    const v = $("#rl-video");
    if (v) v.paused ? v.play() : v.pause();
  }
});
window.addEventListener("beforeunload", ev => {
  if (!memes(etat.relecture, etat.enregistre) && etat.serveur) { ev.preventDefault(); ev.returnValue = ""; }
});

charger();
