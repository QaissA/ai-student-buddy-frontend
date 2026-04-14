import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SubjectsApi, Book, Lesson } from '../../../api/subjects.api';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './book-detail.component.html',
})
export class BookDetailComponent implements OnInit {
  private api  = inject(SubjectsApi);
  private route = inject(ActivatedRoute);

  book: Book | null = null;
  lessons: Lesson[] = [];
  loading = true;

  // Same cycling palette as subjects & books lists
  private accentColors  = ['#4ECDC4', '#FF6B35', '#9B59B6', '#FFD93D'];
  private textOnAccent  = ['#2C3E50', '#ffffff', '#ffffff', '#2C3E50'];
  private badgeOnAccent = ['rgba(44,62,80,0.12)', 'rgba(255,255,255,0.20)', 'rgba(255,255,255,0.20)', 'rgba(44,62,80,0.12)'];

  get colorIndex(): number {
    return Math.max(0, ((this.book?.order ?? 1) - 1)) % 4;
  }
  get bgColor():    string { return this.accentColors[this.colorIndex]; }
  get textColor():  string { return this.textOnAccent[this.colorIndex]; }
  get badgeColor(): string { return this.badgeOnAccent[this.colorIndex]; }

  padOrder(n: number): string { return String(n).padStart(2, '0'); }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getBook(id).subscribe(b  => { this.book = b; });
    this.api.getLessons(id).subscribe({
      next:  l => { this.lessons = l ?? []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
