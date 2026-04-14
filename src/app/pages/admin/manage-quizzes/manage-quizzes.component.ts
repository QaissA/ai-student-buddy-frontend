import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { SubjectsApi, Subject, Book, Lesson, Quiz, GeneratedQuestion } from '../../../api/subjects.api';

@Component({
  selector: 'app-manage-quizzes',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule, FormsModule],
  templateUrl: './manage-quizzes.component.html',
})
export class ManageQuizzesComponent implements OnInit {
  private api = inject(SubjectsApi);
  private fb  = inject(FormBuilder);

  subjects: Subject[] = [];
  books:    Book[]    = [];
  lessons:  Lesson[]  = [];
  quiz:     Quiz | null = null;

  selectedSubjectId: string | null = null;
  selectedBookId:    string | null = null;
  selectedLesson:    Lesson | null = null;

  loadingSubjects  = true;
  loadingBooks     = false;
  loadingLessons   = false;
  loadingQuiz      = false;
  showForm         = false;
  saving           = false;
  generating       = false;
  questionCount    = 5;
  error            = '';

  form = this.fb.group({
    title:     ['Quiz', Validators.required],
    questions: this.fb.array([]),
  });

  get questions() { return this.form.get('questions') as FormArray; }

  ngOnInit() {
    this.api.getSubjects().subscribe({
      next: s => { this.subjects = s; this.loadingSubjects = false; },
      error: () => { this.loadingSubjects = false; },
    });
  }

  selectSubject(id: string) {
    this.selectedSubjectId = id;
    this.selectedBookId = null;
    this.selectedLesson = null;
    this.quiz = null;
    this.loadingBooks = true;
    this.api.getBooks(id).subscribe({
      next: b => { this.books = b; this.loadingBooks = false; },
      error: () => { this.loadingBooks = false; },
    });
  }

  selectBook(id: string) {
    this.selectedBookId = id;
    this.selectedLesson = null;
    this.quiz = null;
    this.loadingLessons = true;
    this.api.getLessons(id).subscribe({
      next: l => { this.lessons = l; this.loadingLessons = false; },
      error: () => { this.loadingLessons = false; },
    });
  }

  selectLesson(l: Lesson) {
    this.selectedLesson = l;
    this.quiz = null;
    this.loadingQuiz = true;
    this.api.getQuiz(l.id).subscribe({
      next: q => { this.quiz = q; this.loadingQuiz = false; },
      error: () => { this.quiz = null; this.loadingQuiz = false; },
    });
  }

  openCreateQuiz() {
    this.showForm = true;
    this.error = '';
    this.form.reset({ title: `${this.selectedLesson?.title ?? 'Lesson'} Quiz` });
    // Clear questions and add 1 blank
    while (this.questions.length) this.questions.removeAt(0);
    this.addQuestion();
  }

  buildQuestionGroup(): FormGroup {
    return this.fb.group({
      questionText: ['', Validators.required],
      options:       this.fb.array(['', '', '', ''].map(v => this.fb.control(v, Validators.required))),
      correctIndex:  [0, Validators.required],
      explanation:   [''],
    });
  }

  addQuestion() { this.questions.push(this.buildQuestionGroup()); }

  removeQuestion(i: number) { if (this.questions.length > 1) this.questions.removeAt(i); }

  optionsAt(i: number): FormArray {
    return (this.questions.at(i) as FormGroup).get('options') as FormArray;
  }

  save() {
    if (this.form.invalid || !this.selectedLesson) return;
    this.saving = true;
    this.error  = '';

    const body = {
      lessonId:  this.selectedLesson.id,
      title:     this.form.value.title!,
      questions: (this.form.value.questions as any[]).map((q, i) => ({
        questionText: q.questionText,
        options:      q.options,
        correctIndex: Number(q.correctIndex),
        explanation:  q.explanation ?? '',
        order:        i,
      })),
    };

    this.api.createQuiz(body).subscribe({
      next: q => { this.quiz = q; this.showForm = false; this.saving = false; },
      error: e => { this.saving = false; this.error = e?.error?.message ?? 'Failed to create quiz'; },
    });
  }

  generateWithAI() {
    if (!this.selectedLesson) return;
    this.generating = true;
    this.error = '';
    this.api.generateQuizQuestions(this.selectedLesson.id, this.questionCount).subscribe({
      next: ({ questions }) => {
        this.generating = false;
        this.showForm = true;
        this.form.reset({ title: `${this.selectedLesson?.title ?? 'Lesson'} Quiz` });
        while (this.questions.length) this.questions.removeAt(0);
        questions.forEach(q => {
          const g = this.buildQuestionGroup();
          g.patchValue({ questionText: q.questionText, correctIndex: q.correctIndex, explanation: q.explanation });
          const opts = g.get('options') as FormArray;
          q.options.forEach((o, i) => opts.at(i)?.setValue(o));
          this.questions.push(g);
        });
      },
      error: e => { this.generating = false; this.error = e?.error?.message ?? 'AI generation failed'; },
    });
  }

  deleteQuiz() {
    if (!this.quiz || !confirm('Delete this quiz and all its questions?')) return;
    this.api.deleteQuiz(this.quiz.id).subscribe({
      next: () => { this.quiz = null; },
      error: () => {},
    });
  }
}
