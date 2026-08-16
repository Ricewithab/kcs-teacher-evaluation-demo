# KCS Teacher Evaluation — Production Activation

The repository supports two application modes:

- `APP_MODE=demo`: public showcase with role switching and fictional evaluation data.
- `APP_MODE=production`: authenticated staff system with hierarchy-derived permissions.

The public demo and production test system are deliberately isolated. Production must never point at the public demo D1 database because the demo contains fictional evaluation records tied to real staff names.

## Provisioned production test resources

Production D1:

```text
name: kcs-teacher-evaluation-production-db
id: f8371d65-6689-4448-823f-120daf019bb2
code binding: kcs_teacher_evaluation_demo_db
```

Production R2:

```text
bucket: kcs-teacher-evaluation-files
code binding: kcs_teacher_evaluation_files
storage class: Standard
```

The D1 binding deliberately keeps the existing code-level name for compatibility. The database behind that binding is completely separate from the public demo database.

`wrangler.jsonc` defines an isolated `production` environment:

- Worker name: `kcs-teacher-evaluation-production`
- `APP_MODE=production`
- production D1 binding
- private R2 binding
- `workers_dev=true`
- `routes=[]`

The empty production route list is intentional. During testing, production is exposed only through its separate `*.workers.dev` hostname and cannot take over the existing `brycep.com/apps/teacher-evaluation*` demo route.

## Production seed safety

The application seed function is mode-aware:

- demo mode may create fictional showcase observations, feedback, reflections and goals;
- production mode creates only the initial real staff/hierarchy plus a clean active framework;
- production mode returns before any fictional showcase evaluation records are created.

Do not remove this separation.

## Apply database migrations

From the feature branch after pulling the production configuration:

```bash
npm install
npm run db:migrate:production
```

Equivalent Wrangler command:

```bash
npx wrangler d1 migrations apply kcs_teacher_evaluation_demo_db --remote --env production
```

The migration chain creates:

1. Core teacher-evaluation records
2. Staff-linked accounts and sessions
3. Annual evaluation requirement slots
4. Configurable rubric/rating scale/evaluation types
5. Development-goal follow-up history
6. Private attachment metadata
7. Independent academic-year lifecycle
8. Evaluation-type and rubric snapshots

## Configure the bootstrap secret

Generate a long random value locally:

```bash
openssl rand -hex 32
```

Copy that value somewhere temporary, then store it as the production Worker secret:

```bash
npx wrangler secret put BOOTSTRAP_TOKEN --env production
```

Paste the generated value when Wrangler prompts. Do not commit it and do not share it in chat. It is required only to create the first administrator account.

## Deploy production test Worker

```bash
npm run deploy:production
```

The Vinext Cloudflare deploy command supports `--env production`; Wrangler will use the named production environment and create/deploy the separate production Worker.

Verify the final deployment output before opening the site. It should show:

- Worker: `kcs-teacher-evaluation-production`
- D1: `kcs-teacher-evaluation-production-db`
- R2: `kcs-teacher-evaluation-files`
- no `brycep.com` production route
- a separate `workers.dev` URL

## Create the first administrator

1. Open `/apps/teacher-evaluation/setup` on the production `workers.dev` hostname.
2. Select the staff profile that should own the initial technical administrator account.
3. Enter the staff email and a strong password.
4. Enter the temporary `BOOTSTRAP_TOKEN` value.
5. Submit once.

The bootstrap endpoint closes automatically once the first account exists.

## Initial school setup order

1. Verify staff and reporting hierarchy in **Master Management → Staff & hierarchy**.
2. Correct imported hierarchy/eligibility before creating general accounts.
3. Create staff login accounts in **Master Management → Accounts**.
4. Review the active academic year.
5. Configure annual observation requirements and windows.
6. Replace the default rubric/rating scale with the school-approved framework.
7. Publish annual evaluation requirements.
8. Test one account at each permission level before broad rollout.

## Required acceptance tests

### Teacher
- sees only own evaluation records
- creates/saves a lesson plan
- uploads permitted attachments
- receives feedback
- submits own reflection
- sees own development goal and follow-up

### Manager / HoD
- sees only reporting hierarchy
- schedules a generated requirement
- reschedules/cancels a pre-observation record
- records observation evidence
- releases feedback
- sets/follows up development goals

### Head of Division
- sees recursive division hierarchy
- sees completion/action rollups
- cannot edit Master-only framework/account settings

### Master / System Administrator
- sees whole school
- manages staff hierarchy and accounts
- creates/activates academic years
- configures rubric and annual requirements
- publishes/re-syncs requirement slots
- sees audit history

## Data integrity rules

- Historical evaluations are never deleted when staff are deactivated.
- Cancelling an uncompleted observation reopens its annual requirement and retains an audit record.
- Academic years are independent cycles.
- New observations snapshot their rubric/rating scale at scheduling so later framework changes do not rewrite historical configuration.
- Development targets carry forward until a later review explicitly continues or closes them.
- Private file downloads are permission-checked through the Worker; the R2 bucket is not public.
- Production initialization must never seed fictional demo evaluations.

## Rollback

If a production test release fails:

1. Do not modify the public demo deployment.
2. Roll the production Worker back to the previous Cloudflare version.
3. Do not reverse destructive D1 migrations manually; add a forward migration instead.
4. Keep the production D1/R2 resources intact while the Worker version is rolled back.
