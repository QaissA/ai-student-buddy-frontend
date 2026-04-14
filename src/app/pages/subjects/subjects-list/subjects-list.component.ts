import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SubjectsApi, Subject } from '../../../api/subjects.api';

@Component({
  selector: 'app-subjects-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './subjects-list.component.html',
})
export class SubjectsListComponent implements OnInit {
  private api = inject(SubjectsApi);
  subjects: Subject[] = [];
  loading = true;

  langFlags: Record<string, string | undefined> = {
    ARABIC: '🇸🇦', FRENCH: '🇫🇷', ENGLISH: '🇬🇧', SPANISH: '🇪🇸', OTHER: '📚',
  };

  // Cycles through the Stitch Editorial Play accent palette
  accentColors = ['#4ECDC4', '#FF6B35', '#9B59B6', '#FFD93D'];
  accentTextColors = ['#2C3E50', '#ffffff', '#ffffff', '#2C3E50'];

  get enrolledCount(): number {
    return this.subjects.filter(s => s.isEnrolled).length;
  }

  ngOnInit() {
    this.api.getSubjects().subscribe({
      next: s => { this.subjects = s ?? []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
