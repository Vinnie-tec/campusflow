# CampusFlow

CampusFlow is a learning and project workspace for university students and instructors. Students can discover courses, learn from ordered lessons, track completion, take assessments, and review courses. Instructors can publish courses and build lessons and assessments. Signed-in users can also plan and track personal projects.

> **Project status:** Core course, assessment, learning-progress, review, and project flows are implemented. Authentication uses email and password; public sign-up creates student accounts. Instructor access is assigned outside public sign-up.

## Application preview

![CampusFlow home page](public/campusflow-home.png)

The home page links to the course catalogue, project workspace, and sign-in flow. Course and project pages link back to the other core features.

## Features

- **Session-aware authentication:** Better Auth supports sign-in and student sign-up. Navigation reflects the current session and role, and signed-in users can sign out from the main feature pages.
- **Course management:** Instructors create courses, manage draft and published status, and organize course content.
- **Lessons and learning progress:** Instructors add and edit ordered lessons; enrolled students mark lessons complete and see progress.
- **Assessments:** Instructors create assessments, add multiple-choice questions, and publish them. Students can start and submit attempts; instructors can view results.
- **Course enrollment and reviews:** Students enroll in published courses and submit one review per course.
- **Project tracking:** Authenticated users create, search, filter, paginate, view, update, and delete their own projects.
- **Data validation and ownership:** Zod schemas validate inputs, while server-side checks restrict protected actions to the appropriate user and role.
- **Database health check:** A lightweight endpoint verifies that PostgreSQL is reachable.

## Technology stack

| Area | Technology |
| --- | --- |
| Web application | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Authentication | Better Auth |
| Database | PostgreSQL (Neon-compatible) |
| ORM and migrations | Drizzle ORM and Drizzle Kit |
| Input validation | Zod |
| Testing | Vitest |
| Linting | ESLint |

## Getting started

### Prerequisites

- Node.js 24 or a compatible current Node.js release
- npm
- A PostgreSQL database (Neon works; a compatible PostgreSQL instance can also be used)

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create `.env.local` in the repository root. Do not commit this file or share its secret values.

```dotenv
# Required by the application at runtime.
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# Optional, recommended for direct migration connections.
# If omitted, Drizzle Kit falls back to DATABASE_URL.
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@DIRECT_HOST/DATABASE?sslmode=require"

# Better Auth configuration.
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

Generate a secret locally, for example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use the correct PostgreSQL connection strings from your provider. `DATABASE_URL` is required by the application; `DATABASE_URL_UNPOOLED` is optional and used for migrations when available. Use your deployed application origin for `BETTER_AUTH_URL` in production, and configure production secrets in the hosting provider rather than committing them.

### Set up the database

Drizzle Kit loads `.env.local`. Apply the checked-in SQL migrations to the configured database:

```bash
npm run db:migrate
```

When changing a schema in `src/lib/db/schema/`, generate a migration, review the generated SQL, and then apply it:

```bash
npm run db:generate
# Review the new SQL file in drizzle/ before applying it.
npm run db:migrate
```

To inspect the schema with Drizzle Studio:

```bash
npm run db:studio
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If the port is already occupied, Next.js may select another available port and print its URL in the terminal.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production application |
| `npm run start` | Serve a production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest |
| `npm run db:generate` | Generate Drizzle SQL migrations |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Main application routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Home and feature navigation | Public |
| `/login` | Sign in with email and password | Public |
| `/signup` | Create a student account | Public |
| `/courses` | Browse published courses or manage instructor courses | Public; instructor view is role-aware |
| `/courses/new` | Create a course | Instructor |
| `/courses/[id]` | View a course, its lessons, and assessments | Published courses are available to learners |
| `/courses/[id]/lessons/[lessonId]` | Open a lesson and update completion | Enrolled student or owning instructor |
| `/my-learning` | View enrolled courses and progress | Student |
| `/dashboard` | View learning statistics and enrolled courses | Student |
| `/projects` | Search and manage personal projects | Signed-in user |
| `/projects/[id]` | View a project | Project owner |
| `/assessments/[id]/take` | Take a published assessment | Student |
| `/assessments/[id]/results` | View assessment results | Owning instructor |

Public sign-up assigns the `student` role. Instructor accounts must be granted the instructor role through a trusted administrative/database workflow; never expose role selection to unauthenticated users.

## API reference

Dynamic path parameters use `:id`, `:lessonId`, and `:attemptId` below. Protected routes require a valid Better Auth session; role- and ownership-specific rules are enforced by the server.

### Authentication and health

| Method | Endpoint | Purpose |
| --- | --- | --- |
| Better Auth methods | `/api/auth/*` | Better Auth email/password and session endpoints |
| `GET` | `/api/health/db` | Check PostgreSQL connectivity; returns a generic success or failure response |

### Projects

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/projects` | List the signed-in user's projects |
| `POST` | `/api/projects` | Create a project owned by the signed-in user |
| `PATCH` | `/api/projects/:id` | Update an owned project |
| `DELETE` | `/api/projects/:id` | Delete an owned project |

### Courses, lessons, enrollment, and reviews

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/courses` | List an instructor's own courses, or published courses for students and visitors |
| `POST` | `/api/courses` | Create a draft course (instructor) |
| `PATCH` | `/api/courses/:id` | Publish or return an owned course to draft (instructor) |
| `POST` | `/api/courses/:id/lessons` | Add a lesson to an owned course (instructor) |
| `PATCH` | `/api/courses/:id/lessons/:lessonId` | Edit an owned course lesson (instructor) |
| `POST` | `/api/courses/:id/lessons/:lessonId/progress` | Mark an enrolled student's lesson complete |
| `POST` | `/api/courses/:id/enrollment` | Enroll a student in a published course |
| `GET` | `/api/courses/:id/reviews` | List reviews for a published course |
| `POST` | `/api/courses/:id/reviews` | Submit an enrolled student's course review |

### Assessments

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/courses/:id/assessments` | List assessments visible to the requester |
| `POST` | `/api/courses/:id/assessments` | Create an assessment for an owned course (instructor) |
| `GET` | `/api/assessments/:id/questions` | List assessment questions and answer options (correct-answer flags are not exposed) |
| `POST` | `/api/assessments/:id/questions` | Add a question and its options to a draft assessment (instructor) |
| `POST` | `/api/assessments/:id/publish` | Publish an owned assessment after questions have been added (instructor) |
| `POST` | `/api/assessments/:id/attempts` | Start an assessment attempt (student) |
| `GET` | `/api/assessments/:id/attempts/:attemptId` | Load an in-progress quiz attempt belonging to the signed-in student |
| `POST` | `/api/assessments/:id/attempts/:attemptId/submit` | Submit an in-progress attempt |
| `GET` | `/api/assessments/:id/results` | View results for an assessment in the instructor's course |

## Project structure

```text
src/
  app/                 App Router pages and route handlers
    api/               Authentication, health, course, project, and assessment APIs
    assessments/       Assessment taking and results pages
    courses/           Course catalogue, lessons, and instructor tools
    dashboard/         Student learning dashboard
    my-learning/       Enrolled courses and progress
    projects/          Project tracking pages and components
  lib/
    db/                PostgreSQL connection and Drizzle schema
    queries/           Reusable course and progress queries
    utils/             Shared utilities
    validations/       Zod request schemas
drizzle/               Versioned SQL migrations and snapshots
public/                Static assets, including the README screenshot
```

## Verification

Run the checks locally with:

```bash
npm run lint
npm test
npm run build
```

## Project summary

CampusFlow demonstrates full-stack application development across authenticated and role-aware Next.js routes, relational PostgreSQL schema design, Drizzle migrations and queries, validated API handlers, ownership-aware CRUD, course enrollment, assessment authoring and submissions, and learner progress tracking. It also includes focused unit/API tests, a documented local setup, and a responsive interface connecting the learning and project workflows.