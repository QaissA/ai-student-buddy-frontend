import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-session-complete',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './session-complete.component.html',
})
export class SessionCompleteComponent {
  private router = inject(Router);
  score: number = this.router.getCurrentNavigation()?.extras?.state?.['score'] ?? 0;

  get emoji() {
    if (this.score >= 9) return '🏆';
    if (this.score >= 7) return '🎉';
    if (this.score >= 5) return '👍';
    return '📚';
  }

  get message() {
    if (this.score >= 9) return 'Perfect! You\'re a math wizard!';
    if (this.score >= 7) return 'Great job! Keep it up!';
    if (this.score >= 5) return 'Good effort! Practice more!';
    return 'Keep practicing — you\'ll get there!';
  }
}
