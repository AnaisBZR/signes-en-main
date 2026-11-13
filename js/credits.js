// Page « Crédits et licences » : qui signe dans les vidéos, sous quelle licence, et d'où
// viennent les autres éléments du site. Tout est calculé à partir des données (dictionnaire,
// alphabet) : un nouveau signeur ou une nouvelle vidéo apparaît ici automatiquement.

const LICENCES = {
  "CC BY 3.0": { url: "https://creativecommons.org/licenses/by/3.0/deed.fr",
    texte: "Libre d'utilisation et de partage, à condition de citer l'auteur et la licence." },
  "CC BY-SA 3.0": { url: "https://creativecommons.org/licenses/by-sa/3.0/deed.fr",
    texte: "Comme CC BY, et une version modifiée doit être partagée sous la même licence." },
  "CC BY-SA 4.0": { url: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    texte: "Comme CC BY, et une version modifiée doit être partagée sous la même licence." },
  "CC0": { url: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
    texte: "Domaine public : l'auteur a renoncé à ses droits. On le cite quand même, par respect." }
};

/** Nom à afficher pour un auteur (les fichiers de Commons l'écrivent de plusieurs façons). */
function nomAuteur(a) {
  a = String(a || "").trim();
  if (/jauvert/i.test(a)) return "Laura Jauvert";
  return a || "Auteur inconnu";
}

/** Signeurs et signeuses : nombre de vidéos, sources et licences. */
function auteursVideos() {
  const m = new Map();
  for (const e of window.DICTIONNAIRE || []) for (const v of e.videos) {
    const nom = nomAuteur(v.auteur);
    const a = m.get(nom) || { nom, n: 0, sources: new Set(), licences: new Set(), montage: false };
    a.n++; a.sources.add(v.source); a.licences.add(v.licence);
    if (/editing|splitting|lopez/i.test(v.auteur)) a.montage = true;
    m.set(nom, a);
  }
  return [...m.values()].sort((x, y) => y.n - x.n || x.nom.localeCompare(y.nom, "fr"));
}

const lienLicence = l => LICENCES[l]
  ? `<a href="${LICENCES[l].url}" target="_blank" rel="noopener">${echapper(l)}</a>` : echapper(l || "licence inconnue");

function pageCredits() {
  const auteurs = auteursVideos();
  const videos = (window.DICTIONNAIRE || []).flatMap(e => e.videos.map(v => ({ ...v, mot: e.mot })));
  const parLicence = {};
  videos.forEach(v => (parLicence[v.licence] = (parLicence[v.licence] || 0) + 1));
  const photos = window.ALPHABET || [];
  const auteursPhotos = [...new Set(photos.map(p => p.auteur.replace(/~commonswiki$/, "")))];

  app.innerHTML = `
    <h1>Crédits et licences</h1>
    <p class="hero-sous">Ce site n'existe que grâce aux personnes qui ont filmé leurs signes et les ont partagés librement.
      Merci à elles. Toutes les vidéos et photos sont hébergées sur <a href="https://commons.wikimedia.org/wiki/Category:Videos_of_French_Sign_Language" target="_blank" rel="noopener">Wikimedia Commons</a>
      et lues directement depuis Commons, sans être modifiées.</p>

    <section>
      <h2>Les personnes qui signent</h2>
      <p class="petit">${videos.length} vidéos, par ${auteurs.length} auteurs et autrices. L'auteur et la licence sont aussi indiqués sous chaque vidéo.</p>
      <div class="grille-credits">
        ${auteurs.map(a => `
          <div class="credit-carte">
            <strong>${echapper(a.nom)}</strong>
            <span class="petit">${a.n} vidéo${a.n > 1 ? "s" : ""} · ${[...a.sources].map(echapper).join(", ")}</span>
            <span class="petit">Licence : ${[...a.licences].map(lienLicence).join(", ")}</span>
            ${a.montage ? `<span class="petit">Découpage de certaines vidéos : Édouard Lopez</span>` : ""}
          </div>`).join("")}
      </div>
    </section>

    <section>
      <h2>D'où viennent les vidéos</h2>
      <ul class="liste-sources">
        <li><a href="https://lingualibre.org" target="_blank" rel="noopener"><strong>Lingua Libre</strong></a> : projet
          participatif de Wikimédia France, où chacun peut enregistrer des mots dans sa langue, y compris en LSF.</li>
        <li><a href="https://dico.elix-lsf.fr" target="_blank" rel="noopener"><strong>Elix</strong></a>, le dictionnaire vivant
          en langue des signes : une partie de ses vidéos a été partagée sur Wikimedia Commons sous licence CC BY-SA 4.0.</li>
        <li><strong>Wikimedia Commons</strong> : vidéos publiées directement par leurs auteurs (notamment Laura Jauvert).</li>
      </ul>
    </section>

    <section>
      <h2>Les licences</h2>
      <div class="grille-credits">
        ${[...Object.keys(parLicence), ...new Set(photos.map(p => p.licence))].filter((l, i, t) => t.indexOf(l) === i).map(l => `
          <div class="credit-carte">
            <strong>${lienLicence(l)}</strong>
            <span class="petit">${parLicence[l] ? `${parLicence[l]} vidéo${parLicence[l] > 1 ? "s" : ""}` : ""}${parLicence[l] && photos.some(p => p.licence === l) ? " · " : ""}${photos.some(p => p.licence === l) ? `${photos.filter(p => p.licence === l).length} photos` : ""}</span>
            <span class="petit">${echapper(LICENCES[l]?.texte || "")}</span>
          </div>`).join("")}
      </div>
      <p class="petit">Sur ce site, les vidéos peuvent être ralenties, retournées comme dans un miroir (mode gaucher) ou lues en
        partie (phrases enchaînées) : c'est seulement la façon de les afficher, les fichiers d'origine ne sont pas modifiés.</p>
    </section>

    <section>
      <h2>Photos de l'alphabet</h2>
      <p>Les ${photos.length} photos de l'alphabet manuel viennent de Wikimedia Commons : ${auteursPhotos.map(echapper).join(", ")},
        licence ${[...new Set(photos.map(p => p.licence))].map(lienLicence).join(", ")}.</p>
    </section>

    <section>
      <h2>Le reste du site</h2>
      <ul class="liste-sources">
        <li>Polices de caractères : <a href="https://fonts.google.com/specimen/Fraunces" target="_blank" rel="noopener">Fraunces</a>
          (Undercase Type) pour les titres et <a href="https://fonts.google.com/specimen/Inter" target="_blank" rel="noopener">Inter</a>
          (Rasmus Andersson) pour le texte, licence <a href="https://openfontlicense.org" target="_blank" rel="noopener">SIL Open Font License</a>.</li>
        <li>Descriptions « Comment faire le signe » : produites automatiquement par analyse des vidéos, puis relues
          (celles marquées « ✓ Vérifiée »).</li>
        <li>Textes, leçons, exercices et icônes : écrits et dessinés pour ce site.</li>
        <li>Les liens vers Elix et Spread The Sign mènent à leurs propres sites : leurs vidéos ne sont pas copiées ici.</li>
      </ul>
    </section>

    <section>
      <h2>Liste complète</h2>
      <details class="liste-complete" id="liste-complete">
        <summary>Afficher les ${videos.length + photos.length} vidéos et photos, avec leur auteur et leur licence</summary>
        <div id="table-credits"><p class="petit">Chargement…</p></div>
      </details>
    </section>

    <p class="petit">Une erreur dans un crédit ? Utilisez « Signaler une erreur » sur la page du signe concerné${CONFIG_SITE.depotGithub
      ? `, ou <a href="https://github.com/${echapper(CONFIG_SITE.depotGithub)}/issues/new" target="_blank" rel="noopener">écrivez-nous sur GitHub</a>` : ""}.</p>`;

  const details = document.getElementById("liste-complete");
  details.addEventListener("toggle", () => {
    const zone = document.getElementById("table-credits");
    if (!details.open || zone.dataset.fait) return;
    zone.dataset.fait = "1";
    const lignes = [
      ...videos.map(v => ({ quoi: v.mot, auteur: nomAuteur(v.auteur), licence: v.licence, page: v.page })),
      ...photos.map(p => ({ quoi: `Lettre ${p.lettre}`, auteur: p.auteur.replace(/~commonswiki$/, ""), licence: p.licence, page: p.page }))
    ];
    zone.innerHTML = `
      <div class="table-defile"><table class="table-credits">
        <thead><tr><th scope="col">Signe</th><th scope="col">Auteur</th><th scope="col">Licence</th><th scope="col">Fichier</th></tr></thead>
        <tbody>${lignes.map(l => `<tr><td>${echapper(l.quoi)}</td><td>${echapper(l.auteur)}</td><td>${lienLicence(l.licence)}</td>
          <td><a href="${echapper(l.page)}" target="_blank" rel="noopener">Commons ↗</a></td></tr>`).join("")}</tbody>
      </table></div>`;
  });
}
