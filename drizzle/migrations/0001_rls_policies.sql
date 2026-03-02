-- ─── Enable RLS on all tables ────────────────────────────────────────────────
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.choice_impacts ENABLE ROW LEVEL SECURITY;

-- ─── players ──────────────────────────────────────────────────────────────────
-- A player can only read and update their own row.
-- Insert is handled server-side via service role only.
CREATE POLICY "players: read own row"
  ON public.players FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "players: update own row"
  ON public.players FOR UPDATE
  USING (auth.uid() = id);

-- ─── game_sessions ────────────────────────────────────────────────────────────
-- A player can only read and update their own sessions.
-- Insert/delete handled server-side via service role only.
CREATE POLICY "game_sessions: read own sessions"
  ON public.game_sessions FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "game_sessions: update own sessions"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = player_id);

-- ─── narrative_beats ──────────────────────────────────────────────────────────
-- Public read-only. No one writes beats at runtime — seeded by narrative-agent.
CREATE POLICY "narrative_beats: public read"
  ON public.narrative_beats FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── narrative_choices ────────────────────────────────────────────────────────
-- Public read-only. Choices are static content.
CREATE POLICY "narrative_choices: public read"
  ON public.narrative_choices FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── choice_impacts ───────────────────────────────────────────────────────────
-- NO public access. Zero policies = total denial for anon and authenticated roles.
-- Only the service role (backend API) can read this table.
-- This is intentional — impact data is private scoring logic.
