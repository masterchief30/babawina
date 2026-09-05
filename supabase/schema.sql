-- BabaWina public schema
-- Live dump exported 2026-09-05T08:34:03+00:00
-- Structure only. No row data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Enums
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.competition_status AS ENUM ('draft', 'live', 'closed', 'judged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.processing_status AS ENUM (
    'idle', 'processing', 'ready', 'needs_review', 'ready_for_ai', 'coords_saved'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role public.user_role DEFAULT 'user'::public.user_role,
  created_at timestamptz DEFAULT now(),
  stripe_customer_id text UNIQUE
);

CREATE TABLE IF NOT EXISTS public.competitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  prize_short text NOT NULL,
  prize_value_rand integer NOT NULL,
  entry_price_rand integer NOT NULL,
  image_raw_path text,
  image_mask_path text,
  image_inpainted_path text,
  status public.competition_status DEFAULT 'draft'::public.competition_status,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  judged_x double precision,
  judged_y double precision,
  detect_confidence double precision,
  image_width integer,
  image_height integer,
  processing_status public.processing_status DEFAULT 'idle'::public.processing_status,
  created_at timestamptz DEFAULT now(),
  normalized_width integer DEFAULT 960,
  normalized_height integer DEFAULT 540,
  judged_u double precision,
  judged_v double precision,
  per_user_entry_limit integer DEFAULT 1,
  image_normalized_path text,
  raw_image_width integer,
  raw_image_height integer,
  norm_scale_x double precision,
  norm_scale_y double precision,
  norm_offset_x double precision,
  norm_offset_y double precision,
  judged_x_norm double precision,
  judged_y_norm double precision,
  display_photo_path text,
  display_photo_alt text
);

CREATE TABLE IF NOT EXISTS public.daily_visit_counter (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL UNIQUE,
  visit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  x double precision NOT NULL,
  y double precision NOT NULL,
  distance double precision,
  created_at timestamptz DEFAULT now(),
  ip_hash text NOT NULL,
  u double precision,
  v double precision,
  UNIQUE (competition_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id text,
  amount_cents integer NOT NULL,
  currency text DEFAULT 'ZAR',
  status text NOT NULL DEFAULT 'pending',
  payment_method_id uuid REFERENCES public.user_payment_methods(id) ON DELETE SET NULL,
  entries_purchased integer DEFAULT 1,
  was_free boolean DEFAULT false,
  stripe_receipt_url text,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  amount_rand numeric(10,2) DEFAULT 0,
  CONSTRAINT valid_status CHECK (
    status = ANY (ARRAY['pending','processing','succeeded','failed','refunded','canceled'])
  )
);

CREATE TABLE IF NOT EXISTS public.competition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guess_x numeric(8,5) NOT NULL,
  guess_y numeric(8,5) NOT NULL,
  entry_price_paid integer NOT NULL,
  entry_number integer NOT NULL,
  distance_to_ball numeric(10,5),
  is_winner boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  was_free_entry boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.pending_bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_token text NOT NULL,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  competition_title text NOT NULL,
  prize_short text NOT NULL,
  entry_price integer NOT NULL,
  guess_x numeric NOT NULL,
  guess_y numeric NOT NULL,
  entry_number integer NOT NULL,
  image_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending_confirmation',
  confirmed_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE (submission_token, entry_number)
);

CREATE TABLE IF NOT EXISTS public.user_submission_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  paid_submissions integer DEFAULT 0,
  free_submissions integer DEFAULT 0,
  total_submissions integer DEFAULT 0,
  next_submission_free boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, competition_id),
  CONSTRAINT valid_counts CHECK (
    paid_submissions >= 0
    AND free_submissions >= 0
    AND total_submissions >= 0
    AND total_submissions = (paid_submissions + free_submissions)
  )
);

CREATE TABLE IF NOT EXISTS public.winners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  distance double precision NOT NULL,
  announced_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  landing_page text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  session_duration_seconds integer DEFAULT 0,
  device_type text,
  browser text,
  os text,
  country text,
  did_signup boolean DEFAULT false,
  did_view_competition boolean DEFAULT false,
  did_place_bet boolean DEFAULT false,
  did_add_payment boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  ip_address text,
  city text
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  page_path text,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_competitions_created_at ON public.competitions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions (status);
CREATE INDEX IF NOT EXISTS idx_competitions_unit_coords ON public.competitions (judged_u, judged_v);

CREATE INDEX IF NOT EXISTS idx_daily_visit_counter_date ON public.daily_visit_counter (date);

CREATE INDEX IF NOT EXISTS idx_entries_competition_id ON public.entries (competition_id);
CREATE INDEX IF NOT EXISTS idx_entries_distance ON public.entries (distance);
CREATE INDEX IF NOT EXISTS idx_entries_unit_coords ON public.entries (u, v);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_payment_methods_default
  ON public.user_payment_methods (user_id) WHERE (is_default = true);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_stripe_customer
  ON public.user_payment_methods (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id
  ON public.user_payment_methods (user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_competition_id ON public.transactions (competition_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent ON public.transactions (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_id ON public.competition_entries (competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_transaction ON public.competition_entries (transaction_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_user_id ON public.competition_entries (user_id);

CREATE INDEX IF NOT EXISTS idx_pending_bets_competition_id ON public.pending_bets (competition_id);
CREATE INDEX IF NOT EXISTS idx_pending_bets_expires_at ON public.pending_bets (expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_bets_status ON public.pending_bets (status);
CREATE INDEX IF NOT EXISTS idx_pending_bets_token ON public.pending_bets (submission_token);

CREATE INDEX IF NOT EXISTS idx_user_submission_counters_user ON public.user_submission_counters (user_id);
CREATE INDEX IF NOT EXISTS idx_user_submission_counters_user_comp
  ON public.user_submission_counters (user_id, competition_id);

CREATE INDEX IF NOT EXISTS idx_winners_competition_id ON public.winners (competition_id);

CREATE INDEX IF NOT EXISTS idx_sessions_source ON public.analytics_sessions (utm_source);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.analytics_sessions (started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.analytics_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_events_created ON public.analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_events_name ON public.analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_events_session ON public.analytics_events (session_id);

-- =============================================================================
-- Functions
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_daily_visits()
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  current_count integer;
BEGIN
  SELECT visit_count INTO current_count
  FROM daily_visit_counter
  WHERE date = CURRENT_DATE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  RETURN current_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_daily_visits()
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  current_count integer;
BEGIN
  UPDATE daily_visit_counter
  SET visit_count = visit_count + 1
  WHERE date = CURRENT_DATE
  RETURNING visit_count INTO current_count;

  IF NOT FOUND THEN
    INSERT INTO daily_visit_counter (date, visit_count)
    VALUES (CURRENT_DATE, 1)
    RETURNING visit_count INTO current_count;
  END IF;

  RETURN current_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_competition_end_time()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.ends_at = DATE(NEW.ends_at) + TIME '18:00:00';
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_close_expired_competitions()
RETURNS TABLE(competition_id uuid, competition_title text, old_status text, new_status text)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  UPDATE competitions c
  SET status = 'closed'
  WHERE c.status = 'live'
    AND c.ends_at < NOW()
  RETURNING c.id, c.title, 'live'::text, c.status::text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.close_expired_competitions()
RETURNS TABLE(competition_id uuid, competition_title text, action_taken text, winner_user_id uuid, winner_distance numeric)
LANGUAGE plpgsql
AS $function$
DECLARE
  comp_record RECORD;
  closest_entry RECORD;
  judged_x_val numeric;
  judged_y_val numeric;
BEGIN
  FOR comp_record IN
    SELECT id, title, judged_x_norm, judged_y_norm
    FROM competitions
    WHERE status = 'live'
    AND ends_at < NOW()
  LOOP
    UPDATE competitions
    SET status = 'closed'
    WHERE id = comp_record.id;

    competition_id := comp_record.id;
    competition_title := comp_record.title;
    action_taken := 'closed';
    winner_user_id := NULL;
    winner_distance := NULL;
    RETURN NEXT;

    IF comp_record.judged_x_norm IS NOT NULL AND comp_record.judged_y_norm IS NOT NULL THEN
      judged_x_val := comp_record.judged_x_norm;
      judged_y_val := comp_record.judged_y_norm;

      SELECT
        ce.id,
        ce.user_id,
        ce.guess_x,
        ce.guess_y,
        SQRT(POWER(ce.guess_x - judged_x_val, 2) + POWER(ce.guess_y - judged_y_val, 2)) as distance
      INTO closest_entry
      FROM competition_entries ce
      WHERE ce.competition_id = comp_record.id
      ORDER BY distance ASC
      LIMIT 1;

      IF closest_entry.id IS NOT NULL THEN
        UPDATE competition_entries
        SET is_winner = true
        WHERE id = closest_entry.id;

        UPDATE competitions
        SET status = 'judged'
        WHERE id = comp_record.id;

        competition_id := comp_record.id;
        competition_title := comp_record.title;
        action_taken := 'judged_winner_calculated';
        winner_user_id := closest_entry.user_id;
        winner_distance := closest_entry.distance;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;

  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_distance_normalized(
  u1 double precision,
  v1 double precision,
  u2 double precision,
  v2 double precision,
  width integer DEFAULT 960,
  height integer DEFAULT 540
)
RETURNS double precision
LANGUAGE plpgsql
AS $function$
DECLARE
  dx FLOAT;
  dy FLOAT;
BEGIN
  dx := (u1 * width) - (u2 * width);
  dy := (v1 * height) - (v2 * height);
  RETURN SQRT(dx * dx + dy * dy);
END;
$function$;

CREATE OR REPLACE FUNCTION public.pixel_to_unit_coords(
  x_norm double precision,
  y_norm double precision,
  width integer DEFAULT 960,
  height integer DEFAULT 540
)
RETURNS TABLE(u double precision, v double precision)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY SELECT
    CASE WHEN width > 0 THEN x_norm / width ELSE 0.0 END AS u,
    CASE WHEN height > 0 THEN y_norm / height ELSE 0.0 END AS v;
END;
$function$;

CREATE OR REPLACE FUNCTION public.unit_to_pixel_coords(
  u double precision,
  v double precision,
  width integer DEFAULT 960,
  height integer DEFAULT 540
)
RETURNS TABLE(x_norm double precision, y_norm double precision)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY SELECT
    (u * width) AS x_norm,
    (v * height) AS y_norm;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_entry_distance()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    actual_x DECIMAL(8,5);
    actual_y DECIMAL(8,5);
    calculated_distance DECIMAL(10,5);
BEGIN
    SELECT
        COALESCE(c.judged_u * 100, NULL) as ball_x,
        COALESCE(c.judged_v * 100, NULL) as ball_y
    INTO actual_x, actual_y
    FROM competitions c
    WHERE c.id = NEW.competition_id;

    IF actual_x IS NOT NULL AND actual_y IS NOT NULL THEN
        calculated_distance := SQRT(
            POWER(NEW.guess_x - actual_x, 2) +
            POWER(NEW.guess_y - actual_y, 2)
        );
        NEW.distance_to_ball := calculated_distance;
        NEW.is_winner := NULL;
    ELSE
        NEW.distance_to_ball := NULL;
        NEW.is_winner := NULL;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_submission_counter()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO user_submission_counters (
    user_id, competition_id, total_submissions, paid_submissions, free_submissions
  )
  VALUES (
    NEW.user_id,
    NEW.competition_id,
    1,
    CASE WHEN NOT NEW.was_free_entry THEN 1 ELSE 0 END,
    CASE WHEN NEW.was_free_entry THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, competition_id)
  DO UPDATE SET
    total_submissions = user_submission_counters.total_submissions + 1,
    paid_submissions = user_submission_counters.paid_submissions +
      CASE WHEN NOT NEW.was_free_entry THEN 1 ELSE 0 END,
    free_submissions = user_submission_counters.free_submissions +
      CASE WHEN NEW.was_free_entry THEN 1 ELSE 0 END;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_winners(competition_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE entries
  SET distance = SQRT(
    POWER(x - (SELECT judged_x FROM competitions WHERE id = competition_uuid), 2) +
    POWER(y - (SELECT judged_y FROM competitions WHERE id = competition_uuid), 2)
  )
  WHERE competition_id = competition_uuid;

  DELETE FROM winners WHERE competition_id = competition_uuid;

  INSERT INTO winners (competition_id, user_id, rank, distance)
  SELECT
    competition_uuid,
    user_id,
    ROW_NUMBER() OVER (ORDER BY distance ASC, created_at ASC) as rank,
    distance
  FROM entries
  WHERE competition_id = competition_uuid
    AND distance IS NOT NULL
  ORDER BY distance ASC, created_at ASC
  LIMIT 3;

  UPDATE competitions
  SET status = 'judged'
  WHERE id = competition_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_competition_winners(competition_id_param uuid)
RETURNS TABLE(entry_id uuid, user_id uuid, guess_x numeric, guess_y numeric, distance_to_ball numeric, rank integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  actual_ball_x DECIMAL(8,5);
  actual_ball_y DECIMAL(8,5);
BEGIN
  SELECT
    COALESCE(judged_u * 100, 50) as ball_x,
    COALESCE(judged_v * 100, 50) as ball_y
  INTO actual_ball_x, actual_ball_y
  FROM competitions
  WHERE id = competition_id_param;

  IF actual_ball_x IS NULL OR actual_ball_y IS NULL THEN
    RAISE EXCEPTION 'Competition % has no judged ball coordinates', competition_id_param;
  END IF;

  WITH distance_calculations AS (
    SELECT
      ce.id as entry_id,
      ce.user_id,
      ce.guess_x,
      ce.guess_y,
      SQRT(POWER(ce.guess_x - actual_ball_x, 2) + POWER(ce.guess_y - actual_ball_y, 2)) as calculated_distance
    FROM competition_entries ce
    WHERE ce.competition_id = competition_id_param
  ),
  ranked_entries AS (
    SELECT *,
      ROW_NUMBER() OVER (ORDER BY calculated_distance ASC, created_at ASC) as entry_rank
    FROM distance_calculations
  )
  UPDATE competition_entries
  SET
    distance_to_ball = re.calculated_distance,
    is_winner = (re.entry_rank = 1),
    updated_at = NOW()
  FROM ranked_entries re
  WHERE competition_entries.id = re.entry_id;

  RETURN QUERY
  SELECT
    ce.id as entry_id,
    ce.user_id,
    ce.guess_x,
    ce.guess_y,
    ce.distance_to_ball,
    ROW_NUMBER() OVER (ORDER BY ce.distance_to_ball ASC, ce.created_at ASC)::INTEGER as rank
  FROM competition_entries ce
  WHERE ce.competition_id = competition_id_param
  ORDER BY ce.distance_to_ball ASC, ce.created_at ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_competition_winners(competition_id_param uuid)
RETURNS TABLE(
  entry_id uuid,
  user_email text,
  guess_x numeric,
  guess_y numeric,
  actual_ball_x numeric,
  actual_ball_y numeric,
  distance_to_ball numeric,
  is_winner boolean,
  rank integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  actual_x DECIMAL(8,5);
  actual_y DECIMAL(8,5);
BEGIN
  SELECT
    COALESCE(c.judged_u * 100, 50) as ball_x,
    COALESCE(c.judged_v * 100, 50) as ball_y
  INTO actual_x, actual_y
  FROM competitions c
  WHERE c.id = competition_id_param;

  IF actual_x IS NULL OR actual_y IS NULL THEN
    RAISE EXCEPTION 'Competition % not found or has no judged coordinates', competition_id_param;
  END IF;

  WITH distance_calculations AS (
    SELECT
      ce.id,
      ce.user_id,
      ce.guess_x,
      ce.guess_y,
      SQRT(POWER(ce.guess_x - actual_x, 2) + POWER(ce.guess_y - actual_y, 2)) as calculated_distance
    FROM competition_entries ce
    WHERE ce.competition_id = competition_id_param
  ),
  ranked_entries AS (
    SELECT
      dc.*,
      ROW_NUMBER() OVER (ORDER BY dc.calculated_distance ASC, ce.created_at ASC) as entry_rank
    FROM distance_calculations dc
    JOIN competition_entries ce ON dc.id = ce.id
  )
  UPDATE competition_entries
  SET
    distance_to_ball = re.calculated_distance,
    is_winner = (re.entry_rank = 1),
    updated_at = NOW()
  FROM ranked_entries re
  WHERE competition_entries.id = re.id;

  RETURN QUERY
  SELECT
    ce.id as entry_id,
    COALESCE(p.email, au.email) as user_email,
    ce.guess_x,
    ce.guess_y,
    actual_x as actual_ball_x,
    actual_y as actual_ball_y,
    ce.distance_to_ball,
    ce.is_winner,
    ROW_NUMBER() OVER (ORDER BY ce.distance_to_ball ASC, ce.created_at ASC)::INTEGER as rank
  FROM competition_entries ce
  LEFT JOIN auth.users au ON ce.user_id = au.id
  LEFT JOIN profiles p ON ce.user_id = p.id
  WHERE ce.competition_id = competition_id_param
    AND ce.distance_to_ball IS NOT NULL
  ORDER BY ce.distance_to_ball ASC, ce.created_at ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_all_distances_on_judging()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF (OLD.judged_u IS NULL OR OLD.judged_v IS NULL) AND
       (NEW.judged_u IS NOT NULL AND NEW.judged_v IS NOT NULL) THEN
        PERFORM update_competition_winners(NEW.id);
    END IF;

    IF (OLD.status != NEW.status) AND
       (NEW.status IN ('closed', 'judged')) AND
       (NEW.judged_u IS NOT NULL AND NEW.judged_v IS NOT NULL) THEN
        PERFORM update_competition_winners(NEW.id);
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.determine_winners_after_end_time()
RETURNS TABLE(competition_id uuid, competition_title text, winner_email text, winner_distance numeric, entries_processed integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    comp_record RECORD;
    winner_count INTEGER;
BEGIN
    -- Saved as-is from live DB. This function references competitions.end_date,
    -- which is not a live column (ends_at is). Recreate carefully if you use it.
    FOR comp_record IN
        SELECT c.id, c.title, c.ends_at
        FROM competitions c
        WHERE c.ends_at < NOW()
        AND c.judged_u IS NOT NULL
        AND c.judged_v IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM competition_entries ce
            WHERE ce.competition_id = c.id
            AND ce.is_winner = TRUE
        )
    LOOP
        WITH closest_entry AS (
            SELECT ce.id
            FROM competition_entries ce
            WHERE ce.competition_id = comp_record.id
            AND ce.distance_to_ball IS NOT NULL
            ORDER BY ce.distance_to_ball ASC, ce.created_at ASC
            LIMIT 1
        )
        UPDATE competition_entries
        SET is_winner = TRUE, updated_at = NOW()
        WHERE id = (SELECT id FROM closest_entry);

        GET DIAGNOSTICS winner_count = ROW_COUNT;

        RETURN QUERY
        SELECT
            comp_record.id,
            comp_record.title,
            ce_winner.user_email,
            ce_winner.distance_to_ball,
            winner_count
        FROM (
            SELECT
                COALESCE(p.email, au.email) as user_email,
                ce.distance_to_ball
            FROM competition_entries ce
            LEFT JOIN auth.users au ON ce.user_id = au.id
            LEFT JOIN profiles p ON ce.user_id = p.id
            WHERE ce.competition_id = comp_record.id
            AND ce.is_winner = TRUE
            LIMIT 1
        ) ce_winner;
    END LOOP;

    RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_and_determine_winners()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    result_text TEXT := '';
    winner_record RECORD;
BEGIN
    result_text := 'Checking for competitions that have ended...' || CHR(10);

    FOR winner_record IN
        SELECT * FROM determine_winners_after_end_time()
    LOOP
        result_text := result_text ||
            'Winner determined for "' || winner_record.competition_title || '": ' ||
            winner_record.winner_email || ' (distance: ' || winner_record.winner_distance || ')' || CHR(10);
    END LOOP;

    IF result_text = 'Checking for competitions that have ended...' || CHR(10) THEN
        result_text := result_text || 'No competitions ready for winner determination.';
    END IF;

    RETURN result_text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_competition_entries(competition_id_param uuid)
RETURNS TABLE(
  entry_id uuid,
  user_id uuid,
  user_email text,
  guess_x numeric,
  guess_y numeric,
  distance_to_ball numeric,
  entry_number integer,
  is_winner boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT
    ce.id as entry_id,
    ce.user_id,
    p.email as user_email,
    ce.guess_x,
    ce.guess_y,
    ce.distance_to_ball,
    ce.entry_number,
    ce.is_winner,
    ce.created_at
  FROM competition_entries ce
  JOIN auth.users au ON ce.user_id = au.id
  JOIN profiles p ON ce.user_id = p.id
  WHERE ce.competition_id = competition_id_param
  ORDER BY
    CASE WHEN ce.distance_to_ball IS NULL THEN 1 ELSE 0 END,
    ce.distance_to_ball ASC,
    ce.created_at ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_competition_winner(competition_id_param uuid)
RETURNS TABLE(user_email text, guess_x numeric, guess_y numeric, distance_to_ball numeric, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p.email, au.email) as user_email,
    ce.guess_x,
    ce.guess_y,
    ce.distance_to_ball,
    ce.created_at
  FROM competition_entries ce
  LEFT JOIN auth.users au ON ce.user_id = au.id
  LEFT JOIN profiles p ON ce.user_id = p.id
  WHERE ce.competition_id = competition_id_param
    AND ce.is_winner = true
  ORDER BY ce.distance_to_ball ASC, ce.created_at ASC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_competition_winners(competition_id_param uuid)
RETURNS TABLE(
  entry_id uuid,
  user_id uuid,
  user_email text,
  guess_x numeric,
  guess_y numeric,
  distance_to_ball numeric,
  entry_number integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ce.id as entry_id,
    ce.user_id,
    p.email as user_email,
    ce.guess_x,
    ce.guess_y,
    ce.distance_to_ball,
    ce.entry_number,
    ce.created_at
  FROM competition_entries ce
  JOIN auth.users au ON ce.user_id = au.id
  JOIN profiles p ON ce.user_id = p.id
  WHERE ce.competition_id = competition_id_param
    AND ce.is_winner = true
  ORDER BY ce.distance_to_ball ASC, ce.created_at ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_bets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM pending_bets
    WHERE expires_at < NOW() AND status = 'pending_confirmation';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$;

-- =============================================================================
-- Triggers
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS enforce_end_time_trigger ON public.competitions;
CREATE TRIGGER enforce_end_time_trigger
  BEFORE INSERT OR UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.set_competition_end_time();

DROP TRIGGER IF EXISTS recalculate_on_judging ON public.competitions;
CREATE TRIGGER recalculate_on_judging
  AFTER UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_all_distances_on_judging();

DROP TRIGGER IF EXISTS auto_calculate_distance ON public.competition_entries;
CREATE TRIGGER auto_calculate_distance
  BEFORE INSERT ON public.competition_entries
  FOR EACH ROW EXECUTE FUNCTION public.calculate_entry_distance();

DROP TRIGGER IF EXISTS increment_counter_trigger ON public.competition_entries;
CREATE TRIGGER increment_counter_trigger
  AFTER INSERT ON public.competition_entries
  FOR EACH ROW EXECUTE FUNCTION public.increment_submission_counter();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON public.user_payment_methods;
CREATE TRIGGER update_user_payment_methods_updated_at
  BEFORE UPDATE ON public.user_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_submission_counters_updated_at ON public.user_submission_counters;
CREATE TRIGGER update_user_submission_counters_updated_at
  BEFORE UPDATE ON public.user_submission_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visit_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_submission_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users"
  ON public.profiles FOR INSERT TO public
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
CREATE POLICY "Enable read access for own profile"
  ON public.profiles FOR SELECT TO public
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
CREATE POLICY "Enable update for own profile"
  ON public.profiles FOR UPDATE TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are created on signup" ON public.profiles;
CREATE POLICY "Profiles are created on signup"
  ON public.profiles FOR INSERT TO public
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO public
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO public
  USING (auth.uid() = id);

-- competitions
DROP POLICY IF EXISTS "Admins can manage all competitions" ON public.competitions;
CREATE POLICY "Admins can manage all competitions"
  ON public.competitions FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Allow authenticated users to read competitions" ON public.competitions;
CREATE POLICY "Allow authenticated users to read competitions"
  ON public.competitions FOR SELECT TO public
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view live competitions" ON public.competitions;
CREATE POLICY "Anyone can view live competitions"
  ON public.competitions FOR SELECT TO public
  USING (
    status = 'live'::competition_status
    OR status = 'closed'::competition_status
    OR status = 'judged'::competition_status
  );

-- daily_visit_counter
DROP POLICY IF EXISTS "Anyone can increment counter" ON public.daily_visit_counter;
CREATE POLICY "Anyone can increment counter"
  ON public.daily_visit_counter FOR ALL TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read visit counter" ON public.daily_visit_counter;
CREATE POLICY "Anyone can read visit counter"
  ON public.daily_visit_counter FOR SELECT TO public
  USING (true);

-- entries
DROP POLICY IF EXISTS "Admins can view all entries" ON public.entries;
CREATE POLICY "Admins can view all entries"
  ON public.entries FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Users can create entries for live competitions" ON public.entries;
CREATE POLICY "Users can create entries for live competitions"
  ON public.entries FOR INSERT TO public
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = entries.competition_id
        AND competitions.status = 'live'::competition_status
        AND competitions.ends_at > now()
    )
  );

DROP POLICY IF EXISTS "Users can view their own entries" ON public.entries;
CREATE POLICY "Users can view their own entries"
  ON public.entries FOR SELECT TO public
  USING (auth.uid() = user_id);

-- user_payment_methods
DROP POLICY IF EXISTS "Admins can manage all payment methods" ON public.user_payment_methods;
CREATE POLICY "Admins can manage all payment methods"
  ON public.user_payment_methods FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Users can delete own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can delete own payment methods"
  ON public.user_payment_methods FOR DELETE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can insert own payment methods"
  ON public.user_payment_methods FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can update own payment methods"
  ON public.user_payment_methods FOR UPDATE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can view own payment methods"
  ON public.user_payment_methods FOR SELECT TO public
  USING (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.transactions;
CREATE POLICY "Service role can manage all transactions"
  ON public.transactions FOR ALL TO public
  USING ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT TO public
  USING (auth.uid() = user_id);

-- competition_entries
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.competition_entries;
CREATE POLICY "Enable insert for users based on user_id"
  ON public.competition_entries FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.competition_entries;
CREATE POLICY "Enable read access for users based on user_id"
  ON public.competition_entries FOR SELECT TO public
  USING (auth.uid() = user_id);

-- pending_bets
DROP POLICY IF EXISTS "Allow anonymous insert pending bets" ON public.pending_bets;
CREATE POLICY "Allow anonymous insert pending bets"
  ON public.pending_bets FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read pending bets by token" ON public.pending_bets;
CREATE POLICY "Allow read pending bets by token"
  ON public.pending_bets FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Allow update confirmed bets" ON public.pending_bets;
CREATE POLICY "Allow update confirmed bets"
  ON public.pending_bets FOR UPDATE TO public
  USING (auth.uid() = confirmed_user_id);

-- user_submission_counters
DROP POLICY IF EXISTS "Admins can view all counters" ON public.user_submission_counters;
CREATE POLICY "Admins can view all counters"
  ON public.user_submission_counters FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Service role can manage all counters" ON public.user_submission_counters;
CREATE POLICY "Service role can manage all counters"
  ON public.user_submission_counters FOR ALL TO public
  USING ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Users can view own submission counters" ON public.user_submission_counters;
CREATE POLICY "Users can view own submission counters"
  ON public.user_submission_counters FOR SELECT TO public
  USING (auth.uid() = user_id);

-- winners
DROP POLICY IF EXISTS "Admins can manage winners" ON public.winners;
CREATE POLICY "Admins can manage winners"
  ON public.winners FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Anyone can view winners" ON public.winners;
CREATE POLICY "Anyone can view winners"
  ON public.winners FOR SELECT TO public
  USING (true);

-- analytics
DROP POLICY IF EXISTS "Allow admin read on sessions" ON public.analytics_sessions;
CREATE POLICY "Allow admin read on sessions"
  ON public.analytics_sessions FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Allow public insert on sessions" ON public.analytics_sessions;
CREATE POLICY "Allow public insert on sessions"
  ON public.analytics_sessions FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin read on events" ON public.analytics_events;
CREATE POLICY "Allow admin read on events"
  ON public.analytics_events FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

DROP POLICY IF EXISTS "Allow public insert on events" ON public.analytics_events;
CREATE POLICY "Allow public insert on events"
  ON public.analytics_events FOR INSERT TO public
  WITH CHECK (true);

-- =============================================================================
-- Storage buckets
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('competition-display', 'competition-display', true, 6291456, ARRAY['image/jpeg','image/png','image/webp']),
  ('competition-images', 'competition-images', true, NULL, NULL),
  ('competition-inpainted', 'competition-inpainted', true, NULL, NULL),
  ('competition-raw', 'competition-raw', false, NULL, NULL),
  ('masks', 'masks', false, NULL, NULL),
  ('winner-media', 'winner-media', true, NULL, NULL)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
