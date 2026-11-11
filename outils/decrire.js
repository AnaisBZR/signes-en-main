// =====================================================================
// Description automatique d'un signe à partir de sa vidéo.
// La vidéo est analysée (corps, mains, visage) par l'outil de l'Animateur,
// puis les mesures sont traduites en phrases : mains utilisées, forme de la
// main, emplacement, mouvement, expression du visage.
// Ces descriptions sont des AIDES : elles peuvent contenir des erreurs.
// =====================================================================
import { analyserVideo } from "../animateur-video/js/analyse.js";

// ---------------------------------------------------------------------
// Outils géométriques
// ---------------------------------------------------------------------
const d3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mediane = t => { const s = t.filter(x => x != null && !Number.isNaN(x)).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const quantile = (t, q) => { const s = t.filter(x => x != null).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : null; };
const vec = (a, b) => ({ x: b.x - a.x, y: b.y - a.y, z: (b.z || 0) - (a.z || 0) });
const angle = (u, v) => {
  const n = Math.hypot(u.x, u.y, u.z) * Math.hypot(v.x, v.y, v.z) || 1;
  return Math.acos(Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y + u.z * v.z) / n))) * 57.3;
};

// ---------------------------------------------------------------------
// 1. Forme de la main (configuration) à partir des 21 points 3D de la main
// ---------------------------------------------------------------------
const DOIGTS = { index: [5, 6, 7, 8], majeur: [9, 10, 11, 12], annulaire: [13, 14, 15, 16], auriculaire: [17, 18, 19, 20] };

/** Rectitude d'un doigt : distance base->bout / longueur des phalanges (1 = tendu). */
function rectitude(h, [a, b, c, d]) {
  return d3(h[a], h[d]) / (d3(h[a], h[b]) + d3(h[b], h[c]) + d3(h[c], h[d]));
}

export function formeMain(h) {
  if (!h) return null;
  const paume = d3(h[0], h[9]);
  const etat = {};
  for (const [nom, ids] of Object.entries(DOIGTS)) {
    const r = rectitude(h, ids);
    // le doigt est aussi « replié » si son bout revient près du poignet
    // (réglages calibrés sur des signes à main plate connus ; l'auriculaire est plus court)
    const loin = d3(h[ids[3]], h[0]) / paume;
    const court = nom === "auriculaire" ? 0.82 : 1;
    etat[nom] = r > 0.88 && loin > 1.3 * court ? "tendu" : r < 0.72 || loin < 1.05 * court ? "plié" : "arrondi";
  }
  const pouceSorti = d3(h[4], h[5]) / paume > 0.8 && d3(h[4], h[2]) / (d3(h[2], h[3]) + d3(h[3], h[4])) > 0.85;
  const pince = d3(h[4], h[8]) / paume < 0.3;
  const ecartes = angle(vec(h[5], h[8]), vec(h[17], h[20])) > 28;
  const tendus = Object.entries(etat).filter(([, e]) => e === "tendu").map(([n]) => n);
  const arrondis = Object.values(etat).filter(e => e === "arrondi").length;
  const t = new Set(tendus);
  const seulement = (...n) => tendus.length === n.length && n.every(x => t.has(x));

  if (tendus.length === 4) return pouceSorti && ecartes ? "main ouverte, doigts écartés" : ecartes ? "main ouverte, doigts un peu écartés" : "main plate, doigts serrés";
  if (pince && tendus.length >= 2) return "pouce et index qui se touchent, autres doigts tendus";
  if (pince) return "main en « O » (pouce et index qui se touchent)";
  if (seulement("index")) return pouceSorti ? "pouce et index tendus (forme « L »)" : "index tendu, autres doigts repliés";
  if (seulement("index", "majeur")) return angle(vec(h[5], h[8]), vec(h[9], h[12])) > 14 ? "index et majeur tendus et écartés (forme « V »)" : "index et majeur tendus, serrés";
  if (seulement("index", "majeur", "annulaire")) return "trois doigts tendus (index, majeur, annulaire)";
  if (seulement("auriculaire")) return pouceSorti ? "pouce et auriculaire tendus (forme « Y »)" : "auriculaire tendu";
  if (seulement("index", "auriculaire")) return "index et auriculaire tendus (cornes)";
  if (tendus.length === 0 && arrondis >= 3) return "main arrondie (forme « C »)";
  if (tendus.length === 0) return pouceSorti ? "poing fermé, pouce sorti" : "poing fermé";
  if (tendus.length === 3) return "main ouverte, un doigt replié";
  return "doigts mi-pliés";
}

// ---------------------------------------------------------------------
// 2. Emplacement de la main par rapport au visage et au corps
// ---------------------------------------------------------------------
function emplacement(f, c, aspect, laMain) {
  const P = q => ({ x: q.x * aspect, y: q.y });
  const p = f.pose2d;
  const epY = (p[11].y + p[12].y) / 2, hanY = (p[23].y + p[24].y) / 2;
  const milieuX = (p[11].x + p[12].x) / 2 * aspect, largE = Math.abs(p[11].x - p[12].x) * aspect;
  const v = f.visage2d;
  if (v) {
    const front = P(v[10]), menton = P(v[152]), nez = P(v[1]), bouche = P(v[13]);
    const yeux = { x: (v[159].x + v[386].x) / 2 * aspect, y: (v[159].y + v[386].y) / 2 };
    const largV = d2(P(v[234]), P(v[454])), hautV = menton.y - front.y;
    // Point de contact : le bout de doigt (ou le poignet) le plus proche du visage
    const m = f[`main${laMain}2d`];
    if (m) {
      const proche = [0, 4, 8, 12, 16, 20].map(i => P(m[i])).sort((a, b) => d2(a, nez) - d2(b, nez))[0];
      if (d2(proche, nez) < largV * 1.3) c = proche;
    }
    const dx = Math.abs(c.x - nez.x);
    if (c.y < front.y - hautV * 0.35) return "au-dessus de la tête";
    if (dx < largV * 0.75 && c.y < menton.y + hautV * 0.45) {
      if (c.y < front.y + hautV * 0.18) return "au niveau du front";
      if (c.y < yeux.y + hautV * 0.12) return "au niveau des yeux";
      if (c.y < nez.y + hautV * 0.08) return "au niveau du nez";
      if (c.y < bouche.y + hautV * 0.12) return "devant la bouche";
      if (c.y < menton.y + hautV * 0.15) return "au niveau du menton";
      return "sous le menton, au niveau du cou";
    }
    if (dx < largV * 1.6 && c.y > front.y - hautV * 0.2 && c.y < menton.y + hautV * 0.2) {
      return c.y < yeux.y + hautV * 0.1 ? "à côté de la tête (tempe)" : "à côté du visage (joue)";
    }
  }
  const torse = Math.max(0.05, hanY - epY);
  const cote = Math.abs(c.x - milieuX) > largE * 0.75 ? ", sur le côté" : "";
  if (c.y < epY - torse * 0.1) return "à hauteur de la tête, sur le côté";
  if (c.y < epY + torse * 0.2) return "au niveau des épaules" + cote;
  if (c.y < epY + torse * 0.6) return "devant la poitrine" + cote;
  if (c.y < hanY - torse * 0.05) return "devant le ventre" + cote;
  return "à hauteur de la taille" + cote;
}

// ---------------------------------------------------------------------
// 3. Mouvement (trajectoire de la main pendant le signe)
// ---------------------------------------------------------------------
function decrireMouvement(pts, largE) {
  // pts : [{x, y, z}] en unités image (x corrigé de l'aspect), z en mètres (vers la caméra = négatif)
  if (pts.length < 3) return { texte: "mouvement bref", chemin: 0 };
  let chemin = 0;
  for (let i = 1; i < pts.length; i++) chemin += d2(pts[i], pts[i - 1]);
  const moyenne = (a, b) => { const s = pts.slice(a, b); return { x: s.reduce((t, p) => t + p.x, 0) / s.length, y: s.reduce((t, p) => t + p.y, 0) / s.length, z: s.reduce((t, p) => t + p.z, 0) / s.length }; };
  const n = Math.max(1, Math.round(pts.length * 0.15));
  const debut = moyenne(0, n), fin = moyenne(pts.length - n, pts.length);
  const tailleMoy = (a, b) => mediane(pts.slice(a, b).map(p => p.taille));
  const td = tailleMoy(0, n), tf = tailleMoy(pts.length - n, pts.length);
  const dep = {
    x: (fin.x - debut.x) / largE, y: (fin.y - debut.y) / largE,
    // avant / arrière : d'après la taille apparente de la main (plus fiable que la profondeur estimée)
    z: 0
  };
  // avant / arrière : on ne le dit que si la taille apparente de la main ET la profondeur estimée
  // du poignet sont d'accord (chacun seul se trompe quand la main tourne)
  const zTaille = td && tf ? -Math.log(tf / td) / Math.log(1.35) : 0, zPose = (fin.z - debut.z) / 0.25;
  if (Math.sign(zTaille) === Math.sign(zPose)) dep.z = Math.sign(zTaille) * Math.min(Math.abs(zTaille), Math.abs(zPose));
  const net = Math.hypot(dep.x, dep.y, dep.z);
  const cheminN = chemin / largE;
  if (cheminN < 0.3) return { texte: "la main reste presque immobile (signe tenu)", chemin: cheminN };

  // Répétitions : allers-retours le long de l'axe principal du mouvement
  const cx = pts.reduce((t, p) => t + p.x, 0) / pts.length, cy = pts.reduce((t, p) => t + p.y, 0) / pts.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of pts) { sxx += (p.x - cx) ** 2; syy += (p.y - cy) ** 2; sxy += (p.x - cx) * (p.y - cy); }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const proj = pts.map(p => (p.x - cx) * Math.cos(theta) + (p.y - cy) * Math.sin(theta));
  let extremes = 0, dernier = proj[0], sens = 0;
  for (const v of proj) {
    const d = v - dernier;
    if (Math.abs(d) > largE * 0.12) {
      const s = Math.sign(d);
      if (sens && s !== sens) extremes++;
      sens = s; dernier = v;
    }
  }
  // Mouvement circulaire : la direction tourne sur plus de 300°
  // (trajectoire rééchantillonnée tous les 8 % de largeur d'épaules pour ignorer le tremblement)
  const echant = [pts[0]];
  for (const p of pts) if (d2(p, echant[echant.length - 1]) > largE * 0.08) echant.push(p);
  let tour = 0, tourAbs = 0;
  for (let i = 2; i < echant.length; i++) {
    const a1 = Math.atan2(echant[i - 1].y - echant[i - 2].y, echant[i - 1].x - echant[i - 2].x);
    const a2 = Math.atan2(echant[i].y - echant[i - 1].y, echant[i].x - echant[i - 1].x);
    const da = ((a2 - a1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    tour += da; tourAbs += Math.abs(da);
  }
  const morceaux = [];
  // circulaire = la direction tourne toujours dans le même sens (pas un aller-retour)
  if (Math.abs(tour) > 5.2 && Math.abs(tour) > tourAbs * 0.7) morceaux.push("mouvement circulaire");
  else if (extremes >= 2) morceaux.push(net < cheminN * 0.35 ? `va-et-vient répété (${Math.round(extremes / 2) + 1} fois environ)` : "mouvement répété");
  if (net > 0.25) {
    // directions du point de vue de la personne qui signe (sa droite = gauche de l'image)
    const dirs = [
      [-dep.y, "vers le haut", "vers le bas"],
      [-dep.x, "vers sa droite", "vers sa gauche"],
      [-dep.z, "vers l'avant", "vers soi"]
    ].map(([v, plus, moins]) => ({ v: Math.abs(v), mot: v > 0 ? plus : moins }))
      .sort((a, b) => b.v - a.v)
      .filter((d, i) => i === 0 || d.v > net * 0.45);
    morceaux.push(dirs.map(d => d.mot).join(" et "));
  }
  if (!morceaux.length) morceaux.push("petit mouvement");
  return { texte: morceaux.join(", "), chemin: cheminN };
}

// ---------------------------------------------------------------------
// 4. Visage
// ---------------------------------------------------------------------
function decrireVisage(frames, debut, fin) {
  const toutes = frames.filter(f => f.expressions);
  const actives = frames.slice(debut, fin + 1).filter(f => f.expressions);
  if (actives.length < 3) return [];
  // référence = visage au repos (valeur basse sur toute la vidéo), pic = pendant le signe
  const base = n => quantile(toutes.map(f => f.expressions[n] ?? 0), 0.2) ?? 0;
  const pic = n => quantile(actives.map(f => f.expressions[n] ?? 0), 0.8) ?? 0;
  const ecart = (...noms) => Math.max(...noms.map(n => pic(n) - base(n)));
  const candidats = [];
  const ajouter = (force, seuil, texte, groupe) => { if (force > seuil) candidats.push({ score: force / seuil, texte, groupe }); };
  ajouter(ecart("browInnerUp", "browOuterUpLeft", "browOuterUpRight"), 0.35, "sourcils levés", "sourcils");
  ajouter(ecart("browDownLeft", "browDownRight"), 0.35, "sourcils froncés", "sourcils");
  ajouter(ecart("eyeWideLeft", "eyeWideRight"), 0.3, "yeux grands ouverts", "yeux");
  ajouter(ecart("eyeSquintLeft", "eyeSquintRight"), 0.4, "yeux plissés", "yeux");
  ajouter(ecart("mouthSmileLeft", "mouthSmileRight"), 0.4, "sourire", "levres");
  ajouter(ecart("mouthFrownLeft", "mouthFrownRight"), 0.3, "coins de la bouche vers le bas", "levres");
  ajouter(ecart("cheekPuff"), 0.35, "joues gonflées", "joues");
  // bouche qui s'ouvre / s'arrondit : en général la personne articule le mot (labialisation)
  ajouter(ecart("jawOpen", "mouthPucker", "mouthFunnel"), 0.35, "la bouche articule le mot", "bouche");
  // un seul trait par groupe (pas « sourcils levés » ET « froncés »), 3 traits au plus
  const vus = new Set();
  const traits = candidats.sort((a, b) => b.score - a.score)
    .filter(c => !vus.has(c.groupe) && vus.add(c.groupe)).slice(0, 3).map(c => c.texte);
  // tête : hochements (oui) ou rotations (non) = au moins un aller-retour franc
  const q = actives.map(f => f.teteQuat).filter(Boolean);
  if (q.length > 4) {
    const eul = q.map(([x, y, z, w]) => ({
      lacet: Math.asin(Math.max(-1, Math.min(1, 2 * (w * y - z * x)))) * 57.3,
      tangage: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)) * 57.3
    }));
    const allersRetours = (k, seuil) => {
      let n = 0, ref = eul[0][k], sens = 0;
      for (const e of eul) {
        const d = e[k] - ref;
        if (Math.abs(d) > seuil) { const s = Math.sign(d); if (sens && s !== sens) n++; sens = s; ref = e[k]; }
      }
      return n;
    };
    if (allersRetours("tangage", 7) >= 2) traits.push("la tête fait « oui » (hochements)");
    else if (allersRetours("lacet", 8) >= 2) traits.push("la tête fait « non » (va-et-vient)");
  }
  return traits;
}

// ---------------------------------------------------------------------
// Description complète d'une vidéo analysée
// ---------------------------------------------------------------------
export function decrire(res) {
  const { frames, largeur, hauteur } = res;
  const aspect = largeur / hauteur;
  const avecPose = frames.filter(f => f.pose2d);
  if (avecPose.length < frames.length * 0.5) return { erreur: "personne mal détectée" };
  const largE = mediane(avecPose.map(f => Math.abs(f.pose2d[11].x - f.pose2d[12].x) * aspect)) || 0.2;

  // Position de chaque main image par image (centre de la main si détectée, sinon poignet)
  const position = (f, cote) => {
    const m = f[`main${cote}2d`];
    const w = f.pose2d?.[cote === "D" ? 16 : 15];
    const c = m ? { x: (m[0].x + m[9].x) / 2, y: (m[0].y + m[9].y) / 2 } : w ? { x: w.x, y: w.y } : null;
    const z = f.pose3d?.[cote === "D" ? 16 : 15]?.z ?? 0;
    // taille apparente de la main : elle grossit quand la main avance vers la caméra
    const taille = m ? Math.hypot((m[0].x - m[9].x) * aspect, m[0].y - m[9].y) : null;
    return c ? { x: c.x * aspect, y: c.y, z, taille } : null;
  };
  const series = { D: frames.map(f => position(f, "D")), G: frames.map(f => position(f, "G")) };

  // Main levée = au-dessus de sa position de repos (la plus basse de la vidéo)
  const torse = mediane(avecPose.map(f => ((f.pose2d[23].y + f.pose2d[24].y) - (f.pose2d[11].y + f.pose2d[12].y)) / 2)) || 0.3;
  const activite = {};
  for (const cote of ["D", "G"]) {
    const s = series[cote];
    const repos = quantile(s.map(p => p?.y), 0.92);
    // levée = nettement au-dessus de sa position de repos, ou au-dessus du bas du torse
    // (le 2e critère sert aux clips très courts où la main est levée dès la première image)
    const hanY = mediane(avecPose.map(f => (f.pose2d[23].y + f.pose2d[24].y) / 2));
    const levee = s.map(p => !!p && (repos - p.y > torse * 0.25 || p.y < hanY - torse * 0.4));
    let chemin = 0;
    for (let i = 1; i < s.length; i++) if (s[i] && s[i - 1] && (levee[i] || levee[i - 1])) chemin += d2(s[i], s[i - 1]);
    activite[cote] = { levee, nb: levee.filter(Boolean).length, chemin };
  }
  const score = c => activite[c].nb / frames.length + activite[c].chemin / largE * 0.3;
  const dom = score("D") >= score("G") ? "D" : "G", autre = dom === "D" ? "G" : "D";
  if (activite[dom].nb < 3) return { erreur: "aucun geste détecté" };
  const deuxMains = activite[autre].nb > activite[dom].nb * 0.45 && (activite[autre].chemin > activite[dom].chemin * 0.3 || activite[autre].nb > activite[dom].nb * 0.8);

  // Segment du signe : de la première à la dernière image où la main dominante est levée
  const lev = activite[dom].levee;
  const leve0 = lev.indexOf(true), leve1 = lev.lastIndexOf(true);
  const s = series[dom];
  // Cœur du signe : on retire la montée de la main (depuis le repos) et sa descente.
  // La main « arrive » au premier ralentissement net après la montée, et « repart »
  // au dernier ralentissement avant la descente.
  const vit = s.map((p, i) => (p && s[i - 1] ? d2(p, s[i - 1]) : 0));
  const vl = vit.map((_, i) => { let t = 0, n = 0; for (let j = i - 1; j <= i + 1; j++) if (vit[j] != null) { t += vit[j]; n++; } return t / n; });
  const arrivee = (de, a, pas) => {
    let pic = 0;
    for (let i = de; pas > 0 ? i <= a : i >= a; i += pas) {
      pic = Math.max(pic, vl[i]);
      if (pic > largE * 0.04 && vl[i] < pic * 0.4) return i;
    }
    return de;
  };
  let debut = arrivee(leve0, leve1, 1), fin = arrivee(leve1, leve0, -1);
  if (fin - debut < 3) { debut = leve0; fin = leve1; }
  // On retire aussi ce qui reste de la montée : le signe commence quand la main a fait au moins
  // la moitié du chemin entre sa position de repos et le point le plus haut qu'elle atteint.
  {
    const ys = s.slice(leve0, leve1 + 1).filter(Boolean).map(p => p.y);
    const repos = quantile(s.map(p => p?.y), 0.92), haut = Math.min(...ys);
    const seuil = repos - 0.5 * (repos - haut);
    let a = debut, b = fin;
    while (a < b && !(s[a] && s[a].y < seuil)) a++;
    while (b > a && !(s[b] && s[b].y < seuil)) b--;
    if (b - a >= 3) { debut = a; fin = b; }
  }

  // Forme de la main : vote sur les images où la main bouge peu (images nettes)
  const vote = (a, b) => {
    const compte = {};
    let n = 0;
    for (let i = a; i <= b; i++) {
      const fm = formeMain(frames[i]?.[`main${dom}3d`]);
      if (!fm) continue;
      const poids = vl[i] < largE * 0.03 ? 2 : 1;
      compte[fm] = (compte[fm] || 0) + poids; n += poids;
    }
    const [meilleure, score] = Object.entries(compte).sort((x, y) => y[1] - x[1])[0] || [null, 0];
    return { forme: meilleure, part: n ? score / n : 0 };
  };
  const quart = Math.max(2, Math.round((fin - debut) * 0.3));
  const fDebut = vote(debut, Math.min(fin, debut + quart)), fFin = vote(Math.max(debut, fin - quart), fin);
  const fTout = vote(debut, fin);
  const changement = fDebut.forme && fFin.forme && fDebut.forme !== fFin.forme && fDebut.part > 0.6 && fFin.part > 0.6;
  const forme = fTout.forme;
  // Taille de la main à l'image (en pixels) : en dessous de ~45 px, la forme n'est pas fiable
  const taillePx = mediane(frames.slice(debut, fin + 1).map(f => {
    const m = f[`main${dom}2d`];
    if (!m) return null;
    const xs = m.map(p => p.x * largeur), ys = m.map(p => p.y * hauteur);
    return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  })) || 0;
  // Image clé pour l'emplacement : le début du signe (là où la main se pose)
  let cle = debut;
  for (let i = debut; i <= Math.min(fin, debut + 3); i++) if (s[i] && frames[i].visage2d) { cle = i; break; }

  const traj = s.slice(debut, fin + 1).filter(Boolean);
  const mouvement = decrireMouvement(traj, largE);
  let deux = "";
  if (deuxMains) {
    const sa = series[autre].slice(debut, fin + 1).filter(Boolean);
    const mvtAutre = sa.length > 2 ? decrireMouvement(sa, largE) : { chemin: 0 };
    if (mvtAutre.chemin < 0.3) deux = "l'autre main reste immobile, elle sert de base";
    else {
      // mêmes directions horizontales = même sens ; directions opposées = en miroir
      let meme = 0, oppose = 0;
      for (let i = debut + 1; i <= fin; i++) {
        const a = series[dom][i], ap = series[dom][i - 1], b = series[autre][i], bp = series[autre][i - 1];
        if (!a || !ap || !b || !bp) continue;
        const ax = a.x - ap.x, bx = b.x - bp.x;
        if (Math.abs(ax) + Math.abs(bx) < largE * 0.01) continue;
        if (Math.sign(ax) === Math.sign(bx)) meme++; else oppose++;
      }
      deux = oppose > meme * 1.5 ? "les deux mains bougent en miroir" : meme > oppose * 1.5 ? "les deux mains bougent ensemble, dans le même sens" : "les deux mains bougent";
    }
  }

  return {
    mains: deuxMains ? "deux mains" : "une main",
    dominante: dom === "D" ? "droite" : "gauche",
    forme: changement ? `${fDebut.forme}, puis ${fFin.forme}` : forme || "forme non reconnue",
    formeSure: changement ? Math.min(fDebut.part, fFin.part) : fTout.part,
    taillePx: Math.round(taillePx),
    formeAutre: deuxMains ? formeMain(frames[cle][`main${autre}3d`]) : null,
    emplacementFin: s[fin] && fin - debut > 3 ? emplacement(frames[fin], s[fin], aspect, dom) : null,
    emplacement: s[cle] ? emplacement(frames[cle], s[cle], aspect, dom) : null,
    mouvement: mouvement.texte,
    deuxMains: deux || null,
    visage: decrireVisage(frames, debut, fin),
    imageCle: +(cle / res.fps).toFixed(2),
    tDebut: +(debut / res.fps).toFixed(2),
    tFin: +(fin / res.fps).toFixed(2)
  };
}

/** Analyse puis décrit la vidéo chargée dans l'élément <video>. */
export async function decrireVideo(video, { fps = 12, onProgression } = {}) {
  const res = await analyserVideo(video, { fps, onProgression });
  return { ...decrire(res), duree: +video.duration.toFixed(2) };
}
