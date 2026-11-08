-- Recipes the user wants on their shopping list (ingredients are aggregated at read time).
CREATE TABLE shopping_list (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_slug  text NOT NULL,
  servings     integer NOT NULL CHECK (servings BETWEEN 1 AND 100),
  added_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_slug)
);
