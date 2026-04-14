import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SubjectsApi, Subject, Book, Lesson, LessonImage } from '../../../api/subjects.api';

@Component({
  selector: 'app-manage-lessons',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule],
  templateUrl: './manage-lessons.component.html',
})
export class ManageLessonsComponent implements OnInit {
  private api = inject(SubjectsApi);
  private fb  = inject(FormBuilder);

  subjects: Subject[] = [];
  books:    Book[]    = [];
  lessons:  Lesson[]  = [];

  selectedSubjectId: string | null = null;
  selectedBookId:    string | null = null;

  loadingSubjects = true;
  loadingBooks    = false;
  loadingLessons  = false;

  showForm   = false;
  saving     = false;
  editId:    string | null = null;
  pdfFile:   File | null   = null;
  error = '';

  // Image management
  imageLesson:    Lesson | null = null;
  images:         LessonImage[] = [];
  imageFile:      File | null   = null;
  imageAlt        = '';
  uploadingImage  = false;

  form = this.fb.group({
    bookId:      ['', Validators.required],
    title:       ['', Validators.required],
    type:        ['TEXT'],
    content:     [''],
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
    this.selectedBookId = null;
    this.lessons = [];
    this.loadingBooks = true;
    this.api.getBooks(id).subscribe({
      next: b => { this.books = b; this.loadingBooks = false; },
      error: () => { this.loadingBooks = false; },
    });
  }

  selectBook(id: string) {
    this.selectedBookId = id;
    this.loadingLessons = true;
    this.api.getLessons(id).subscribe({
      next: l => { this.lessons = l; this.loadingLessons = false; },
      error: () => { this.loadingLessons = false; },
    });
  }

  openCreate() {
    this.editId  = null;
    this.pdfFile = null;
    this.form.reset({
      bookId: this.selectedBookId ?? '', title: '', type: 'TEXT',
      content: '', order: this.lessons.length + 1, isPublished: false,
    });
    this.error = '';
    this.showForm = true;
  }

  openEdit(l: Lesson) {
    this.editId  = l.id;
    this.pdfFile = null;
    this.form.reset({
      bookId: l.bookId, title: l.title, type: l.type,
      content: l.content ?? '', order: l.order, isPublished: l.isPublished ?? false,
    });
    this.error = '';
    this.showForm = true;
  }

  onPdfChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.pdfFile = input.files?.[0] ?? null;
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error  = '';

    const fd = new FormData();
    const v  = this.form.value;
    fd.append('bookId', v.bookId!);
    fd.append('title',  v.title!);
    fd.append('type',   v.type!);
    if (v.content)     fd.append('content',     v.content);
    if (v.order != null) fd.append('order',     String(v.order));
    fd.append('isPublished', String(v.isPublished ?? false));
    if (this.pdfFile)  fd.append('file', this.pdfFile);

    const req = this.editId
      ? this.api.updateLesson(this.editId, fd)
      : this.api.createLesson(fd);

    req.subscribe({
      next: () => {
        this.saving = false; this.showForm = false;
        if (this.selectedBookId) this.selectBook(this.selectedBookId);
      },
      error: (e) => { this.saving = false; this.error = e?.error?.message ?? 'Failed to save'; },
    });
  }

  remove(l: Lesson) {
    if (!confirm(`Delete "${l.title}"? This also deletes all images.`)) return;
    this.api.deleteLesson(l.id).subscribe({
      next: () => { if (this.selectedBookId) this.selectBook(this.selectedBookId); },
      error: () => {},
    });
  }

  // ── Images ──────────────────────────────────────────────────────────────────

  openImages(l: Lesson) {
    this.imageLesson = l;
    this.images = l.images ?? [];
    this.imageFile = null;
    this.imageAlt  = '';
    // Reload fresh images
    this.api.getLessonImages(l.id).subscribe({ next: imgs => this.images = imgs, error: () => {} });
  }

  onImageFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.imageFile = input.files?.[0] ?? null;
  }

  uploadImage() {
    if (!this.imageFile || !this.imageLesson) return;
    this.uploadingImage = true;
    const fd = new FormData();
    fd.append('file', this.imageFile);
    if (this.imageAlt) fd.append('altText', this.imageAlt);

    this.api.uploadLessonImage(this.imageLesson.id, fd).subscribe({
      next: img => {
        this.images.push(img);
        this.imageFile = null;
        this.imageAlt  = '';
        this.uploadingImage = false;
      },
      error: () => { this.uploadingImage = false; },
    });
  }

  deleteImage(img: LessonImage) {
    if (!this.imageLesson) return;
    this.api.deleteLessonImage(this.imageLesson.id, img.id).subscribe({
      next: () => { this.images = this.images.filter(i => i.id !== img.id); },
      error: () => {},
    });
  }
}
