import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Public routes
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
  },

  // Protected routes (all authenticated users)
  {
    path: '',
    loadComponent: () => import('./layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    canActivate: [authGuard],
    children: [
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      // Study module
      {
        path: 'subjects',
        loadComponent: () => import('./pages/subjects/subjects-list/subjects-list.component').then(m => m.SubjectsListComponent),
      },
      {
        path: 'subjects/:id',
        loadComponent: () => import('./pages/subjects/subject-detail/subject-detail.component').then(m => m.SubjectDetailComponent),
      },
      {
        path: 'books/:id',
        loadComponent: () => import('./pages/subjects/book-detail/book-detail.component').then(m => m.BookDetailComponent),
      },
      {
        path: 'lessons/:id',
        loadComponent: () => import('./pages/subjects/lesson/lesson.component').then(m => m.LessonComponent),
      },

      // AI Tutor module
      {
        path: 'ai-tutor',
        loadComponent: () => import('./pages/ai-tutor/setup/ai-tutor-setup.component').then(m => m.AiTutorSetupComponent),
      },
      {
        path: 'ai-tutor/:sessionId',
        loadComponent: () => import('./pages/ai-tutor/chat/ai-tutor-chat.component').then(m => m.AiTutorChatComponent),
      },

      // Exercises module
      {
        path: 'exercises',
        loadComponent: () => import('./pages/exercises/game-selector/game-selector.component').then(m => m.GameSelectorComponent),
      },
      {
        path: 'exercises/complete',
        loadComponent: () => import('./pages/exercises/session-complete/session-complete.component').then(m => m.SessionCompleteComponent),
      },
      {
        path: 'exercises/:type',
        loadComponent: () => import('./pages/exercises/active-game/active-game.component').then(m => m.ActiveGameComponent),
      },

      // Leaderboard
      {
        path: 'leaderboard',
        loadComponent: () => import('./pages/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
      },

      // Pronunciation module
      {
        path: 'pronunciation',
        loadComponent: () => import('./pages/pronunciation/setup/pronunciation-setup.component').then(m => m.PronunciationSetupComponent),
      },
      {
        path: 'pronunciation/:textId',
        loadComponent: () => import('./pages/pronunciation/practice/pronunciation-practice.component').then(m => m.PronunciationPracticeComponent),
      },
      {
        path: 'pronunciation/:textId/results',
        loadComponent: () => import('./pages/pronunciation/results/pronunciation-results.component').then(m => m.PronunciationResultsComponent),
      },

      // Admin module (ADMIN + TEACHER only)
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'TEACHER'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
          },
          {
            path: 'subjects',
            loadComponent: () => import('./pages/admin/manage-subjects/manage-subjects.component').then(m => m.ManageSubjectsComponent),
          },
          {
            path: 'books',
            loadComponent: () => import('./pages/admin/manage-books/manage-books.component').then(m => m.ManageBooksComponent),
          },
          {
            path: 'lessons',
            loadComponent: () => import('./pages/admin/manage-lessons/manage-lessons.component').then(m => m.ManageLessonsComponent),
          },
          {
            path: 'quizzes',
            loadComponent: () => import('./pages/admin/manage-quizzes/manage-quizzes.component').then(m => m.ManageQuizzesComponent),
          },
          {
            path: 'users',
            canActivate: [roleGuard],
            data: { roles: ['ADMIN'] },
            loadComponent: () => import('./pages/admin/manage-users/manage-users.component').then(m => m.ManageUsersComponent),
          },
        ],
      },
    ],
  },

  { path: '**', redirectTo: 'subjects' },
];
