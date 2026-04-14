import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EnrolledSubjectKpi {
  id: string;
  name: string;
  language: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  status: 'not-started' | 'in-progress' | 'completed';
  lastActivityAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  firstName: string;
  xp: number;
  isMe: boolean;
}

export interface DashboardKpis {
  // Activity
  streak: number;
  accuracy: number;
  totalGames: number;
  aiSessions: number;

  // XP / Level
  xp: number;
  level: number;
  levelProgress: number;
  xpToNextLevel: number;

  // Enrolled subjects with real progress
  enrolledSubjects: EnrolledSubjectKpi[];

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  userRank: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getKpis(): Observable<DashboardKpis> {
    return this.http.get<DashboardKpis>(`${this.base}/dashboard/kpis`);
  }
}
