import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SubjectsApi, Subject, Book } from '../../../api/subjects.api';
import { DocumentsApi, SubjectDocument } from '../../../api/documents.api';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './subject-detail.component.html',
})
export class SubjectDetailComponent implements OnInit {
  private api  = inject(SubjectsApi);
  private documentsApi = inject(DocumentsApi);
  private route = inject(ActivatedRoute);

  subject: Subject | null = null;
  books: Book[] = [];
  documents: SubjectDocument[] = [];
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
    // Documents the school's admin uploaded to this subject (from the documents service).
    this.documentsApi.list({ subjectId: id }).subscribe({
      next: d => { this.documents = d ?? []; },
      error: () => { this.documents = []; },
    });
  }

  /** Open a document via a fresh, short-lived presigned URL. */
  openDocument(doc: SubjectDocument) {
    this.documentsApi.getOne(doc.id).subscribe({
      next: d => { if (d.downloadUrl) window.open(d.downloadUrl, '_blank'); },
    });
  }
}
