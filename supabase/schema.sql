-- =====================================================================
-- Signes en main : comptes en ligne (pseudo + mot de passe) et amis.
-- À coller UNE fois dans Supabase : « SQL Editor » > « New query » > Run.
-- (Le relancer ne casse rien : tout est écrit pour pouvoir être rejoué.)
--
-- Ce qui est enregistré :
--   comptes      pseudo, personnage et quelques chiffres (série, signes appris,
--                jours de travail) : c'est tout ce que voient les amis ;
--   sauvegardes  la progression complète, visible seulement par son propriétaire ;
--   amities      les demandes d'amis et les amitiés acceptées.
-- Aucun e-mail réel : l'identifiant de connexion est fabriqué à partir du pseudo.
--
-- Sécurité : la sécurité par ligne (RLS) est activée partout. Personne ne lit la
-- table d'un autre directement : tout passe par les fonctions ci-dessous, qui
-- vérifient qui appelle (auth.uid()).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.comptes (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null check (pseudo ~ '^[A-Za-z0-9_-]{3,20}$'),
  avatar jsonb not null default '{}'::jsonb,
  serie int not null default 0 check (serie between 0 and 100000),
  meilleure_serie int not null default 0 check (meilleure_serie between 0 and 100000),
  appris int not null default 0 check (appris between 0 and 100000),
  jours int not null default 0 check (jours between 0 and 100000),
  maj timestamptz not null default now(),
  cree timestamptz not null default now()
);
create unique index if not exists comptes_pseudo_unique on public.comptes (lower(pseudo));

create table if not exists public.sauvegardes (
  id uuid primary key references public.comptes (id) on delete cascade,
  donnees jsonb not null,
  maj timestamptz not null default now(),
  check (octet_length(donnees::text) < 1000000)
);

create table if not exists public.amities (
  demandeur uuid not null references public.comptes (id) on delete cascade,
  destinataire uuid not null references public.comptes (id) on delete cascade,
  statut text not null default 'attente' check (statut in ('attente', 'acceptee')),
  cree timestamptz not null default now(),
  primary key (demandeur, destinataire),
  check (demandeur <> destinataire)
);

alter table public.comptes enable row level security;
alter table public.sauvegardes enable row level security;
alter table public.amities enable row level security;

-- Chacun ne lit que sa propre ligne ; aucune écriture directe (fonctions seulement).
drop policy if exists "lire mon compte" on public.comptes;
create policy "lire mon compte" on public.comptes for select to authenticated using (id = auth.uid());
drop policy if exists "lire ma sauvegarde" on public.sauvegardes;
create policy "lire ma sauvegarde" on public.sauvegardes for select to authenticated using (id = auth.uid());
-- amities : aucune politique = aucun accès direct.

-- ---------------------------------------------------------------------
-- Fonctions appelées par le site
-- ---------------------------------------------------------------------

-- Le pseudo est-il libre ? (avant l'inscription, donc aussi sans être connecté)
create or replace function public.pseudo_libre(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select p ~ '^[A-Za-z0-9_-]{3,20}$' and not exists (select 1 from comptes where lower(pseudo) = lower(p));
$$;

-- Après l'inscription : crée la fiche du compte.
create or replace function public.creer_compte(p text, av jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  insert into comptes (id, pseudo, avatar) values (auth.uid(), p, coalesce(av, '{}'::jsonb))
  on conflict (id) do nothing;
end $$;

-- Ma fiche (pseudo, personnage, chiffres).
create or replace function public.mon_compte() returns setof public.comptes
language sql stable security definer set search_path = public as $$
  select * from comptes where id = auth.uid();
$$;

-- Met à jour mon personnage et mes chiffres (ce que voient mes amis).
create or replace function public.maj_compte(av jsonb, s int, ms int, a int, j int) returns void
language sql security definer set search_path = public as $$
  update comptes set avatar = coalesce(av, avatar), serie = greatest(0, s), meilleure_serie = greatest(0, ms),
    appris = greatest(0, a), jours = greatest(0, j), maj = now()
  where id = auth.uid();
$$;

-- Ma progression complète.
create or replace function public.sauver_progression(d jsonb) returns void
language sql security definer set search_path = public as $$
  insert into sauvegardes (id, donnees, maj) values (auth.uid(), d, now())
  on conflict (id) do update set donnees = excluded.donnees, maj = now();
$$;
create or replace function public.lire_progression() returns jsonb
language sql stable security definer set search_path = public as $$
  select donnees from sauvegardes where id = auth.uid();
$$;

-- Demander quelqu'un en ami par son pseudo exact.
-- Si cette personne m'avait déjà fait une demande, l'amitié est acceptée tout de suite.
create or replace function public.demander_ami(p text) returns text
language plpgsql security definer set search_path = public as $$
declare
  moi uuid := auth.uid();
  lui uuid;
begin
  if moi is null then raise exception 'non connecté'; end if;
  select id into lui from comptes where lower(pseudo) = lower(p);
  if lui is null then return 'inconnu'; end if;
  if lui = moi then return 'soi'; end if;
  if exists (select 1 from amities where demandeur = lui and destinataire = moi) then
    update amities set statut = 'acceptee' where demandeur = lui and destinataire = moi;
    return 'acceptee';
  end if;
  if exists (select 1 from amities where demandeur = moi and destinataire = lui) then return 'deja'; end if;
  if (select count(*) from amities where demandeur = moi and statut = 'attente') >= 50 then return 'trop'; end if;
  insert into amities (demandeur, destinataire) values (moi, lui);
  return 'envoyee';
end $$;

-- Accepter ou refuser une demande reçue.
create or replace function public.repondre_ami(autre uuid, accepter boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if accepter then
    update amities set statut = 'acceptee' where demandeur = autre and destinataire = auth.uid() and statut = 'attente';
  else
    delete from amities where demandeur = autre and destinataire = auth.uid() and statut = 'attente';
  end if;
end $$;

-- Retirer un ami, ou annuler une demande envoyée.
create or replace function public.retirer_ami(autre uuid) returns void
language sql security definer set search_path = public as $$
  delete from amities where (demandeur = auth.uid() and destinataire = autre) or (demandeur = autre and destinataire = auth.uid());
$$;

-- Mes amis et mes demandes. Les chiffres ne sont donnés que pour les amitiés acceptées.
create or replace function public.mes_amis()
returns table (id uuid, pseudo text, avatar jsonb, statut text, recue boolean,
               serie int, meilleure_serie int, appris int, jours int, maj timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, c.pseudo, c.avatar, a.statut, a.destinataire = auth.uid(),
    case when a.statut = 'acceptee' then c.serie end,
    case when a.statut = 'acceptee' then c.meilleure_serie end,
    case when a.statut = 'acceptee' then c.appris end,
    case when a.statut = 'acceptee' then c.jours end,
    case when a.statut = 'acceptee' then c.maj end
  from amities a
  join comptes c on c.id = case when a.demandeur = auth.uid() then a.destinataire else a.demandeur end
  where auth.uid() in (a.demandeur, a.destinataire)
  order by a.statut desc, lower(c.pseudo);
$$;

-- Supprimer mon compte et toutes mes données (fiche, progression, amitiés).
create or replace function public.supprimer_mon_compte() returns void
language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;

-- Droits : les fonctions sont réservées aux personnes connectées,
-- sauf pseudo_libre (utile avant l'inscription).
revoke all on function public.pseudo_libre(text), public.creer_compte(text, jsonb), public.mon_compte(),
  public.maj_compte(jsonb, int, int, int, int), public.sauver_progression(jsonb), public.lire_progression(),
  public.demander_ami(text), public.repondre_ami(uuid, boolean), public.retirer_ami(uuid), public.mes_amis(),
  public.supprimer_mon_compte() from public, anon;
grant execute on function public.pseudo_libre(text) to anon, authenticated;
grant execute on function public.creer_compte(text, jsonb), public.mon_compte(), public.maj_compte(jsonb, int, int, int, int),
  public.sauver_progression(jsonb), public.lire_progression(), public.demander_ami(text), public.repondre_ami(uuid, boolean),
  public.retirer_ami(uuid), public.mes_amis(), public.supprimer_mon_compte() to authenticated;
