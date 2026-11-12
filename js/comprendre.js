// Mini-leçons « Comprendre la LSF » : un peu de grammaire et de culture sourde.
//
// Chaque leçon est courte (2 à 3 minutes), illustrée par de vraies vidéos du dictionnaire,
// et se termine par quelques questions pour vérifier qu'on a compris.
// Blocs possibles :
//   { p: "texte" }                    paragraphe (HTML simple autorisé : <strong>, <em>)
//   { signes: ["Mot", ...], legende } vignettes vidéo à comparer ; un mot sans vidéo libre
//                                      devient un lien vers Elix (ex. : les nombres)
//   { phrase: { signes, roles, fr } } phrase jouée signe après signe, avec sa traduction
//   { astuce: "texte" }               encadré à retenir
//   { liens: [{ texte, url }] }       liens vers d'autres ressources
// Aucun geste n'est décrit de mémoire : quand un détail n'est pas sûr, on renvoie aux vidéos.

window.MINI_LECONS = [
  {
    id: "vraie-langue", type: "culture", niveau: 1, icone: "bulle", titre: "La LSF, une vraie langue",
    resume: "Pas du français mimé, et pas la même partout dans le monde.",
    blocs: [
      { p: "La langue des signes française (LSF) est une langue <strong>visuelle et gestuelle</strong>, avec son propre vocabulaire et sa propre grammaire. Ce n'est pas du français traduit mot à mot avec les mains : l'ordre des signes, la façon de poser une question ou de dire le temps sont différents." },
      { signes: ["LSF", "Langue", "Signer"], legende: "Trois signes pour en parler" },
      { p: "Elle n'est <strong>pas universelle</strong> : chaque pays a sa ou ses langues des signes. Les Anglais et les Américains parlent tous deux anglais, mais leurs langues des signes (BSL et ASL) sont très différentes. En revanche, l'ASL américaine est une cousine de la LSF : elle s'est construite au XIXᵉ siècle avec l'aide d'un enseignant sourd français, Laurent Clerc." },
      { astuce: "En France, la loi du 11 février 2005 reconnaît la LSF comme une « langue à part entière »." }
    ],
    quiz: [
      { q: "La langue des signes est-elle la même dans tous les pays ?", choix: ["Oui, elle est universelle", "Non, chaque pays a la sienne", "Seulement en Europe"], bonne: 1,
        pourquoi: "Chaque pays a sa ou ses langues des signes, nées dans ses communautés sourdes." },
      { q: "Signer, c'est…", choix: ["traduire le français mot à mot avec les mains", "parler une autre langue, avec sa propre grammaire", "mimer ce qu'on veut dire"], bonne: 1,
        pourquoi: "La LSF a son vocabulaire et sa grammaire, différents du français." },
      { q: "Quelle langue des signes est une cousine de la LSF ?", choix: ["La langue des signes britannique (BSL)", "La langue des signes américaine (ASL)", "Aucune"], bonne: 1,
        pourquoi: "L'ASL s'est développée avec l'aide de Laurent Clerc, enseignant sourd venu de Paris." }
    ]
  },
  {
    id: "visage", type: "grammaire", niveau: 1, icone: "sourire", titre: "Le visage parle aussi",
    resume: "Sourcils, regard, bouche : une partie de la grammaire est sur le visage.",
    blocs: [
      { p: "En LSF, les mains ne font pas tout. Les <strong>expressions du visage</strong> (sourcils, regard, bouche, joues) font partie de la langue : elles indiquent qu'on pose une question, qu'on dit non, ou que quelque chose est <em>très</em> grand ou <em>un peu</em> fatigué." },
      { signes: ["Content", "Triste", "Fatigué"], legende: "Regardez le visage autant que les mains" },
      { p: "Quand quelqu'un signe, on regarde son <strong>visage</strong>, pas ses mains : on voit très bien les mains du coin de l'œil. Et quand on signe soi-même, un visage figé rend le message difficile à comprendre, un peu comme une voix sans intonation." },
      { astuce: "N'ayez pas peur d'être expressif : en LSF, ce n'est pas exagérer, c'est parler correctement." }
    ],
    quiz: [
      { q: "Pendant une conversation en LSF, on regarde surtout…", choix: ["les mains", "le visage", "le sol, pour ne pas gêner"], bonne: 1,
        pourquoi: "On regarde le visage ; les mains restent visibles du coin de l'œil." },
      { q: "À quoi servent les expressions du visage en LSF ?", choix: ["À rien, c'est une habitude", "À la grammaire : question, négation, intensité…", "Seulement à montrer ses émotions"], bonne: 1,
        pourquoi: "Elles portent une partie de la grammaire, en plus des émotions." }
    ]
  },
  {
    id: "questions", type: "grammaire", niveau: 1, icone: "question", titre: "Poser une question",
    resume: "Le mot interrogatif à la fin, et les sourcils qui changent.",
    blocs: [
      { p: "Pour une <strong>question ouverte</strong> (qui, quoi, où, quand, pourquoi, comment, combien), le mot interrogatif se place souvent <strong>à la fin</strong> de la phrase, et les <strong>sourcils se froncent</strong>." },
      { phrase: { signes: ["Toi", "Habiter", "Où ?"], roles: ["qui", "action", "question"], fr: "Où habites-tu ?" } },
      { signes: ["Qui ?", "Où ?", "Quand ?", "Pourquoi ?"], legende: "Les mots interrogatifs" },
      { p: "Pour une <strong>question fermée</strong> (on répond par oui ou non), il n'y a pas de mot interrogatif : ce sont les <strong>sourcils levés</strong> et le regard posé sur la personne qui transforment la phrase en question. « Toi sourd » avec les sourcils levés veut dire « Tu es sourd ? »." },
      { astuce: "Question ouverte : sourcils froncés. Question oui/non : sourcils levés." }
    ],
    quiz: [
      { q: "Où se place souvent « Où ? » dans une question ?", choix: ["Au début", "À la fin", "N'importe où, sans importance"], bonne: 1,
        pourquoi: "Le mot interrogatif vient souvent à la fin : « Toi habiter où ? »." },
      { q: "Comment transforme-t-on « Toi sourd » en « Tu es sourd ? »", choix: ["En ajoutant le signe « Quoi ? »", "En levant les sourcils", "En signant plus vite"], bonne: 1,
        pourquoi: "Pour une question oui/non, ce sont les sourcils levés qui font la question." },
      { q: "Pour « Pourquoi pleures-tu ? », les sourcils sont plutôt…", choix: ["froncés", "levés", "immobiles"], bonne: 0,
        pourquoi: "C'est une question ouverte (pourquoi) : sourcils froncés." }
    ]
  },
  {
    id: "epeler-nom-signe", type: "culture", niveau: 1, icone: "alphabet", titre: "Épeler, et le « signe-nom »",
    resume: "Quand utiliser l'alphabet, et comment on reçoit son nom en signes.",
    blocs: [
      { p: "L'alphabet manuel (la <strong>dactylologie</strong>) sert surtout pour les <strong>noms propres</strong>, les mots qui n'ont pas encore de signe, ou pour demander « comment signe-t-on ce mot ? ». On n'épelle pas tout : ce serait aussi lent que d'écrire chaque mot lettre par lettre." },
      { signes: ["Dactylologie", "Prénom"], legende: "" },
      { p: "Dans la communauté sourde, chacun a un <strong>signe-nom</strong> : un signe qui le désigne, souvent inspiré d'un trait physique, d'une habitude ou du caractère. Il est <strong>donné par des personnes sourdes</strong> : on ne s'invente pas son propre signe-nom. En attendant, on épelle son prénom." },
      { liens: [{ texte: "Apprendre l'alphabet", url: "#/alphabet" }, { texte: "Épeler mon prénom", url: "#/entrainement/prenom" }] }
    ],
    quiz: [
      { q: "À quoi sert surtout l'alphabet manuel ?", choix: ["À tout dire, lettre par lettre", "Aux noms propres et aux mots sans signe", "Seulement aux enfants"], bonne: 1,
        pourquoi: "On épelle les noms propres et les mots qui n'ont pas de signe ; le reste se signe." },
      { q: "Qui choisit votre signe-nom ?", choix: ["Vous-même", "Des personnes sourdes qui vous connaissent", "Votre professeur, au premier cours"], bonne: 1,
        pourquoi: "Le signe-nom est donné par la communauté sourde, on ne se l'attribue pas." }
    ]
  },
  {
    id: "temps", type: "grammaire", niveau: 2, icone: "horloge", titre: "Dire quand",
    resume: "Les verbes ne se conjuguent pas : le temps se pose au début.",
    blocs: [
      { p: "En LSF, les verbes <strong>ne se conjuguent pas</strong>. Pour dire quand les choses se passent, on place un signe de temps <strong>au début</strong> de la phrase (hier, demain, ce soir…). Il vaut pour toute la suite, jusqu'à ce qu'on en change." },
      { phrase: { signes: ["Hier", "Cinéma", "Papa", "Aller"], roles: ["temps", "lieu", "qui", "action"], fr: "Hier, papa est allé au cinéma." } },
      { phrase: { signes: ["Demain", "Restaurant", "Moi", "Manger"], roles: ["temps", "lieu", "qui", "action"], fr: "Demain, je mange au restaurant." } },
      { p: "Remarquez : le signe « Aller » ou « Manger » ne change pas. Seul le premier signe dit si c'est passé ou à venir. Les signes de temps utilisent souvent une <strong>ligne du temps</strong> : le passé derrière soi, l'avenir devant." },
      { signes: ["Hier", "Aujourd'hui", "Demain"], legende: "Les repères de temps" },
      { astuce: "D'abord quand, puis où, puis qui, puis ce qui se passe." },
      { liens: [{ texte: "S'entraîner : construire une phrase", url: "#/entrainement/construire" }] }
    ],
    quiz: [
      { q: "Comment dit-on « j'ai mangé » plutôt que « je mange » ?", choix: ["On conjugue le signe « Manger »", "On ajoute un signe de temps au début, comme « Hier »", "On signe plus vite"], bonne: 1,
        pourquoi: "Le verbe ne change pas : c'est le signe de temps du début qui situe l'action." },
      { q: "Dans « Hier, papa est allé au cinéma », quel signe vient en premier ?", choix: ["Papa", "Cinéma", "Hier"], bonne: 2,
        pourquoi: "Le temps d'abord : Hier – Cinéma – Papa – Aller." }
    ]
  },
  {
    id: "negation", type: "grammaire", niveau: 2, icone: "pouce", titre: "Dire non",
    resume: "La tête qui dit non, et des verbes qui ont leur forme négative.",
    blocs: [
      { p: "Pour dire qu'on ne fait pas quelque chose, on peut ajouter le signe « Non » et, surtout, <strong>secouer la tête</strong> en même temps que la phrase : le visage dit déjà « non »." },
      { signes: ["Oui", "Non"], legende: "" },
      { p: "Certains verbes très courants ont leur <strong>propre forme négative</strong> : ce n'est pas le même signe, avec « pas » ajouté. Comparez les paires ci-dessous." },
      { signes: ["J'aime", "Je n'aime pas"], legende: "Aimer / ne pas aimer" },
      { signes: ["Je veux", "Je ne veux pas"], legende: "Vouloir / ne pas vouloir" },
      { signes: ["Je peux", "Je ne peux pas"], legende: "Pouvoir / ne pas pouvoir" },
      { phrase: { signes: ["Café", "Je n'aime pas"], roles: ["sujet", "avis"], fr: "Je n'aime pas le café." } },
      { astuce: "On nomme d'abord la chose, puis on donne son avis : « café, je n'aime pas »." }
    ],
    quiz: [
      { q: "« Je n'aime pas », c'est…", choix: ["le signe « J'aime » suivi de « Non »", "un signe à part, différent de « J'aime »", "le signe « J'aime » signé à l'envers"], bonne: 1,
        pourquoi: "Aimer, vouloir, pouvoir ont leur forme négative à eux." },
      { q: "Que fait souvent la tête dans une phrase négative ?", choix: ["Elle fait « non »", "Elle reste immobile", "Elle fait « oui »"], bonne: 0,
        pourquoi: "Le mouvement de tête « non » accompagne la négation." }
    ]
  },
  {
    id: "etre-articles", type: "grammaire", niveau: 2, icone: "eclair", titre: "Ni « être », ni « le, la, un »",
    resume: "Des phrases plus courtes qu'en français, et l'adjectif après.",
    blocs: [
      { p: "La LSF n'a <strong>pas de verbe « être »</strong> et <strong>pas d'articles</strong> (le, la, un, des). « Je suis sourd » se dit simplement « Moi sourd »." },
      { phrase: { signes: ["Moi", "Sourd"], roles: ["qui", "état"], fr: "Je suis sourd." } },
      { phrase: { signes: ["Papa", "Malade"], roles: ["qui", "état"], fr: "Papa est malade." } },
      { p: "L'<strong>adjectif vient après</strong> ce qu'il décrit : on montre d'abord la chose, puis on la précise." },
      { phrase: { signes: ["Voiture", "Rouge"], roles: ["chose", "qualité"], fr: "Une voiture rouge." } },
      { astuce: "Pensez « image » : d'abord l'objet, puis ses détails." }
    ],
    quiz: [
      { q: "Comment dit-on « Maman est contente » ?", choix: ["Maman – être – content", "Maman – content", "Content – maman – être"], bonne: 1,
        pourquoi: "Pas de verbe « être » : la personne, puis son état." },
      { q: "« Une voiture rouge » se signe…", choix: ["Rouge – voiture", "Voiture – rouge", "Une – voiture – rouge"], bonne: 1,
        pourquoi: "L'adjectif suit la chose, et il n'y a pas d'article." }
    ]
  },
  {
    id: "culture-sourde", type: "culture", niveau: 2, icone: "main", titre: "Les bons réflexes",
    resume: "Attirer l'attention, applaudir, les mots à éviter.",
    blocs: [
      { p: "Beaucoup de personnes sourdes se reconnaissent dans une <strong>communauté</strong> avec sa langue et sa culture. On écrit parfois « Sourd » avec une majuscule pour parler de cette identité." },
      { signes: ["Sourd", "Entendant", "Communauté"], legende: "" },
      { p: "<strong>Attirer l'attention</strong> : on tape doucement sur l'épaule ou le bras, on fait un signe de la main dans le champ de vision de la personne, ou, pour un groupe, on allume et éteint la lumière. Taper sur la table fonctionne aussi : les vibrations se sentent." },
      { p: "<strong>Applaudir</strong> : on lève les mains et on les agite en l'air. C'est un applaudissement qui se voit au lieu de s'entendre." },
      { p: "<strong>Le mot à éviter</strong> : « sourd-muet ». Les personnes sourdes ont une voix et une langue ; ce mot est vécu comme vexant. On dit simplement « sourd » ou « sourde »." },
      { astuce: "Lire sur les lèvres ne permet de saisir qu'une petite partie de ce qui est dit : face à une personne sourde, ne cachez pas votre bouche et restez face à elle, mais ne comptez pas seulement là-dessus." }
    ],
    quiz: [
      { q: "Comment attirer l'attention d'une personne sourde ?", choix: ["Crier plus fort", "Taper doucement sur son épaule ou faire signe dans son champ de vision", "Attendre qu'elle se retourne"], bonne: 1,
        pourquoi: "Un geste doux ou un signe visible : c'est l'usage." },
      { q: "Comment applaudit-on en culture sourde ?", choix: ["En tapant très fort dans ses mains", "En agitant les mains levées", "En tapant du pied"], bonne: 1,
        pourquoi: "Les applaudissements se voient : mains levées qui s'agitent." },
      { q: "Quel mot vaut-il mieux éviter ?", choix: ["Sourd", "Sourd-muet", "Entendant"], bonne: 1,
        pourquoi: "« Sourd-muet » est inexact et vécu comme vexant." }
    ]
  },
  {
    id: "pluriel", type: "grammaire", niveau: 3, icone: "famille", titre: "Le pluriel",
    resume: "Pas de « s » : on montre la quantité autrement.",
    blocs: [
      { p: "En LSF, il n'y a pas de « s » du pluriel. Pour dire qu'il y en a plusieurs, on peut ajouter un <strong>signe de quantité</strong> :" },
      { signes: ["Beaucoup", "Plusieurs", "Nombreux"], legende: "" },
      { p: "On peut aussi <strong>répéter</strong> certains signes à différents endroits de l'espace : signer « arbre » plusieurs fois en se déplaçant sur le côté montre une rangée d'arbres. Et souvent, c'est simplement le <strong>contexte</strong> qui dit s'il y en a un ou plusieurs." },
      { signes: ["Arbre"], legende: "Un signe qu'on peut répéter pour en montrer plusieurs" },
      { astuce: "Le pluriel se voit : quantité, répétition, ou contexte." }
    ],
    quiz: [
      { q: "Comment marque-t-on le pluriel en LSF ?", choix: ["Avec la lettre S de l'alphabet", "Avec un signe de quantité, une répétition, ou le contexte", "On ne peut pas"], bonne: 1,
        pourquoi: "Pas de « s » : la quantité se montre par d'autres moyens." },
      { q: "Signer « arbre » plusieurs fois en se déplaçant sur le côté veut dire…", choix: ["un très grand arbre", "une rangée d'arbres", "un arbre qui bouge"], bonne: 1,
        pourquoi: "La répétition à différents endroits montre plusieurs arbres." }
    ]
  },
  {
    id: "espace", type: "grammaire", niveau: 3, icone: "cible", titre: "L'espace devant soi",
    resume: "Pointer pour dire « je, tu, il », et placer les choses autour de soi.",
    blocs: [
      { p: "Les <strong>pronoms</strong> se font en pointant : vers soi pour « moi », vers la personne en face pour « toi », vers quelqu'un (ou un endroit) pour « il » ou « elle »." },
      { signes: ["Moi", "Toi", "Nous", "Vous", "Eux"], legende: "Les pronoms" },
      { p: "Quand on raconte une histoire, on <strong>place</strong> les personnes et les objets à des endroits de l'espace devant soi : Marie à gauche, Paul à droite. Ensuite, il suffit de pointer vers cet endroit pour parler d'eux, sans répéter leur nom." },
      { p: "Certains verbes se déplacent d'un point à l'autre : leur <strong>direction</strong> dit qui fait l'action et pour qui (« je te donne », « tu me donnes »)." },
      { astuce: "L'espace devant vous est une scène : ce que vous y placez y reste pendant toute la conversation." }
    ],
    quiz: [
      { q: "Comment dit-on « toi » en LSF ?", choix: ["En épelant T-O-I", "En pointant vers la personne", "En pointant vers soi"], bonne: 1,
        pourquoi: "Les pronoms se font en pointant." },
      { q: "On a placé « Paul » à droite. Pour reparler de lui ensuite…", choix: ["on pointe vers la droite", "on épelle P-A-U-L à chaque fois", "on le place à gauche"], bonne: 0,
        pourquoi: "Une fois placé, on y revient en pointant vers son endroit." }
    ]
  },
  {
    id: "histoire", type: "culture", niveau: 3, icone: "livre", titre: "Un peu d'histoire",
    resume: "De l'abbé de l'Épée à la reconnaissance de 2005.",
    blocs: [
      { signes: ["Histoire", "École", "LSF"], legende: "" },
      { p: "<strong>XVIIIᵉ siècle</strong> — À Paris, l'abbé Charles-Michel de l'Épée s'intéresse aux signes qu'utilisent des personnes sourdes et ouvre l'une des premières écoles pour enfants sourds, où l'on enseigne en signes." },
      { p: "<strong>1817</strong> — Laurent Clerc, enseignant sourd formé à Paris, part aux États-Unis et y fonde avec Thomas Gallaudet la première école américaine pour sourds. C'est pourquoi la langue des signes américaine ressemble à la LSF." },
      { p: "<strong>1880</strong> — Au congrès de Milan, des enseignants entendants décident de privilégier l'oral. Pendant près d'un siècle, les langues des signes sont écartées des écoles, et les enfants sourds souvent punis s'ils signent." },
      { p: "<strong>Années 1970-1980</strong> — C'est le « Réveil sourd » : la communauté sourde revendique sa langue et sa culture, et la LSF revient au grand jour." },
      { p: "<strong>2005</strong> — La loi reconnaît la LSF comme une langue à part entière. On peut aujourd'hui l'apprendre à l'école, la passer au baccalauréat, et des interprètes la traduisent à la télévision." }
    ],
    quiz: [
      { q: "Que s'est-il passé au congrès de Milan, en 1880 ?", choix: ["La LSF a été reconnue", "On a décidé de privilégier l'oral et d'écarter les signes des écoles", "La première école pour sourds a ouvert"], bonne: 1,
        pourquoi: "Milan 1880 a ouvert près d'un siècle d'interdiction des signes à l'école." },
      { q: "Depuis quand la loi reconnaît-elle la LSF comme une langue à part entière ?", choix: ["1817", "1880", "2005"], bonne: 2,
        pourquoi: "C'est la loi du 11 février 2005." }
    ]
  },
  {
    id: "nombres", type: "grammaire", niveau: 3, icone: "chrono", titre: "Les nombres",
    resume: "Où les voir, et comment ils se combinent avec d'autres signes.",
    blocs: [
      { p: "Les nombres ont leurs <strong>propres signes</strong>, faits principalement avec la main dominante. Ils se combinent souvent avec d'autres signes : l'âge, l'heure ou une durée peuvent se dire en un seul signe qui contient le nombre." },
      { p: "Il n'existe pas encore de vidéos <strong>sous licence libre</strong> des nombres en LSF, et ce site ne montre que des vidéos libres et vérifiées. Plutôt que de vous montrer des gestes au hasard, voici où les voir signés par des personnes sourdes :" },
      { signes: ["Zéro", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf", "Dix"], legende: "Les nombres de 0 à 10, sur le dictionnaire Elix" },
      { signes: ["Combien", "Beaucoup"], legende: "Pour parler de quantités, déjà dans le dictionnaire" },
      { liens: [{ texte: "Les nombres sur Spread The Sign", url: "https://www.spreadthesign.com/fr.fr/search/?q=nombre" }] },
      { astuce: "Dès que des vidéos libres des nombres seront publiées (par exemple sur Lingua Libre), elles apparaîtront ici automatiquement à la place des liens." }
    ],
    quiz: [
      { q: "Les nombres peuvent-ils se combiner avec d'autres signes ?", choix: ["Non, jamais", "Oui, par exemple pour l'âge, l'heure ou une durée", "Seulement à l'écrit"], bonne: 1,
        pourquoi: "Un seul signe peut contenir à la fois le nombre et ce qu'on compte." }
    ]
  }
];

// ---------------------------------------------------------------------
// Pages « Comprendre la LSF »
// ---------------------------------------------------------------------
const COULEURS_LECONS = { grammaire: "#3a6ea5", culture: "#b5753f" };
const NOMS_TYPES = { grammaire: "Grammaire", culture: "Culture sourde" };
const miniLecon = id => MINI_LECONS.find(l => l.id === id);

/** Pour les tests : tous les signes cités par les mini-leçons (hors liens assumés vers Elix). */
function signesDesLecons() {
  return MINI_LECONS.flatMap(l => l.blocs.flatMap(b => [...(b.signes || []), ...(b.phrase ? b.phrase.signes : [])]));
}

function carteLecon(l) {
  const lue = Records.leconFaite(l.id);
  return `
    <a class="carte carte-lecon ${lue ? "lue" : ""}" href="#/comprendre/${l.id}" style="--c:${COULEURS_LECONS[l.type]}">
      <span class="carte-icone">${icone(lue ? "coche" : l.icone)}</span>
      <span class="surtitre">${NOMS_TYPES[l.type]}</span>
      <span class="carte-titre">${echapper(l.titre)}</span>
      <span class="petit">${echapper(l.resume)}</span>
      <span class="petit etat-lecon">${lue ? "✓ Lue" : "2 à 3 minutes"}</span>
    </a>`;
}

function pageComprendre(id) {
  if (id) return pageMiniLecon(id);
  const lues = MINI_LECONS.filter(l => Records.leconFaite(l.id)).length;
  app.innerHTML = `
    <h1>Comprendre la LSF</h1>
    <p class="hero-sous">De courtes leçons pour comprendre comment fonctionne la langue (ordre des signes, questions,
      négation, espace…) et connaître la culture sourde. Chacune se termine par quelques questions.</p>
    <p class="petit">${lues} leçon(s) lue(s) sur ${MINI_LECONS.length}</p>
    ${Object.entries(NIVEAUX).map(([n, nom]) => `
      <section>
        <h2>Unité ${n} · ${nom}</h2>
        <div class="grille">${MINI_LECONS.filter(l => String(l.niveau) === n).map(carteLecon).join("")}</div>
      </section>`).join("")}`;
}

/** Vignette d'un signe : vidéo du dictionnaire, ou lien vers Elix s'il n'y a pas de vidéo libre. */
function vignetteSigne(mot) {
  const e = Dico.trouver(mot);
  if (!e) return `
    <a class="vignette-signe sans-video" href="https://dico.elix-lsf.fr/dictionnaire/${encodeURIComponent(mot.toLowerCase())}" target="_blank" rel="noopener">
      <span class="sans-video-mot">${echapper(mot)}</span><span class="petit">Voir sur Elix ↗</span></a>`;
  const v = e.videos[0];
  return `
    <a class="vignette-signe" href="#/mot/${encodeURIComponent(e.k)}">
      <video muted loop playsinline preload="metadata" data-page="${echapper(v.page)}" aria-hidden="true">${sourcesVideo(v.url)}</video>
      <span class="vignette-mot">${echapper(e.mot)}</span></a>`;
}

function htmlBloc(b, i) {
  if (b.p) return `<p>${b.p}</p>`;
  if (b.astuce) return `<p class="astuce"><strong>À retenir</strong>${echapper(b.astuce)}</p>`;
  if (b.liens) return `<p class="liens-lecon">${b.liens.map(l => /^https?:/.test(l.url)
    ? `<a class="btn btn-second" href="${l.url}" target="_blank" rel="noopener">${echapper(l.texte)} ↗</a>`
    : `<a class="btn btn-second" href="${l.url}">${echapper(l.texte)}</a>`).join("")}</p>`;
  if (b.signes) return `
    <figure class="bloc-signes">
      <div class="vignettes">${b.signes.map(vignetteSigne).join("")}</div>
      ${b.legende ? `<figcaption class="petit">${echapper(b.legende)}</figcaption>` : ""}
    </figure>`;
  if (b.phrase) return `
    <figure class="bloc-phrase">
      <div class="zone-phrase" data-bloc="${i}"><button class="btn btn-second lancer-phrase">▶ Voir la phrase en LSF</button></div>
      <figcaption><span class="phrase-fr">« ${echapper(b.phrase.fr)} »</span>${htmlGloses(b.phrase)}</figcaption>
    </figure>`;
  return "";
}

function pageMiniLecon(id) {
  const l = miniLecon(id);
  if (!l) return page404();
  const n = MINI_LECONS.indexOf(l), suivante = MINI_LECONS[n + 1];
  const quiz = l.quiz.map(q => ({ ...q, ordre: melanger(q.choix.map((_, i) => i)) }));
  app.innerHTML = `
    <a class="retour" href="#/comprendre">← Comprendre la LSF</a>
    <article class="lecon" style="--c:${COULEURS_LECONS[l.type]}">
      <span class="surtitre">${NOMS_TYPES[l.type]} · Unité ${l.niveau}</span>
      <h1 class="titre-icone"><span class="carte-icone">${icone(l.icone)}</span>${echapper(l.titre)}</h1>
      <p class="hero-sous">${echapper(l.resume)}</p>
      ${l.blocs.map(htmlBloc).join("")}
      <section class="verifier-lecon" aria-labelledby="titre-verifier">
        <h2 id="titre-verifier">Vérifiez que c'est clair</h2>
        ${quiz.map((q, qi) => `
          <fieldset class="question-lecon" data-q="${qi}">
            <legend>${echapper(q.q)}</legend>
            <div class="choix-lecon">${q.ordre.map(c => `<button class="btn-choix" data-c="${c}">${echapper(q.choix[c])}</button>`).join("")}</div>
            <p class="pourquoi" role="status" aria-live="polite"></p>
          </fieldset>`).join("")}
        <div id="fin-lecon"></div>
      </section>
    </article>`;

  // vidéos : lues seulement quand elles sont visibles (une leçon peut en contenir beaucoup)
  const obs = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(x => {
    if (x.isIntersecting) x.target.play().catch(() => {}); else x.target.pause();
  }), { threshold: .4 }) : null;
  app.querySelectorAll(".vignette-signe video").forEach(v => obs ? obs.observe(v) : v.play().catch(() => {}));
  if (obs) surNettoyage(() => obs.disconnect());

  app.querySelectorAll(".lancer-phrase").forEach(b => (b.onclick = () => {
    const zone = b.parentElement;
    lecteurPhrase(zone, l.blocs[+zone.dataset.bloc].phrase, { boucle: false });
  }));

  let bonnes = 0, repondues = 0;
  app.querySelectorAll(".question-lecon").forEach(f => {
    const q = quiz[+f.dataset.q];
    f.querySelectorAll("[data-c]").forEach(b => (b.onclick = () => {
      const juste = +b.dataset.c === q.bonne;
      f.querySelectorAll("[data-c]").forEach(x => {
        x.disabled = true;
        if (+x.dataset.c === q.bonne) x.classList.add("juste"); else if (x === b) x.classList.add("faux");
      });
      f.querySelector(".pourquoi").innerHTML = `<strong>${juste ? "Exact." : "Pas tout à fait."}</strong> ${echapper(q.pourquoi)}`;
      bonnes += juste; repondues++;
      if (repondues < quiz.length) return;
      Records.noterLecon(l.id); Progression.activite(); majCompteurs();
      document.getElementById("fin-lecon").innerHTML = `
        <div class="fin-lecon">
          <strong>${bonnes === quiz.length ? "Parfait, leçon terminée !" : `Leçon terminée : ${bonnes} / ${quiz.length}`}</strong>
          ${bonnes < quiz.length ? `<span class="petit">Relisez la partie concernée si besoin, puis passez à la suite.</span>` : ""}
          <div class="hero-actions">
            ${suivante ? `<a class="btn" href="#/comprendre/${suivante.id}">Leçon suivante : ${echapper(suivante.titre)}</a>` : ""}
            <a class="btn btn-second" href="#/comprendre">Toutes les leçons</a>
          </div>
        </div>`;
    }));
  });
}
