import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SubjectsApi, Subject, Book } from '../../../api/subjects.api';

@Component({
  selector: 'app-manage-books',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule],
  templateUrl: './manage-books.component.html',
})
export class ManageBooksComponent implements OnInit {
  private api = inject(SubjectsApi);
  private fb  = inject(FormBuilder);

  subjects: Subject[] = [];
  books:    Book[]    = [];
  selectedSubjectId: string | null = null;

  loadingSubjects = true;
  loadingBooks    = false;
  showForm  = false;
  saving    = false;
  editId: string | null = null;
  error = '';

  form = this.fb.group({
    subjectId:   ['', Validators.required],
    title:       ['', Validators.required],
    description: [''],
    order:       [1],
    isPublished: [false],
  });

  ngOnInit() {
    this.api.getSubjects().subscribe({
      next: s => { this.subjects = s; this.loadingSubjects = false; },
      error: () => { this.loadingSubjects = false; },
    });
  }

  selectSubject(id: string) {
    this.selectedSubjectId = id;
    this.loadingBooks = true;
    this.api.getBooks(id).subscribe({
      next: b => { this.books = b; this.loadingBooks = false; },
      error: () => { this.loadingBooks = false; },
    });
  }

  openCreate() {
    this.editId = null;
    this.form.reset({
      subjectId: this.selectedSubjectId ?? '',
      title: '', description: '', order: this.books.length + 1, isPublished: false,
    });
    this.error = '';
    this.showForm = true;
  }

  openEdit(b: Book) {
    this.editId = b.id;
    this.form.reset({
      subjectId: b.subjectId, title: b.title,
      description: b.description ?? '', order: b.order, isPublished: b.isPublished ?? false,
    });
    this.error = '';
    this.showForm = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    const body = this.form.value as any;
    const req  = this.editId
      ? this.api.updateBook(this.editId, body)
      : this.api.createBook(body);

    req.subscribe({
      next: () => {
        this.saving = false; this.showForm = false;
        if (this.selectedSubjectId) this.selectSubject(this.selectedSubjectId);
      },
      error: (e) => { this.saving = false; this.error = e?.error?.message ?? 'Failed to save'; },
    });
  }

  remove(b: Book) {
    if (!confirm(`Delete "${b.title}" and ALL its lessons? This cannot be undone.`)) return;
    this.api.deleteBook(b.id).subscribe({
      next: () => { if (this.selectedSubjectId) this.selectSubject(this.selectedSubjectId); },
      error: () => {},
    });
  }
}
