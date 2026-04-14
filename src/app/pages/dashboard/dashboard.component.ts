import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DashboardApi, DashboardKpis, EnrolledSubjectKpi, LeaderboardEntry } from '../../api/dashboard.api';
import { ScoresApi, MyStats } from '../../api/scores.api';

interface RecentLesson {
  title: string;
  subject: string;
  status: 'in-progress' | 'completed' | 'not-started';
  xp: number;
  progress?: number;   // 0–100
  emoji: string;
  route: string;
}

interface UpcomingEvent {
  date: string;
  month: string;
  title: string;
  emoji: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styles: [`
    .diagonal-texture {
      background-image: repeating-linear-gradient(
        45deg,
        rgba(255,255,255,0.04) 0px,
        rgba(255,255,255,0.04) 1px,
        transparent 1px,
        transparent 8px
      );
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-6px); }
    }
    .float { animation: float 3s ease-in-out infinite; }
  `],
})
export class DashboardComponent implements OnInit {
  private auth         = inject(AuthService);
  private dashboardApi = inject(DashboardApi);
  private scoresApi    = inject(ScoresApi);

  user    = this.auth.currentUser;
  loading = true;

  // KPI fields populated from the single API call
  streak      = 0;
  accuracy    = 0;
  totalGames  = 0;
  aiSessions  = 0;
  xp          = 0;
  level       = 1;
  levelProgress  = 0;
  xpToNextLevel  = 200;
  userRank       = 1;

  enrolledSubjects: EnrolledSubjectKpi[] = [];
  leaderboard: LeaderboardEntry[]        = [];
  myStats: MyStats | null                = null;

  readonly upcomingEvents: UpcomingEvent[] = [
    { date: '14', month: 'OCT', title: 'German Tea Time',        emoji: '☕', color: '#4ECDC4' },
    { date: '16', month: 'OCT', title: 'Spanish Flamenco Night', emoji: '💃', color: '#FF6B35' },
  ];

  get firstName(): string { return this.user?.firstName ?? 'there'; }

  get hourGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  get featuredSubject(): EnrolledSubjectKpi | null {
    return this.enrolledSubjects[0] ?? null;
  }

  get recentLessons(): RecentLesson[] {
    const flagMap: Record<string, string> = {
      FRENCH: '🇫🇷', ARABIC: '🇸🇦', SPANISH: '🇪🇸', ENGLISH: '🇬🇧', OTHER: '🌍',
    };
    // XP reward per status
    const xpForStatus: Record<EnrolledSubjectKpi['status'], number> = {
      'completed': 75,
      'in-progress': 50,
      'not-started': 25,
    };

    return this.enrolledSubjects.slice(0, 3).map((sub) => ({
      title:    sub.name,
      subject:  sub.language.charAt(0) + sub.language.slice(1).toLowerCase(),
      status:   sub.status,
      xp:       xpForStatus[sub.status],
      progress: sub.progressPercent,
      emoji:    flagMap[sub.language] ?? '🌍',
      route:    `/subjects/${sub.id}`,
    }));
  }

  get aiInsightSubject(): string {
    return this.featuredSubject?.name ?? 'a new topic';
  }

  private readonly activityMeta: Record<string, { label: string; emoji: string }> = {
    EXERCISE_ATTEMPT:     { label: 'Exercise',    emoji: '🎮' },
    QUIZ_ATTEMPT:         { label: 'Quiz',         emoji: '📝' },
    AI_SESSION:           { label: 'AI Tutor',     emoji: '🤖' },
    AI_MESSAGE:           { label: 'AI Chat',      emoji: '💬' },
    PRONUNCIATION_ATTEMPT:{ label: 'Speaking',     emoji: '🎤' },
    SUBJECT_ENROLLMENT:   { label: 'Enrolled',     emoji: '📚' },
    LESSON_CHAT_SESSION:  { label: 'Lesson Chat',  emoji: '💡' },
    LESSON_CHAT_MESSAGE:  { label: 'Lesson Q&A',   emoji: '🧑‍🏫' },
  };

  getActivityMeta(type: string) {
    return this.activityMeta[type] ?? { label: type, emoji: '⭐' };
  }

  ngOnInit() {
    this.scoresApi.getMyStats().subscribe({
      next: (stats) => { this.myStats = stats; },
      error: () => {},
    });

    this.dashboardApi.getKpis().subscribe({
      next: (kpis: DashboardKpis) => {
        this.streak           = kpis.streak;
        this.accuracy         = kpis.accuracy;
        this.totalGames       = kpis.totalGames;
        this.aiSessions       = kpis.aiSessions;
        this.xp               = kpis.xp;
        this.level            = kpis.level;
        this.levelProgress    = kpis.levelProgress;
        this.xpToNextLevel    = kpis.xpToNextLevel;
        this.enrolledSubjects = kpis.enrolledSubjects;
        this.leaderboard      = kpis.leaderboard;
        this.userRank         = kpis.userRank;
        this.loading          = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
