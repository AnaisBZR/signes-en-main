# Comptes en ligne et amis : mise en place de Supabase

Le site garde tout dans le navigateur. Pour se connecter avec un pseudo depuis
n'importe quel appareil et avoir des amis, il utilise un projet **Supabase**
(gratuit pour un petit site). Tant que le projet n'est pas renseigné dans le site,
la connexion et les amis restent cachés.

## 1. Créer le projet (à faire vous-même)

1. Créez un compte sur <https://supabase.com>, puis un **nouveau projet**
   (région Europe, par exemple Paris ou Francfort). Le mot de passe de la base
   demandé à ce moment-là reste pour vous : le site n'en a pas besoin.
2. Dans le projet : **SQL Editor** > **New query**, collez tout le contenu de
   `supabase/schema.sql`, puis **Run**. Le relancer plus tard ne casse rien.
3. **Authentication** > **Sign In / Providers** > **Email** :
   - laissez **Email** activé ;
   - **désactivez « Confirm email »** (les identifiants sont fabriqués à partir
     du pseudo : aucun e-mail ne peut être reçu).
4. **Project Settings** > **API** (ou **API Keys**) : notez
   - l'**URL du projet** (`https://xxxx.supabase.co`) ;
   - la clé **publique** : « anon public » ou « publishable » (`sb_publishable_…`).

   Ne donnez jamais la clé **service_role** / **secret** : elle ouvre toute la base.

## 2. Brancher le site

Dans `js/signalements.js`, renseignez `CONFIG_SITE.supabase` :

```js
supabase: { url: "https://xxxx.supabase.co", cle: "la clé publique", domaine: "pseudo.signes-en-main.invalid" }
```

La clé publique est faite pour être dans le site : ce sont les règles de
`schema.sql` (sécurité par ligne et fonctions) qui protègent les données.

## Ce qui est enregistré en ligne

- **comptes** : pseudo, personnage et quelques chiffres (série, meilleure série,
  signes appris, jours de travail). C'est tout ce que voient les amis.
- **sauvegardes** : la progression complète, visible seulement par son propriétaire.
- **amities** : demandes d'amis et amitiés acceptées.

Chacun peut supprimer son compte (page « Mon profil » > « Mot de passe et compte ») :
le compte, la progression en ligne et les amitiés sont effacés.

Sans adresse e-mail, un mot de passe oublié ne peut pas être réinitialisé
automatiquement. En dépannage, vous pouvez le changer depuis le tableau de bord
Supabase (**Authentication** > **Users**).
