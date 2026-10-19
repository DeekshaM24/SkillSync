# SkillSync

SkillSync is a responsive placement-training LMS built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage, and Recharts. Phase 1 includes authentication, role onboarding, role-protected dashboards, institution administration, trainer test assignment, demo records, and row-level security.

## Requirements

- Node.js 20.9 or newer
- A Supabase project with the Auth, Postgres, and Storage APIs enabled
- A Google OAuth client configured in Supabase if Google sign-in is required

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the **server-only** `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project.

3. Apply the database schema in the Supabase SQL Editor, or with the Supabase CLI:

   ```bash
   supabase db push
   ```

   The migration is in `supabase/migrations/202610090001_initial_schema.sql`. It creates the LMS tables, profile-role safeguards, row-level security policies, and the private `placement-content` storage bucket.

4. In Supabase Auth, set the site URL to your local app (`http://localhost:3000`) and add `http://localhost:3000/auth/callback` as a redirect URL. For Google sign-in, configure the Google provider credentials and callback URL shown by Supabase.

5. Set a temporary demo password in `SEED_DEMO_PASSWORD` (at least 12 characters), then seed the project:

   ```bash
   npm run seed
   ```

   Seeding is idempotent and persists its demo records in Supabase. It creates one institution, two batches, one trainer, one placement officer, ten students, 100 MCQs, ten coding problems, sample test cases, and persisted sample assessment/progress data. The command prints the seeded institution ID and demo login email addresses (`@skillsync.demo`). All seeded accounts use your configured `SEED_DEMO_PASSWORD`.

6. Copy the printed institution ID to `PLACEMENT_OFFICER_INSTITUTION_ID` and choose a private, long `PLACEMENT_OFFICER_INSTITUTION_CODE`. These server-only values gate placement-officer onboarding. Restart the app after changing environment variables.

7. Start the app:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

## Validation commands

```bash
npm run typecheck
npm run build
```

## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or a `NEXT_PUBLIC_` variable.
- Role assignment and institution binding are performed server-side; ordinary users cannot insert profiles through the public API or change an assigned role/institution.
- Questions are tenant-scoped, and the correct-answer/explanation columns are not selectable by authenticated clients.
- Dashboard queries use the current session and Supabase RLS; empty states are shown when source records are absent.
- For production, configure Supabase email confirmation, rate limits, OAuth origins, backups, and a secret manager for server-only variables.

## Phase 1 surfaces

- `/`: responsive email/password and Google sign-in, sign-up, reset-password request, light/dark theme, and English/Hindi entry controls.
- `/onboarding/role`: role-specific profile setup. Student batch codes must belong to the selected institution; placement officers need the configured institution code.
- `/student`: readiness calculated from persisted assessment, coding, interview, resume, and course records; assignments, activity, streak, points, badges, and batch ranking.
- `/trainer`: assigned batches, students, assessment averages, topic insights, test creation/assignment, feedback, and CSV export.
- `/admin`: institution readiness from recorded assessments and resumes, batch management, trainer assignment/removal, announcements, company roadmap data, and CSV reporting.

Later phase-specific interactive engines (timed MCQ sessions, Judge0 execution, resume analysis, and AI interviews) are not part of this Phase 1 implementation.

Bundled background photography uses Pexels' free-to-use license: campus (photo 256490), interview (photo 3760067), collaboration (photo 3184360), and coding (photo 1181244).
