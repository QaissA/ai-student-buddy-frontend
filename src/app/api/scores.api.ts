import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LeaderboardEntry {
  rank: number;
  firstName: string;
  totalScore: number;
  isMe: boolean;
}

export interface ScoreEvent {
  activityType: string;
  points: number;
  createdAt: string;
}

export interface MyStats {
  totalScore: number;
  rank: number;
  recentEvents: ScoreEvent[];
}

@Injectable({ providedIn: 'root' })
export class ScoresApi {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.base}/scores/leaderboard`);
  }

  getMyStats(): Observable<MyStats> {
    return this.http.get<MyStats>(`${this.base}/scores/me`);
  }
}
