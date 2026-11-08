import { z } from "zod";

/**
 * One recipe = one validated file in content/recipes/. This mirrors
 * docs/recipe-guide/README.md section 4 and docs/app-guide/README.md section 3.2.
 * Structural checks live here; the recipe-guide rules (tips count, digits,
 * ZWNJ ...) live in rules.ts.
 */

export const CATEGORIES = [
  "main",
  "stew",
  "rice",
  "soup",
  "sauce",
  "appetizer",
  "dessert",
  "street-food",
] as const;
export const OCCASIONS = [
  "daily",
  "guests",
  "nowruz",
  "yalda",
  "ramadan",
  "nazri",
] as const;
export const UNITS = [
  "g",
  "ml",
  "tsp",
  "tbsp",
  "cup",
  "piece",
  "clove",
  "bunch",
  "pinch",
] as const;
export const HEATS = ["low", "medium-low", "medium", "high"] as const;
export const TIP_KINDS = ["نکته", "مهم", "یادت باشد", "احتیاط"] as const;

const minutes = z.union([
  z.number().positive(),
  z.tuple([z.number().positive(), z.number().positive()]),
]);

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be #rrggbb");

export const tipSchema = z.object({
  kind: z.enum(TIP_KINDS),
  title: z.string().min(1).optional(),
  text: z.string().min(1),
});

export const ingredientSchema = z.object({
  name: z.string().min(1),
  amount: z
    .union([
      z.number().positive(),
      z.tuple([z.number().positive(), z.number().positive()]),
    ])
    .optional(),
  approx: z.boolean().optional(),
  toTaste: z.boolean().optional(),
  unit: z.enum(UNITS).optional(),
  household: z.string().min(1).optional(),
  note: z.string().min(1).optional(),
  optional: z.boolean().optional(),
  scalable: z.boolean().optional(),
});

export const actionSchema = z.object({
  text: z.string().min(1),
  heat: z.enum(HEATS).optional(),
  minutes: minutes.optional(),
  cue: z.string().min(1).optional(),
  sub: z
    .array(
      z.object({
        label: z.string().min(1).optional(),
        text: z.string().min(1),
        minutes: z.tuple([z.number().positive(), z.number().positive()]).optional(),
      }),
    )
    .optional(),
});

export const stageSchema = z.object({
  title: z.string().min(1),
  actions: z.array(actionSchema).min(1),
  tip: tipSchema.optional(),
  note: z.string().min(1).optional(),
});

export const recipeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ascii kebab-case"),
  access: z.enum(["free", "premium"]),
  status: z.enum(["draft", "review", "published"]).default("published"),
  title: z.string().min(1),
  altTitle: z.string().min(1).optional(),
  category: z.enum(CATEGORIES),
  region: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)),
  occasion: z.array(z.enum(OCCASIONS)).optional(),
  kidFriendly: z.boolean().optional(),
  makeAhead: z.string().min(1).optional(),
  summary: z.string().min(1),
  accent: z.object({ accent: hex, soft: hex, line: hex }),
  image: z.object({ src: z.string(), alt: z.string() }).optional(),

  facts: z.object({
    servings: z.number().int().positive(),
    servingsNote: z.string().min(1).optional(),
    totalMinutes: minutes,
    approxTime: z.boolean().optional(),
    activeMinutes: z.number().positive().optional(),
    extraTime: z
      .array(z.object({ label: z.string().min(1), minutes: minutes }))
      .optional(),
    portion: z.string().min(1).optional(),
    shelfLife: z.string().min(1).optional(),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  }),

  ingredients: z
    .array(
      z.object({
        group: z.string().min(1).optional(),
        items: z.array(ingredientSchema).min(1),
      }),
    )
    .min(1),

  tools: z.array(z.string().min(1)).optional(),
  servedWith: z.array(z.string().min(1)).optional(),
  chooseTip: tipSchema.optional(),

  stages: z.array(stageSchema).min(1),
  extraTable: z
    .object({
      title: z.string().min(1),
      columns: z.array(z.string().min(1)).min(2),
      rows: z.array(z.array(z.string().min(1))).min(1),
      tip: tipSchema.optional(),
    })
    .optional(),
  mistakes: z.array(z.object({ problem: z.string().min(1), fix: z.string().min(1) })),
  storage: z.object({
    fridgeDays: z.number().positive().optional(),
    freezerDays: z.number().positive().optional(),
    freezable: z.boolean().optional(),
    lines: z.array(z.string().min(1)).min(1),
    variations: z
      .array(z.object({ title: z.string().min(1), text: z.string().min(1) }))
      .optional(),
  }),
  closing: z.string().min(1),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeInput = z.input<typeof recipeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type Stage = z.infer<typeof stageSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Tip = z.infer<typeof tipSchema>;
export type Category = (typeof CATEGORIES)[number];
export type Occasion = (typeof OCCASIONS)[number];

/** Type-checks a recipe file and applies defaults. Throws on structural errors so `next build` fails. */
export function defineRecipe(input: RecipeInput): Recipe {
  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) {
    const slug = (input as { slug?: string }).slug ?? "?";
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid recipe "${slug}":\n${issues}`);
  }
  return parsed.data;
}
