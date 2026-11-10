-- Recipes the site serves. The whole validated recipe is stored as jsonb and parsed with the Zod
-- schema on read. Authored in content/recipes/*.ts and pushed with `npm run recipes:push`.
CREATE TABLE recipes (
  slug        text PRIMARY KEY,
  status      text NOT NULL,
  access      text NOT NULL,
  data        jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
