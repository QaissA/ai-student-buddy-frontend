import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type Language = 'ARABIC' | 'FRENCH' | 'ENGLISH' | 'SPANISH' | 'OTHER';
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Message { role: 'user' | 'assistant'; content: string; audioUrl?: string; }

export interface AiSession {
  id: string;
  language: Language;
  level: LanguageLevel;
  topic: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AiApi {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // GET /ai/sessions — list sessions (no messages payload)
  getSessions(): Observable<Omit<AiSession, 'messages'>[]> {
    return this.http.get<Omit<AiSession, 'messages'>[]>(`${this.base}/ai/sessions`);
  }

  // GET /ai/session/:id — full session including messages array
  getSession(id: string): Observable<AiSession> {
    return this.http.get<AiSession>(`${this.base}/ai/session/${id}`);
  }

  // POST /ai/session — returns { sessionId }
  createSession(language: Language, level: LanguageLevel, topic: string): Observable<{ sessionId: string }> {
    return this.http.post<{ sessionId: string }>(`${this.base}/ai/session`, { language, level, topic });
  }

  // POST /ai/session/:id/message — returns { reply }
  sendMessage(sessionId: string, content: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.base}/ai/session/${sessionId}/message`, { content });
  }

  // POST /ai/session/:id/voice-message — returns { transcript, reply, audioUrl }
  sendVoiceMessage(sessionId: string, audioBlob: Blob): Observable<{ transcript: string; reply: string; audioUrl: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    return this.http.post<{ transcript: string; reply: string; audioUrl: string }>(
      `${this.base}/ai/session/${sessionId}/voice-message`,
      formData,
    );
  }

  // DELETE /ai/session/:id
  deleteSession(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/ai/session/${id}`);
  }
}
