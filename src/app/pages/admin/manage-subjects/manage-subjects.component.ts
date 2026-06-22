import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SubjectsApi, Subject, Book } from '../../../api/subjects.api';
import { DocumentsApi, SubjectDocument, DocumentCategory } from '../../../api/documents.api';

const DOC_CATEGORIES: DocumentCategory[] = ['COURSE', 'CERTIFICATE', 'TRANSCRIPT', 'OTHER'];
const DOC_ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const DOC_MAX_BYTES = 10 * 1024 * 1024;

const LANGUAGES = ['ARABIC','FRENCH','ENGLISH','SPANISH','OTHER'] as const;
type Lang = typeof LANGUAGES[number];
const LANG_LABELS: Record<string, string> = {
  ARABIC: '🇸🇦 Arabic', FRENCH: '🇫🇷 French', ENGLISH: '🇬🇧 English',
  SPANISH: '🇪🇸 Spanish', OTHER: '🌐 Other',
};

@Component({
  selector: 'app-manage-subjects',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule, DatePipe],
  templateUrl: './manage-subjects.component.html',
})
export class ManageSubjectsComponent implements OnInit {
  private api = inject(SubjectsApi);
  private documentsApi = inject(DocumentsApi);
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

  // ─── Subject documents (uploaded via the documents microservice) ───────────
  readonly docCategories = DOC_CATEGORIES;
  showDocs = false;
  docsSubject: Subject | null = null;
  docBooks: Book[] = [];
  documents: SubjectDocument[] = [];
  docsLoading = false;
  docUploading = false;
  docError = '';
  docFileError = '';
  docFile: File | null = null;

  docForm = this.fb.group({
    title:    [''],
    bookId:   ['', Validators.required],
    category: ['COURSE' as DocumentCategory],
  });

  openDocs(s: Subject) {
    this.docsSubject = s;
    this.documents = [];
    this.docBooks = [];
    this.docFile = null;
    this.docError = '';
    this.docFileError = '';
    this.docForm.reset({ title: '', bookId: '', category: 'COURSE' });
    this.showDocs = true;
    this.loadDocs();
    // Load this subject's books so the admin attaches the document to a real book.
    this.api.getBooks(s.id).subscribe({
      next: b => this.docBooks = b ?? [],
      error: () => this.docBooks = [],
    });
  }

  loadDocs() {
    if (!this.docsSubject) return;
    this.docsLoading = true;
    this.documentsApi.list({ subjectId: this.docsSubject.id }).subscribe({
      next: d => { this.documents = d; this.docsLoading = false; },
      error: () => { this.documents = []; this.docsLoading = false; },
    });
  }

  onDocFile(event: Event) {
    this.docFileError = '';
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) { this.docFile = null; return; }
    if (!DOC_ACCEPTED.includes(file.type)) { this.docFileError = 'Allowed: JPEG, PNG, WebP, PDF'; this.docFile = null; return; }
    if (file.size > DOC_MAX_BYTES) { this.docFileError = 'File exceeds the 10MB limit'; this.docFile = null; return; }
    this.docFile = file;
  }

  uploadDoc() {
    if (!this.docsSubject || !this.docFile) { this.docError = 'Please choose a file'; return; }
    if (this.docForm.invalid) { this.docError = 'Please select a book'; this.docForm.markAllAsTouched(); return; }
    const book = this.docBooks.find(b => b.id === this.docForm.value.bookId);
    if (!book) { this.docError = 'Please select a book'; return; }
    this.docUploading = true;
    this.docError = '';
    const v = this.docForm.value;
    this.documentsApi.upload(this.docFile, {
      subjectId: this.docsSubject.id,
      subjectName: this.docsSubject.name,
      bookId: book.id,
      bookName: book.title,
      title: v.title || undefined,
      category: v.category!,
    }).subscribe({
      next: () => {
        this.docUploading = false;
        this.docFile = null;
        this.docForm.reset({ title: '', bookId: '', category: 'COURSE' });
        this.loadDocs();
      },
      error: e => { this.docUploading = false; this.docError = e?.error?.message ?? 'Upload failed'; },
    });
  }

  viewDoc(doc: SubjectDocument) {
    this.documentsApi.getOne(doc.id).subscribe({
      next: d => { if (d.downloadUrl) window.open(d.downloadUrl, '_blank'); },
    });
  }

  removeDoc(doc: SubjectDocument) {
    if (!confirm(`Delete "${doc.title || doc.originalName}"?`)) return;
    this.documentsApi.delete(doc.id).subscribe({
      next: () => this.documents = this.documents.filter(d => d.id !== doc.id),
    });
  }
}
