# KCS Teacher Evaluation — Production Activation

The repository supports two application modes:

- `APP_MODE=demo`: public showcase with role switching and fictional evaluation data.
- `APP_MODE=production`: authenticated staff system with hierarchy-derived permissions.

Do **not** point production at the public demo D1 database. The demo contains fictional evaluation records tied to real staff names.

## Production resources

Create separate Cloudflare resources:

```bash
npx wrangler d1 create kcs-teacher-evaluation-production-db
npx wrangler r2 bucket create kcs-teacher-evaluation-files
```

Add a `production` Wrangler environment using:

- a separate Worker name
- a separate production route/domain
- the production D1 database id
- the private R2 bucket
- `APP_MODE=production`

Keep the binding names used by the application:

```jsonc
{
  "vars": {
    "APP_MODE": "production"
  },
  "d1_databases": [
    {
      "binding": "kcs_teacher_evaluation_demo_db",
      "database_name": "kcs-teacher-evaluation-production-db",
      "database_id": "<PRODUCTION_D1_ID>",
      "migrations_dir": "migrations"
    }
  ],
  "r2_buckets": [
    {
      "binding": "kcs_teacher_evaluation_files",
      "bucket_name": "kcs-teacher-evaluation-files"
    }
  ]
}
```

The D1 binding keeps its existing code-level name for compatibility; the bound database itself is the isolated production database.

## Apply database migrations

After the production environment is configured:

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

Generate a long random value locally and store it only as a Cloudflare secret:

```bash
npx wrangler secret put BOOTSTRAP_TOKEN --env production
```

Never commit this token.

## Deploy production

```bash
npm run build
npx vinext-cloudflare deploy --env production
```

Verify the production route and bindings in the Wrangler output before using the site.

## Create the first administrator

1. Open `/apps/teacher-evaluation/setup` on the production hostname.
2. Select the staff profile that should own the initial technical administrator account.
3. Enter the staff email and a strong password.
4. Enter the `BOOTSTRAP_TOKEN` value.
5. Submit once.

The bootstrap endpoint closes automatically once the first account exists.

## Initial school setup order

1. Verify staff and reporting hierarchy in **Master Management → Staff & hierarchy**.
2. Create staff login accounts in **Master Management → Accounts**.
3. Review the active academic year.
4. Configure annual observation requirements and windows.
5. Replace the default rubric/rating scale with the school-approved framework.
6. Publish annual evaluation requirements.
7. Test one account at each permission level before broad rollout.

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
- New observations snapshot their rubric/rating scale at scheduling so later framework changes do not rewrite the historical configuration.
- Development targets carry forward until a later review explicitly continues or closes them.
- Private file downloads are permission-checked through the Worker; the R2 bucket is not public.

## Rollback

If a production release fails:

1. Do not modify the demo deployment.
2. Roll the production Worker back to the previous Cloudflare version.
3. Do not reverse destructive D1 migrations manually. Add a forward migration instead.
4. Keep the production D1/R2 resources intact while the Worker version is rolled back.
