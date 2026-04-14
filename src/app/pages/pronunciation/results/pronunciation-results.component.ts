import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PronunciationScore } from '../../../api/pronunciation.api';

@Component({
  selector: 'app-pronunciation-results',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pronunciation-results.component.html',
})
export class PronunciationResultsComponent {
  private router = inject(Router);
  score: PronunciationScore | null = this.router.getCurrentNavigation()?.extras?.state?.['score'] ?? null;
  textId = this.router.getCurrentNavigation()?.extras?.state?.['textId'] ?? '';

  get scoreColor() {
    if (!this.score) return 'text-anchor';
    if (this.score.score >= 80) return 'text-green-500';
    if (this.score.score >= 60) return 'text-achievement';
    return 'text-red-400';
  }
}
