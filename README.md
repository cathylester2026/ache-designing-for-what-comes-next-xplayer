# xPLAYER 0.4 Realtime MVP

## Setup
1. Create a new Supabase project.
2. Enable anonymous sign-ins in Authentication settings.
3. Run `supabase-schema.sql` in the SQL editor.
4. Copy `.env.example` to `.env.local` and add the project URL and publishable key.
5. For GitHub Pages, add repository variables/secrets and expose them during the Vite build.

Uses Supabase Presence for connected state and Postgres Changes for persisted sessions, participants, responses and facilitator state. Prototype policies allow any authenticated anonymous participant to read session data; complete a formal security/privacy review before production use.
