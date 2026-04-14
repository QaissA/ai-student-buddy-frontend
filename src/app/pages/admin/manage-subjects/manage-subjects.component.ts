import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SubjectsApi, Subject } from '../../../api/subjects.api';

const LANGUAGES = ['ARABIC','FRENCH','ENGLISH','SPANISH','OTHER'] as const;
type Lang = typeof LANGUAGES[number];
const LANG_LABELS: Record<string, string> = {
  ARABIC: '🇸🇦 Arabic', FRENCH: '🇫🇷 French', ENGLISH: '🇬🇧 English',
  SPANISH: '🇪🇸 Spanish', OTHER: '🌐 Other',
};

@Component({
  selector: 'app-manage-subjects',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule],
  templateUrl: './manage-subjects.component.html',
})
export class ManageSubjectsComponent implements OnInit {
  private api = inject(SubjectsApi);
  private fb  = inject(FormBuilder);

  subjects: Subject[] = [];
  loading   = true;
  showForm  = false;
  saving    = false;
  editId: string | null = null;
  error = '';

  readonly languages = LANGUAGES;
  readonly langLabels = LANG_LABELS;

  form = this.fb.group({
    name:        ['', Validators.required],
    language:    ['FRENCH' as Lang, Validators.required],
    description: [''],
    isActive:    [true],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getSubjects().subscribe({
      next:  s => { this.subjects = s; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openCreate() {
    this.editId = null;
    this.form.reset({ name: '', language: 'FRENCH', description: '', isActive: true });
    this.error = '';
    this.showForm = true;
  }

  openEdit(s: Subject) {
    this.editId = s.id;
    this.form.reset({ name: s.name, language: s.language as Lang, description: s.description ?? '', isActive: s.isActive ?? true });
    this.error = '';
    this.showForm = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    const body = this.form.value as any;
    const req  = this.editId
      ? this.api.updateSubject(this.editId, body)
      : this.api.createSubject(body);

    req.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.load(); },
      error: (e) => { this.saving = false; this.error = e?.error?.message ?? 'Failed to save'; },
    });
  }

  remove(s: Subject) {
    if (!confirm(`Delete "${s.name}" and ALL its books/lessons? This cannot be undone.`)) return;
    this.api.deleteSubject(s.id).subscribe({ next: () => this.load(), error: () => {} });
  }
}
