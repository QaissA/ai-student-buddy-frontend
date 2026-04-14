# EduPlatform — Frontend Reference

> **Stack:** Angular 21 · Tailwind CSS · RxJS · Web Speech API  
> **Location:** `frontend/src/app/`  
> **API base:** `http://localhost:3000/api/v1` (see `src/environments/environment.ts`)

---

## 1. Purpose & Audience

EduPlatform is a language-learning app for **students under 12 years old**. The UI is voice-first, playful, and non-intimidating. Teachers and admins manage content through the same app using role-based route guards.

---

## 2. Directory Structure

```
src/app/
├── api/                    # HTTP client services (one file per backend module)
├── core/                   # Services, guards, interceptors, models
│   ├── services/
│   ├── guards/
│   ├── interceptors/
│   └── models/
├── layout/                 # App shell (sidebar + main layout wrapper)
├── pages/                  # Feature pages (lazy-loaded by route)
│   ├── auth/
│   ├── subjects/
│   ├── ai-tutor/
│   ├── exercises/
│   ├── pronunciation/
│   └── admin/
├── shared/                 # Reusable components (audio-player, pdf-viewer)
├── app.routes.ts           # All route definitions
├── app.config.ts           # Angular providers (HttpClient, Router, etc.)
└── app.ts                  # Root component
```

---

## 3. Routing (`app.routes.ts`)

```
/login                          → LoginComponent             (public)
/register                       → RegisterComponent          (public)

/ (shell, authGuard)            → AppLayoutComponent
  /subjects                     → SubjectsListComponent
  /subjects/:id                 → SubjectDetailComponent
  /books/:id                    → BookDetailComponent
  /lessons/:id                  → LessonComponent
  /ai-tutor                     → AiTutorSetupComponent
  /ai-tutor/:sessionId          → AiTutorChatComponent
  /exercises                    → GameSelectorComponent
  /exercises/:type              → ActiveGameComponent
  /exercises/complete           → SessionCompleteComponent
  /pronunciation                → PronunciationSetupComponent
  /pronunciation/:textId        → PronunciationPracticeComponent
  /pronunciation/:textId/results→ PronunciationResultsComponent
  /admin (roleGuard: ADMIN|TEACHER)
    /admin/subjects             → ManageSubjectsComponent
    /admin/books                → ManageBooksComponent
    /admin/lessons              → ManageLessonsComponent
    /admin/quizzes              → ManageQuizzesComponent
    /admin/users (ADMIN only)   → ManageUsersComponent
```

---

## 4. API Services (`src/app/api/`)

All services use `HttpClient`. The JWT interceptor automatically attaches `Authorization: Bearer <token>` to every request.

### `auth.api.ts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login → `{ user, token }` |
| POST | `/auth/register` | Register student → `{ user, token }` |
| POST | `/auth/register-teacher` | Create teacher (ADMIN only) |

### `subjects.api.ts`
Covers subjects, books, lessons, quiz CRUD, and the AI lesson-explanation endpoint.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subjects` | List all active subjects |
| GET | `/subjects/:id` | Subject detail + books |
| GET | `/books/:id` | Book detail + lessons |
| GET | `/lessons/:id` | Lesson content + quiz questions |
| POST | `/lessons/:id/explain` | AI explanation / answer a question |
| POST | `/quizzes/:id/attempt` | Submit quiz answers → score |
| POST | `/quizzes/generate` | AI-generate quiz questions (TEACHER/ADMIN) |

### `ai.api.ts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/session` | Create session (language, level, topic) |
| GET | `/ai/sessions` | List user's past sessions |
| GET | `/ai/session/:id` | Get session + full message history |
| POST | `/ai/session/:id/message` | Send text → `{ reply }` |
| POST | `/ai/session/:id/voice-message` | Send audio → `{ transcript, reply, audioUrl }` |
| DELETE | `/ai/session/:id` | Delete session |

### `exercises.api.ts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exercises/generate` | Generate random math problem |
| POST | `/exercises/attempt` | Submit answer + time |
| GET | `/exercises/stats` | User accuracy & streak |

### `pronunciation.api.ts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pronunciation/texts` | List reference texts (filter by language/level) |
| POST | `/pronunciation/attempt` | Upload audio → `{ score, transcript, feedback }` |
| GET | `/pronunciation/attempts` | User's past attempts |

### `admin.api.ts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/users` | List users (filter by role) |
| PATCH | `/admin/users/:id/role` | Change user role |
| DELETE | `/admin/users/:id` | Delete user |

---

## 5. Core Services (`src/app/core/services/`)

### `auth.service.ts`
Central auth state. Token and user stored in `localStorage` under `auth-storage`.

```ts
currentUser$: Observable<User | null>
token: string | null
setAuth(user, token)
logout()
isAuthenticated(): boolean
hasRole(role: Role): boolean
```

### `tts.service.ts`
Browser-native text-to-speech via `SpeechSynthesisUtterance`. No API key needed.

```ts
speak(text: string, lang = 'en-US', rate = 1)
stop()
```

Language codes to pass:
- English → `'en-US'`, French → `'fr-FR'`, Arabic → `'ar-SA'`, Spanish → `'es-ES'`

### `audio-recorder.service.ts`
Browser microphone recording via `MediaRecorder`. Emits a WebM blob on stop.

```ts
isRecording$: BehaviorSubject<boolean>
audioBlob$: BehaviorSubject<Blob | null>
start(): Promise<void>   // requests mic permission, begins recording
stop(): void             // stops and emits blob via audioBlob$
```

---

## 6. Core Guards (`src/app/core/guards/`)

### `auth.guard.ts`
Redirects to `/login` if no valid JWT token. Applied to the entire authenticated route shell.

### `role.guard.ts`
Reads `data.roles` from the route config. Redirects if `authService.hasRole()` returns false.

---

## 7. JWT Interceptor (`src/app/core/interceptors/jwt.interceptor.ts`)

Runs on every outgoing HTTP request:
- Adds `Authorization: Bearer <token>` header
- Adds `Cache-Control: no-cache` header
- On 401 response: calls `auth.logout()` and navigates to `/login`

---

## 8. Pages

### Auth (`pages/auth/`)
- `LoginComponent` — email + password form, calls `auth.api.ts`, stores token
- `RegisterComponent` — student registration form

### Subjects (`pages/subjects/`)
| Component | Route | What it does |
|-----------|-------|--------------|
| `SubjectsListComponent` | `/subjects` | Browse subjects, enroll/unenroll |
| `SubjectDetailComponent` | `/subjects/:id` | Show books in subject |
| `BookDetailComponent` | `/books/:id` | Show lessons in book |
| `LessonComponent` | `/lessons/:id` | Read lesson text/PDF, take quiz, ask AI to explain |

### AI Tutor (`pages/ai-tutor/`)
| Component | Route | What it does |
|-----------|-------|--------------|
| `AiTutorSetupComponent` | `/ai-tutor` | Select language, CEFR level, topic → creates session |
| `AiTutorChatComponent` | `/ai-tutor/:sessionId` | Voice-first conversation with Claude |

**AI Tutor Chat states:**
- `idle` — mic button pulses, robot bounces, wave bars still
- `recording` — wave bars animate, red stop ring, "Listening..."
- `thinking` — spinner, "Thinking...", mic disabled
- `speaking` — wave bars animate, "Speaking...", tapping mic interrupts audio
- `endSession()` — stops audio, navigates to `/ai-tutor` (NOT browser back — avoids reloading old sessions)

### Exercises (`pages/exercises/`)
| Component | Route | What it does |
|-----------|-------|--------------|
| `GameSelectorComponent` | `/exercises` | Pick exercise type (ADDITION, SUBTRACTION, etc.) |
| `ActiveGameComponent` | `/exercises/:type` | Timed math problems, streak tracking |
| `SessionCompleteComponent` | `/exercises/complete` | Results summary |

### Pronunciation (`pages/pronunciation/`)
| Component | Route | What it does |
|-----------|-------|--------------|
| `PronunciationSetupComponent` | `/pronunciation` | Select language + level |
| `PronunciationPracticeComponent` | `/pronunciation/:textId` | Record voice, submit to backend |
| `PronunciationResultsComponent` | `/pronunciation/:textId/results` | Score, word-by-word breakdown, Claude feedback |

### Admin (`pages/admin/`)
Role guard: TEACHER or ADMIN. User management routes are ADMIN only.

| Component | What it does |
|-----------|--------------|
| `AdminDashboardComponent` | Stats overview |
| `ManageSubjectsComponent` | CRUD subjects |
| `ManageBooksComponent` | CRUD books |
| `ManageLessonsComponent` | CRUD lessons + PDF/image upload |
| `ManageQuizzesComponent` | Create quizzes, trigger AI generation |
| `ManageUsersComponent` | View users, promote/demote roles |

---

## 9. Design System

All styling via **Tailwind CSS** with custom theme.

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#FF6B35` | CTA buttons, user message bubbles |
| `secondary` | `#4ECDC4` | Secondary actions, highlights |
| `ai-purple` | `#9B59B6` | Everything AI-related (tutor, badges) |
| `achievement` | `#FFD93D` | Badges, streaks, rewards |
| `surface` | `#FFFBF0` | Page background (warm cream) |
| `anchor` | `#2C3E50` | Body text, sidebar background |

### Fonts
- **Body:** Be Vietnam Pro
- **Display/Headings:** Fredoka One (class: `font-display`)
- **Arabic content:** Noto Naskh Arabic

### Utility classes (defined in `styles.css`)
| Class | Description |
|-------|-------------|
| `.card` | White rounded container with shadow |
| `.input-field` | Styled input with ai-purple focus ring |
| `.btn-primary` | Orange gradient button |
| `.btn-secondary` | Teal button |
| `.badge-ai` | Purple AI badge pill |
| `.badge-achievement` | Yellow achievement badge |

### Border radius convention
Use `rounded-[1.25rem]` for cards/buttons (not standard Tailwind `rounded-xl`).

---

## 10. Key Patterns

### Adding a new page
1. Create folder under `pages/`
2. Create standalone component with `imports: []` + inject services via `inject()`
3. Add route to `app.routes.ts` with `loadComponent: () => import(...)`
4. Add API calls to appropriate `*.api.ts` file

### Calling the API
```ts
private api = inject(MyApi);

// In a method:
this.api.someCall(params).subscribe({
  next: (data) => { /* handle */ },
  error: () => { /* handle */ },
});
```

### Auth-aware component
```ts
private auth = inject(AuthService);
user = this.auth.currentUser$;  // bind in template with async pipe
```

### Role check in template
```html
@if (auth.hasRole('ADMIN')) {
  <button>Admin only</button>
}
```
