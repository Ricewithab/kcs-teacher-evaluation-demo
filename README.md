# KCS Teacher Evaluation Demo

A public prototype for Dipont KCS Chengdu demonstrating a connected teacher-evaluation workflow: annual requirements, scheduling, lesson planning, observation, feedback, teacher reflection, development goals, follow-up, and leadership oversight.

The demo uses real KCS staff names and organisational roles where available. **All evaluation statuses, ratings, feedback, reflections, and development records are fictional demonstration data only.**

Planned deployment path: `brycep.com/apps/teacher-evaluation`.

## Initial prototype

- Four role views: Head of School (Master), Head of Division, Head of Department, Teacher
- Master configuration for annual observation requirements, observation windows, feedback/reflection deadlines and required process steps
- High School organisation builder with drag-and-drop department placement
- Evaluation centre with school/department/teacher status views
- Connected evaluation record: lesson plan → rubric/evidence → feedback → reflection → development goal/follow-up
- General lesson-plan creator using Cambridge IGCSE Mathematics 0580 as the demonstration subject
- Full 2025–26 academic staff roster imported as initial demonstration structure
- Drizzle/D1 schema scaffold for persistent online records and audit history
- Cloudflare Worker configuration prepared for `/apps/teacher-evaluation`

## Local development

```bash
npm install
npm run dev
```

The app uses the base path:

```text
/apps/teacher-evaluation
```

## Cloudflare setup still required

Create the project D1 database and add its binding to `wrangler.jsonc` before production deployment:

```bash
npx wrangler login
npx wrangler d1 create kcs-teacher-evaluation-demo-db
```

Then generate/apply the initial schema migration and deploy after the binding is configured.
