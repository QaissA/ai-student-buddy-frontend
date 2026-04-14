import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExercisesApi, Exercise, ExerciseType, Difficulty } from '../../../api/exercises.api';

export interface Choice { value: number; state: 'default' | 'correct' | 'wrong'; }

@Component({
  selector: 'app-active-game',
  standalone: true,
  imports: [NgClass, RouterLink, TitleCasePipe],
  templateUrl: './active-game.component.html',
  styles: [`
    .grid-bg {
      background-color: #FFFBF0;
      background-image:
        linear-gradient(rgba(44,62,80,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(44,62,80,0.05) 1px, transparent 1px);
      background-size: 32px 32px;
    }
    @keyframes pop-in {
      0%   { transform: scale(0.8); opacity: 0; }
      70%  { transform: scale(1.06); }
      100% { transform: scale(1); opacity: 1; }
    }
    .pop-in { animation: pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-8px); }
      40%     { transform: translateX(8px); }
      60%     { transform: translateX(-5px); }
      80%     { transform: translateX(5px); }
    }
    .shake { animation: shake 0.4s ease; }

    @keyframes correct-flash {
      0%,100% { background: white; }
      50%     { background: rgba(78,205,196,0.2); }
    }
    .correct-flash { animation: correct-flash 0.5s ease; }
  `],
})
export class ActiveGameComponent implements OnInit, OnDestroy {
  private api    = inject(ExercisesApi);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  type:       ExerciseType = 'ADDITION';
  difficulty: Difficulty   = 'easy';
  exercise:   Exercise | null = null;

  choices:  Choice[] = [];
  chosen:   number | null = null;
  feedback: 'correct' | 'wrong' | null = null;

  score    = 0;
  streak   = 0;
  round    = 0;
  loading  = false;

  // Timer
  readonly TIMER_SECONDS = 15;
  timeLeft  = this.TIMER_SECONDS;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  private startTime = 0;

  readonly typeColors: Record<ExerciseType, string> = {
    ADDITION:       '#FF6B35',
    SUBTRACTION:    '#4ECDC4',
    MULTIPLICATION: '#9B59B6',
    DIVISION:       '#FFD93D',
  };

  readonly typeSymbols: Record<ExerciseType, string> = {
    ADDITION: '+', SUBTRACTION: '−', MULTIPLICATION: '×', DIVISION: '÷',
  };

  readonly typeLabels: Record<ExerciseType, string> = {
    ADDITION: 'Addition Quest', SUBTRACTION: 'Subtraction Sprint',
    MULTIPLICATION: 'Multiply Mania', DIVISION: 'Division Dash',
  };

  readonly diffEmoji: Record<Difficulty, string> = {
    easy: '🌱', medium: '🔥', hard: '💥',
  };

  // ── SVG timer arc ─────────────────────────────────────────────────────────
  readonly RADIUS = 36;
  readonly CIRCUMFERENCE = 2 * Math.PI * this.RADIUS;

  get timerDash(): string {
    const pct = this.timeLeft / this.TIMER_SECONDS;
    return `${this.CIRCUMFERENCE * pct} ${this.CIRCUMFERENCE}`;
  }

  get timerColor(): string {
    if (this.timeLeft > 8) return '#4ECDC4';
    if (this.timeLeft > 4) return '#FFD93D';
    return '#FF6B35';
  }

  get accentColor(): string { return this.typeColors[this.type]; }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit() {
    this.type       = (this.route.snapshot.paramMap.get('type') as ExerciseType) || 'ADDITION';
    this.difficulty = (this.route.snapshot.queryParamMap.get('difficulty') as Difficulty) || 'easy';
    this.nextRound();
  }

  ngOnDestroy() { this.clearTimer(); }

  // ── Game logic ────────────────────────────────────────────────────────────

  nextRound() {
    this.clearTimer();
    this.loading  = true;
    this.feedback = null;
    this.chosen   = null;
    this.choices  = [];
    this.api.generateExercise(this.type, this.difficulty).subscribe({
      next: e => {
        this.exercise  = e;
        this.loading   = false;
        this.choices   = this.buildChoices(e.correctAnswer);
        this.startTime = Date.now();
        this.startTimer();
      },
      error: () => { this.loading = false; },
    });
  }

  select(choice: Choice) {
    if (this.feedback || !this.exercise) return;
    this.clearTimer();
    this.chosen = choice.value;
    const correct = choice.value === this.exercise.correctAnswer;
    this.feedback = correct ? 'correct' : 'wrong';

    // Mark states
    this.choices.forEach(c => {
      if (c.value === this.exercise!.correctAnswer) c.state = 'correct';
      else if (c.value === this.chosen)             c.state = 'wrong';
    });

    if (correct) {
      this.score += this.pointsForTime();
      this.streak++;
    } else {
      this.streak = 0;
    }

    this.round++;
    const delay = this.round >= 10 ? 1400 : 1100;
    setTimeout(() => {
      if (this.round >= 10) {
        this.router.navigate(['/exercises/complete'], {
          state: { score: this.score, type: this.type, difficulty: this.difficulty },
        });
      } else {
        this.nextRound();
      }
    }, delay);
  }

  // ── Timer ─────────────────────────────────────────────────────────────────

  private startTimer() {
    this.timeLeft = this.TIMER_SECONDS;
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.timeExpired();
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  private timeExpired() {
    if (this.feedback || !this.exercise) return;
    this.feedback = 'wrong';
    this.streak = 0;
    this.choices.forEach(c => {
      c.state = c.value === this.exercise!.correctAnswer ? 'correct' : 'default';
    });
    this.round++;
    setTimeout(() => {
      if (this.round >= 10) {
        this.router.navigate(['/exercises/complete'], {
          state: { score: this.score, type: this.type, difficulty: this.difficulty },
        });
      } else {
        this.nextRound();
      }
    }, 1400);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildChoices(correct: number): Choice[] {
    const distractors = new Set<number>();
    const spread = Math.max(5, Math.round(correct * 0.2));
    while (distractors.size < 3) {
      const delta = (Math.floor(Math.random() * spread) + 1) * (Math.random() < 0.5 ? 1 : -1);
      const v = correct + delta;
      if (v !== correct && v > 0 && !distractors.has(v)) distractors.add(v);
    }
    const all: Choice[] = [{ value: correct, state: 'default' },
      ...[...distractors].map(v => ({ value: v, state: 'default' as const }))];
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  }

  private pointsForTime(): number {
    if (this.timeLeft >= 12) return 15;
    if (this.timeLeft >= 8)  return 10;
    if (this.timeLeft >= 4)  return 7;
    return 5;
  }
}
