import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Subject {
  id: string;
  name: string;
  description?: string;
  language: string;
  iconUrl?: string;
  isActive?: boolean;
  bookCount?: number;
  lessonCount?: number;
  isEnrolled?: boolean;
}
export interface Book {
  id: string;
  title: string;
  description?: string;
  order: number;
  isPublished?: boolean;
  lessonCount?: number;
  subjectId: string;
}
export interface Lesson {
  id: string;
  title: string;
  type: 'TEXT' | 'PDF';
  order: number;
  isPublished?: boolean;
  content?: string;
  pdfUrl?: string;
  bookId: string;
  images?: LessonImage[];
}
export interface LessonImage {
  id: string;
  lessonId: string;
  url: string;
  filename: string;
  altText?: string;
  order: number;
}
export interface Quiz    { id: string; lessonId: string; title: string; questions: Question[]; }
export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
  order: number;
}
export interface QuizAttemptResult {
  score: number;
  answers: { questionId: string; isCorrect: boolean; explanation?: string }[];
}
export interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

@Injectable({ providedIn: 'root' })
export class SubjectsApi {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Subjects ─────────────────────────────────────────────────────────────────
  getSubjects(): Observable<Subject[]>         { return this.http.get<Subject[]>(`${this.base}/subjects`); }
  getSubject(id: string): Observable<Subject>  { return this.http.get<Subject>(`${this.base}/subjects/${id}`); }
  createSubject(body: Partial<Subject>): Observable<Subject> {
    return this.http.post<Subject>(`${this.base}/subjects`, body);
  }
  updateSubject(id: string, body: Partial<Subject>): Observable<Subject> {
    return this.http.patch<Subject>(`${this.base}/subjects/${id}`, body);
  }
  deleteSubject(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/subjects/${id}`);
  }

  // ── Books ─────────────────────────────────────────────────────────────────────
  getBooks(subjectId: string): Observable<Book[]>  { return this.http.get<Book[]>(`${this.base}/subjects/${subjectId}/books`); }
  getBook(id: string): Observable<Book>             { return this.http.get<Book>(`${this.base}/books/${id}`); }
  createBook(body: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(`${this.base}/books`, body);
  }
  updateBook(id: string, body: Partial<Book>): Observable<Book> {
    return this.http.patch<Book>(`${this.base}/books/${id}`, body);
  }
  deleteBook(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/books/${id}`);
  }

  // ── Lessons ──────────────────────────────────────────────────────────────────
  getLessons(bookId: string): Observable<Lesson[]>   { return this.http.get<Lesson[]>(`${this.base}/books/${bookId}/lessons`); }
  getLesson(id: string): Observable<Lesson>          { return this.http.get<Lesson>(`${this.base}/lessons/${id}`); }
  createLesson(formData: FormData): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.base}/lessons`, formData);
  }
  updateLesson(id: string, formData: FormData): Observable<Lesson> {
    return this.http.patch<Lesson>(`${this.base}/lessons/${id}`, formData);
  }
  deleteLesson(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/lessons/${id}`);
  }

  // ── Lesson images ─────────────────────────────────────────────────────────────
  getLessonImages(lessonId: string): Observable<LessonImage[]> {
    return this.http.get<LessonImage[]>(`${this.base}/lessons/${lessonId}/images`);
  }
  uploadLessonImage(lessonId: string, formData: FormData): Observable<LessonImage> {
    return this.http.post<LessonImage>(`${this.base}/lessons/${lessonId}/images`, formData);
  }
  deleteLessonImage(lessonId: string, imageId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/lessons/${lessonId}/images/${imageId}`);
  }

  // ── Quizzes ──────────────────────────────────────────────────────────────────
  getQuiz(lessonId: string): Observable<Quiz>  { return this.http.get<Quiz>(`${this.base}/lessons/${lessonId}/quiz`); }
  createQuiz(body: {
    lessonId: string;
    title: string;
    questions: { questionText: string; options: string[]; correctIndex: number; explanation?: string; order?: number }[];
  }): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.base}/quizzes`, body);
  }
  deleteQuiz(quizId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/quizzes/${quizId}`);
  }
  generateQuizQuestions(lessonId: string, questionCount = 5): Observable<{ questions: GeneratedQuestion[] }> {
    return this.http.post<{ questions: GeneratedQuestion[] }>(`${this.base}/quizzes/generate`, { lessonId, questionCount });
  }
  explainLesson(lessonId: string, body: { question?: string; level?: string }): Observable<{ explanation: string }> {
    return this.http.post<{ explanation: string }>(`${this.base}/lessons/${lessonId}/explain`, body);
  }
  submitQuiz(lessonId: string, answers: Record<string, number>): Observable<QuizAttemptResult> {
    return this.http.post<QuizAttemptResult>(`${this.base}/lessons/${lessonId}/quiz/attempt`, { answers });
  }
}
