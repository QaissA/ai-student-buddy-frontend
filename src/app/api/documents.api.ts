import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type DocumentCategory = 'COURSE' | 'CERTIFICATE' | 'TRANSCRIPT' | 'OTHER';

export interface SubjectDocument {
  id: string;
  organizationId: string | null;
  uploadedById: string;
  title?: string;
  category: DocumentCategory;
  subjectId: string;
  subjectName?: string;
  bookId?: string;
  bookName?: string;
  ownerId?: string;
  moduleId?: string;
  bucket: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  createdAt: string;
  updatedAt: string;
  // Present only on getOne(): a fresh, time-limited download URL + whether AI text exists.
  downloadUrl?: string;
  hasText?: boolean;
}

export interface ListDocumentsParams {
  subjectId?: string;
  bookId?: string;
  category?: DocumentCategory;
}

export interface UploadDocumentFields {
  subjectId: string;
  bookId: string;
  bookName: string;
  subjectName?: string;
  title?: string;
  category?: DocumentCategory;
}

export interface DocChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeneratedExercise {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * Talks to the standalone documents microservice. In dev this hits :3100 directly
 * (environment.documentsApiUrl); in prod it is same-origin and nginx routes it.
 * The shared JWT interceptor attaches the bearer token automatically.
 */
@Injectable({ providedIn: 'root' })
export class DocumentsApi {
  private http = inject(HttpClient);
  private base = `${environment.documentsApiUrl}/documents`;

  upload(file: File, fields: UploadDocumentFields): Observable<SubjectDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('subjectId', fields.subjectId);
    form.append('bookId', fields.bookId);
    form.append('bookName', fields.bookName);
    if (fields.subjectName) form.append('subjectName', fields.subjectName);
    if (fields.title) form.append('title', fields.title);
    if (fields.category) form.append('category', fields.category);
    return this.http.post<SubjectDocument>(this.base, form);
  }

  list(params: ListDocumentsParams = {}): Observable<SubjectDocument[]> {
    let httpParams = new HttpParams();
    if (params.subjectId) httpParams = httpParams.set('subjectId', params.subjectId);
    if (params.bookId) httpParams = httpParams.set('bookId', params.bookId);
    if (params.category) httpParams = httpParams.set('category', params.category);
    return this.http.get<SubjectDocument[]>(this.base, { params: httpParams });
  }

  getOne(id: string): Observable<SubjectDocument> {
    return this.http.get<SubjectDocument>(`${this.base}/${id}`);
  }

  /** URL that streams the raw file bytes (for the in-page PDF viewer). */
  rawUrl(id: string): string {
    return `${this.base}/${id}/raw`;
  }

  /**
   * Fetch the raw file bytes through Angular HttpClient (so the JWT interceptor adds
   * auth) for the PDF viewer. Returns the bytes as an ArrayBuffer.
   */
  rawArrayBuffer(id: string): Observable<ArrayBuffer> {
    return this.http.get(`${this.base}/${id}/raw`, { responseType: 'arraybuffer' });
  }

  /**
   * Ask the AI a question grounded on the document's text. History is kept client-side.
   * Optionally include an image (data URL) the student is asking about.
   */
  chat(
    id: string,
    message: string,
    history: DocChatTurn[] = [],
    image?: string,
  ): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.base}/${id}/chat`, {
      message,
      history,
      ...(image ? { image } : {}),
    });
  }

  /** Generate practice exercises from the document's text. */
  generateExercises(id: string): Observable<{ exercises: GeneratedExercise[] }> {
    return this.http.post<{ exercises: GeneratedExercise[] }>(`${this.base}/${id}/exercises`, {});
  }

  delete(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(`${this.base}/${id}`);
  }
}
