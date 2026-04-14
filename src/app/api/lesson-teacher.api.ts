import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LessonTeacherApi {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // POST /lessons/:lessonId/teacher/session → { sessionId }
  createSession(lessonId: string): Observable<{ sessionId: string }> {
    return this.http.post<{ sessionId: string }>(
      `${this.base}/lessons/${lessonId}/teacher/session`,
      {},
    );
  }

  // POST /lessons/:lessonId/teacher/:sessionId/message → { reply }
  sendMessage(lessonId: string, sessionId: string, content: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(
      `${this.base}/lessons/${lessonId}/teacher/${sessionId}/message`,
      { content },
    );
  }

  // POST /lessons/:lessonId/teacher/:sessionId/voice-message → { transcript, reply, audioUrl }
  sendVoiceMessage(
    lessonId: string,
    sessionId: string,
    audioBlob: Blob,
  ): Observable<{ transcript: string; reply: string; audioUrl: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    return this.http.post<{ transcript: string; reply: string; audioUrl: string }>(
      `${this.base}/lessons/${lessonId}/teacher/${sessionId}/voice-message`,
      formData,
    );
  }

  // DELETE /lessons/:lessonId/teacher/:sessionId
  deleteSession(lessonId: string, sessionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/lessons/${lessonId}/teacher/${sessionId}`,
    );
  }
}
