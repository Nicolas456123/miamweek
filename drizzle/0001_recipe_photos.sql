-- Migration Drizzle : ajoute photo_url + photo_credit aux recettes.
--
-- À exécuter dans Turso une fois (via `drizzle-kit push` ou directement) :
--
--   turso db shell <ta-db> < drizzle/0001_recipe_photos.sql
--
-- La nouvelle colonne `photo_url` stocke l'URL renvoyée par /api/photo (Pexels).
-- `photo_credit` permet d'afficher le nom du photographe (Pexels exige l'attribution).

ALTER TABLE recipes ADD COLUMN photo_url TEXT;
ALTER TABLE recipes ADD COLUMN photo_credit TEXT;
