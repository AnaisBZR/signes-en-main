// Tests des mini-leçons « Comprendre la LSF ».
const test = require("node:test");
const assert = require("node:assert/strict");
const { chargerSite } = require("./charger");

const site = chargerSite();
const { MINI_LECONS, Dico } = site;

test("chaque mini-leçon est complète, avec un identifiant unique", () => {
  assert.ok(MINI_LECONS.length >= 10);
  assert.equal(new Set(MINI_LECONS.map(l => l.id)).size, MINI_LECONS.length);
  for (const l of MINI_LECONS) {
    assert.match(l.id, /^[a-z0-9-]{1,40}$/);
    assert.ok(["grammaire", "culture"].includes(l.type), l.id);
    assert.ok([1, 2, 3].includes(l.niveau), l.id);
    assert.ok(l.titre && l.resume && l.blocs.length, l.id);
    assert.ok(l.quiz.length >= 1, `${l.id} : au moins une question`);
    for (const q of l.quiz) {
      assert.ok(q.choix.length >= 2 && q.bonne >= 0 && q.bonne < q.choix.length, `${l.id} : ${q.q}`);
      assert.equal(new Set(q.choix).size, q.choix.length, `${l.id} : choix en double`);
      assert.ok(q.pourquoi, `${l.id} : explication manquante`);
    }
  }
});

test("les signes montrés dans les leçons ont tous une vraie vidéo (sauf les nombres, renvoyés vers Elix)", () => {
  for (const l of MINI_LECONS) for (const b of l.blocs) {
    for (const s of b.phrase ? b.phrase.signes : []) assert.ok(Dico.trouver(s), `${l.id} : « ${s} » (phrase) introuvable`);
    if (b.phrase) assert.equal(b.phrase.signes.length, b.phrase.roles.length, `${l.id} : un rôle par signe`);
    if (l.id === "nombres") continue;
    for (const s of b.signes || []) assert.ok(Dico.trouver(s), `${l.id} : « ${s} » introuvable dans le dictionnaire`);
  }
});

test("les mini-leçons lues sont retenues, sauvegardées et fusionnées", () => {
  const a = chargerSite();
  assert.equal(a.Records.leconFaite("visage"), false);
  a.Records.noterLecon("visage");
  assert.equal(a.Records.leconFaite("visage"), true);
  const s = JSON.parse(JSON.stringify(a.Sauvegarde.creer()));
  const b = chargerSite();
  b.Records.noterLecon("histoire");
  b.Sauvegarde.restaurer(s, "fusionner");
  assert.ok(b.Records.leconFaite("visage") && b.Records.leconFaite("histoire"));
  assert.deepEqual(b.Records.verifier({ meilleurs: {}, defis: {}, lecons: { "<script>": "2026-01-01", ok: "pas une date", visage: "2026-01-02" } }).lecons,
    { visage: "2026-01-02" });
});
