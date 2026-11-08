-- Users and money only. Recipes live in git (content/recipes).
CREATE TABLE users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL UNIQUE,            -- E.164, e.g. +989123456789
  name        text,
  role        text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE otp_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        text NOT NULL,
  code_hash    text NOT NULL,                  -- HMAC, never the code itself
  expires_at   timestamptz NOT NULL,
  attempts     integer NOT NULL DEFAULT 0,
  consumed_at  timestamptz,
  ip           text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_phone_created_idx ON otp_requests (phone, created_at DESC);
CREATE INDEX otp_ip_created_idx ON otp_requests (ip, created_at DESC);

CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,            -- sha256 of the cookie value
  expires_at  timestamptz NOT NULL,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

-- Money is stored in Rial integers.
CREATE TABLE payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id),
  plan_key     text NOT NULL,
  provider     text NOT NULL,
  amount_irr   bigint NOT NULL CHECK (amount_irr > 0),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  authority    text NOT NULL UNIQUE,           -- idempotency key for verification
  ref_id       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  verified_at  timestamptz
);
CREATE INDEX payments_user_idx ON payments (user_id, created_at DESC);

-- Prepaid time, no auto-renew. One row per purchased period.
CREATE TABLE subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  plan_key      text NOT NULL,
  period_start  timestamptz NOT NULL,
  period_end    timestamptz NOT NULL,
  source        text NOT NULL DEFAULT 'payment',
  payment_id    uuid UNIQUE REFERENCES payments(id),   -- one subscription per payment
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_end_idx ON subscriptions (user_id, period_end DESC);

CREATE TABLE favorites (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_slug  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_slug)
);

CREATE TABLE cooked_log (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_slug  text NOT NULL,
  at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cooked_user_at_idx ON cooked_log (user_id, at DESC);

-- First-party analytics (no third-party scripts).
CREATE TABLE events (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  user_id     uuid,
  recipe_slug text,
  props       jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_name_created_idx ON events (name, created_at DESC);
