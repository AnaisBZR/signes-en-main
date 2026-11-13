// « Signaler une erreur » : sur chaque page de signe, on peut indiquer ce qui ne va pas
// dans la description automatique (ou la vidéo). Les signalements sont gardés dans ce
// navigateur ; l'outil de relecture (outils/relecture.html) les affiche à côté du signe.
// Une fois le site en ligne, ils pourront aussi être envoyés sur GitHub (CONFIG_SITE.depotGithub).

const CONFIG_SITE = {
  depotGithub: "AnaisBZR/signes-en-main", // dépôt GitHub du site : les signalements peuvent y être envoyés
  // Comptes en ligne et amis (js/en-ligne.js) : projet Supabase. La clé « anon » est publique
  // (faite pour être dans le site) ; la sécurité est assurée par supabase/schema.sql.
  // Tant que url et cle sont vides, la connexion et les amis restent cachés.
  supabase: { url: "https://mjslicisogujmwyphuxo.supabase.co", cle: "sb_publishable_GwuefTn4OQHVrt823VM91Q_RCWJGnQq", domaine: "pseudo.signes-en-main.invalid" }
};

const Signalements = {
  CLE: "lsf-signalements",
  POINTS: {
    mains: "Le nombre de mains",
    forme: "La forme de la main",
    emplacement: "L'emplacement",
    mouvement: "Le mouvement",
    visage: "Le visage",
    video: "La vidéo ne montre pas ce mot",
    autre: "Autre chose"
  },
  jour() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },
  lire() {
    try {
      const l = JSON.parse(localStorage.getItem(this.CLE));
      return Array.isArray(l) ? l : [];
    } catch { return []; }
  },
  sauver(l) { try { localStorage.setItem(this.CLE, JSON.stringify(l)); } catch { /* navigation privée */ } },
  /** Enregistre un signalement ; renvoie null s'il est vide (ni case cochée, ni texte). */
  ajouter({ k, mot, points = [], texte = "", video = "" }) {
    const s = {
      k: String(k), mot: String(mot),
      points: [...new Set(points)].filter(p => p in this.POINTS),
      texte: String(texte).trim().slice(0, 1000),
      video: String(video), date: this.jour()
    };
    if (!s.k || (!s.points.length && !s.texte)) return null;
    const l = this.lire();
    l.push(s);
    this.sauver(l.slice(-500)); // garde-fou : pas de liste sans fin
    return s;
  },
  pour(k) { return this.lire().filter(s => s.k === k); },
  /** Outil de relecture : les signalements d'un signe sont traités, on les retire. */
  traiter(k) { this.sauver(this.lire().filter(s => s.k !== k)); },
  versTexte(s) {
    return [`Signe : ${s.mot}`,
      s.points.length ? `Problème : ${s.points.map(p => this.POINTS[p].toLowerCase()).join(", ")}` : "",
      s.texte ? `Détails : ${s.texte}` : "",
      s.video ? `Vidéo : ${s.video}` : ""].filter(Boolean).join("\n");
  },
  lienGithub(s) {
    if (!CONFIG_SITE.depotGithub) return "";
    const titre = `Erreur signalée : ${s.mot}`;
    return `https://github.com/${CONFIG_SITE.depotGithub}/issues/new?title=${encodeURIComponent(titre)}&body=${encodeURIComponent(this.versTexte(s))}`;
  }
};

/** Formulaire repliable « Signaler une erreur », sous la description d'un signe. */
function htmlSignaler(e) {
  const deja = Signalements.pour(e.k).length;
  return `
    <details class="signaler" data-k="${echapper(e.k)}">
      <summary>Signaler une erreur${deja ? ` <span class="petit">(${deja} déjà signalée${deja > 1 ? "s" : ""} depuis cet appareil)</span>` : ""}</summary>
      <form class="form-signaler">
        <fieldset>
          <legend>Qu'est-ce qui ne va pas ?</legend>
          ${Object.entries(Signalements.POINTS).map(([id, nom]) => `
            <label class="case"><input type="checkbox" name="points" value="${id}"> ${echapper(nom)}</label>`).join("")}
        </fieldset>
        <label class="champ-texte">Précisez si vous voulez <span class="petit">(par exemple : « la main est fermée, pas ouverte »)</span>
          <textarea name="texte" rows="3" maxlength="1000"></textarea></label>
        <p class="message-signaler" role="status" aria-live="polite"></p>
        <button class="btn btn-second" type="submit">Envoyer le signalement</button>
      </form>
    </details>`;
}

function brancherSignaler(racine, e, video) {
  const bloc = racine.querySelector(".signaler");
  if (!bloc) return;
  const form = bloc.querySelector("form"), message = bloc.querySelector(".message-signaler");
  form.onsubmit = ev => {
    ev.preventDefault();
    const s = Signalements.ajouter({
      k: e.k, mot: e.mot, video: video ? video() : "",
      points: [...form.querySelectorAll("input[name=points]:checked")].map(c => c.value),
      texte: form.elements.texte.value
    });
    if (!s) { message.textContent = "Cochez au moins une case, ou écrivez ce qui ne va pas."; return; }
    const lien = Signalements.lienGithub(s);
    form.innerHTML = `
      <p class="merci-signaler"><strong>Merci !</strong> Votre signalement est enregistré : il sera vu lors de la prochaine relecture des descriptions.</p>
      <div class="hero-actions">
        ${lien ? `<a class="btn" href="${lien}" target="_blank" rel="noopener">L'envoyer aussi sur GitHub ↗</a>` : ""}
        <button class="btn btn-second" type="button" data-action="copier">Copier le texte du signalement</button>
      </div>`;
    form.querySelector('[data-action="copier"]').onclick = async b => {
      try { await navigator.clipboard.writeText(Signalements.versTexte(s)); b.target.textContent = "✓ Copié"; }
      catch { b.target.textContent = "Copie impossible"; }
    };
  };
}
