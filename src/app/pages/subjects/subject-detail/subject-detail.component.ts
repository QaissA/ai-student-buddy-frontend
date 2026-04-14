import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SubjectsApi, Subject, Book } from '../../../api/subjects.api';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './subject-detail.component.html',
})
export class SubjectDetailComponent implements OnInit {
  private api  = inject(SubjectsApi);
  private route = inject(ActivatedRoute);

  subject: Subject | null = null;
  books: Book[] = [];
  loading = true;

  langFlags: Record<string, string | undefined> = {
    ARABIC: '🇸🇦', FRENCH: '🇫🇷', ENGLISH: '🇬🇧', SPANISH: '🇪🇸', OTHER: '📚',
  };

  // Cycling accent palette — same order as subjects list
  cardColors     = ['#4ECDC4', '#FF6B35', '#9B59B6', '#FFD93D'];
  cardTextColors = ['#2C3E50', '#ffffff', '#ffffff', '#2C3E50'];

  // Badge slightly darker/lighter overlay for the order number
  badgeAlpha = ['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.12)'];

  padOrder(n: number): string {
    return String(n).padStart(2, '0');
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getSubject(id).subscribe(s => { this.subject = s; });
    this.api.getBooks(id).subscribe({
      next: b => { this.books = b ?? []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
