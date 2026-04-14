import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScoresApi, LeaderboardEntry, MyStats } from '../../api/scores.api';

const ACTIVITY_META: Record<string, { label: string; emoji: string }> = {
  EXERCISE_ATTEMPT:    { label: 'Exercise',    emoji: '🎮' },
  QUIZ_ATTEMPT:        { label: 'Quiz',         emoji: '📝' },
  AI_SESSION:          { label: 'AI Tutor',     emoji: '🤖' },
  AI_MESSAGE:          { label: 'AI Chat',      emoji: '💬' },
  PRONUNCIATION_ATTEMPT: { label: 'Speaking',   emoji: '🎤' },
  SUBJECT_ENROLLMENT:  { label: 'Enrolled',     emoji: '📚' },
  LESSON_CHAT_SESSION: { label: 'Lesson Chat',  emoji: '💡' },
  LESSON_CHAT_MESSAGE: { label: 'Lesson Q&A',   emoji: '🧑‍🏫' },
};

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [DecimalPipe, DatePipe, RouterLink],
  templateUrl: './leaderboard.component.html',
  styles: [`
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-6px); }
    }
    .float { animation: float 3s ease-in-out infinite; }

    @keyframes pop-in {
      0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
      100% { opacity: 1; transform: scale(1)    translateY(0); }
    }
    .pop-in { animation: pop-in 0.4s ease-out forwards; }
  `],
})
export class LeaderboardComponent implements OnInit {
  private scoresApi = inject(ScoresApi);

  leaderboard: LeaderboardEntry[] = [];
  myStats: MyStats | null = null;
  loading = true;

  readonly podiumConfig = [
    { medal: '🥇', color: '#FFD93D', bg: 'rgba(255,217,61,0.15)', border: 'rgba(255,217,61,0.4)',  height: 'h-28', order: 1 },
    { medal: '🥈', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)', height: 'h-20', order: 0 },
    { medal: '🥉', color: '#F97316', bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.4)',  height: 'h-16', order: 2 },
  ];

  ngOnInit() {
    this.scoresApi.getLeaderboard().subscribe({
      next: (data) => { this.leaderboard = data; this.loading = false; },
      error: () => { this.loading = false; },
    });

    this.scoresApi.getMyStats().subscribe({
      next: (data) => { this.myStats = data; },
      error: () => {},
    });
  }

  get top3(): LeaderboardEntry[] { return this.leaderboard.slice(0, 3); }
  get rest(): LeaderboardEntry[]  { return this.leaderboard.slice(3); }

  activityMeta(type: string) {
    return ACTIVITY_META[type] ?? { label: type, emoji: '⭐' };
  }
}
