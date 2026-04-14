import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ExerciseType, Difficulty, ExercisesApi, ExerciseStats } from '../../../api/exercises.api';

interface GameCard {
  type: ExerciseType;
  label: string;
  operator: string;
  color: string;
  bg: string;
  glow: string;
  border: string;
  desc: string;
}

interface DifficultyOption {
  id: Difficulty;
  label: string;
  emoji: string;
  desc: string;
  range: string;
  color: string;
  bg: string;
  border: string;
}

@Component({
  selector: 'app-game-selector',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './game-selector.component.html',
  styles: [`
    .pattern-bg {
      background-color: #FFFBF0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD93D' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .hover-card {
      transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 300ms ease;
    }
    .hover-card:hover {
      transform: translateY(-8px) rotate(1deg);
      box-shadow: 0 20px 40px -12px rgba(44, 62, 80, 0.22);
    }
    .hover-card.selected {
      transform: translateY(-6px) rotate(0.5deg);
    }
    .diff-btn {
      transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .diff-btn:hover { transform: scale(1.04); }
    .diff-btn.selected { transform: scale(1.06); }
  `],
})
export class GameSelectorComponent implements OnInit {
  private api = inject(ExercisesApi);

  stats: ExerciseStats | null = null;
  selected: ExerciseType = 'ADDITION';
  difficulty: Difficulty = 'easy';

  games: GameCard[] = [
    {
      type: 'ADDITION',
      label: 'Addition',
      operator: '+',
      color: '#FF6B35',
      bg: 'rgba(255,107,53,0.12)',
      glow: 'rgba(255,107,53,0.35)',
      border: 'rgba(255,107,53,0.3)',
      desc: 'Add numbers together!',
    },
    {
      type: 'SUBTRACTION',
      label: 'Subtraction',
      operator: '−',
      color: '#4ECDC4',
      bg: 'rgba(78,205,196,0.12)',
      glow: 'rgba(78,205,196,0.35)',
      border: 'rgba(78,205,196,0.3)',
      desc: 'Find the difference!',
    },
    {
      type: 'MULTIPLICATION',
      label: 'Multiplication',
      operator: '×',
      color: '#9B59B6',
      bg: 'rgba(155,89,182,0.12)',
      glow: 'rgba(155,89,182,0.35)',
      border: 'rgba(155,89,182,0.3)',
      desc: 'Multiply like a pro!',
    },
    {
      type: 'DIVISION',
      label: 'Division',
      operator: '÷',
      color: '#FFD93D',
      bg: 'rgba(255,217,61,0.15)',
      glow: 'rgba(255,217,61,0.4)',
      border: 'rgba(255,217,61,0.4)',
      desc: 'Divide and conquer!',
    },
  ];

  difficulties: DifficultyOption[] = [
    {
      id: 'easy',
      label: 'Easy',
      emoji: '🌱',
      desc: 'Great for beginners',
      range: '1 – 10',
      color: '#4ECDC4',
      bg: 'rgba(78,205,196,0.1)',
      border: 'rgba(78,205,196,0.3)',
    },
    {
      id: 'medium',
      label: 'Medium',
      emoji: '🔥',
      desc: 'A real challenge',
      range: '10 – 100',
      color: '#FF6B35',
      bg: 'rgba(255,107,53,0.1)',
      border: 'rgba(255,107,53,0.3)',
    },
    {
      id: 'hard',
      label: 'Hard',
      emoji: '💥',
      desc: 'For math masters',
      range: '100 – 999',
      color: '#9B59B6',
      bg: 'rgba(155,89,182,0.1)',
      border: 'rgba(155,89,182,0.3)',
    },
  ];

  ngOnInit() {
    this.api.getStats().subscribe({ next: s => this.stats = s, error: () => {} });
  }

  get selectedGame(): GameCard {
    return this.games.find(g => g.type === this.selected)!;
  }
}
