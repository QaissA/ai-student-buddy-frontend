import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ExerciseType = 'ADDITION' | 'SUBTRACTION' | 'MULTIPLICATION' | 'DIVISION';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Exercise {
  type: ExerciseType;
  operandA: number;
  operandB: number;
  correctAnswer: number;
}

export interface AttemptResult {
  correct: boolean;
  correctAnswer: number;
  userAnswer: number;
  timeTakenMs: number;
  pointsEarned: number;
}

export interface ExerciseStats {
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number;
  streak: number;
}

@Injectable({ providedIn: 'root' })
export class ExercisesApi {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // GET /exercises/generate?type=ADDITION&difficulty=easy
  generateExercise(type: ExerciseType, difficulty: Difficulty = 'easy'): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.base}/exercises/generate`, {
      params: { type, difficulty },
    });
  }

  // POST /exercises/attempt — submit answer with full exercise context
  submitAttempt(
    exerciseType: ExerciseType,
    operandA: number,
    operandB: number,
    userAnswer: number,
    timeTakenMs?: number,
  ): Observable<AttemptResult> {
    return this.http.post<AttemptResult>(`${this.base}/exercises/attempt`, {
      exerciseType,
      operandA,
      operandB,
      userAnswer,
      ...(timeTakenMs !== undefined ? { timeTakenMs } : {}),
    });
  }

  // GET /exercises/stats
  getStats(): Observable<ExerciseStats> {
    return this.http.get<ExerciseStats>(`${this.base}/exercises/stats`);
  }
}
