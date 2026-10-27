# xPlayer 0.8.0

Complete replacement files for the facilitated assessment build.

## Replace
- `src/App.jsx`
- `src/styles.css`
- `src/supabase.js`
- `package.json`

No Supabase SQL migration is required. Assessment metadata is stored in the existing `xp_responses.selections` JSON array using reserved `@` entries. Existing sessions remain readable.

## New facilitated-only functionality
- discipline/perspective retained at entry
- two confidence checkpoints
- explicit requirement disposition: Supported, Deferred, Alternative
- conditional rationale prompt for Deferred or Alternative
- facilitator Design Brief, Insights, and Requirements tabs
- cohort counts plus percentages
- requirement trace copy action
- workshop-cohort caveat and no organizational readiness score

## Solo / Live Portfolio
Live Portfolio remains an individual learning journey. It does not claim alignment or divergence for a single player.

## Deploy
1. Replace the files listed above in the repository.
2. Preserve the existing `public/images` folder and all other project files.
3. Commit the changes to GitHub.
4. Allow the existing GitHub Pages/Vite workflow to rebuild.
5. Start a new facilitated session for testing. Older sessions will not contain the new confidence/disposition metadata.
