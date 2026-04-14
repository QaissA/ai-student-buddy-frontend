import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PronunciationText { id: string; text: string; language: string; }

export interface PronunciationScore {
  score: number;
  transcript: string;
  wordComparison: { word: string; correct: boolean; yourVersion: string }[];
  feedback: string;
}

@Injectable({ providedIn: 'root' })
export class PronunciationApi {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getTexts(): Observable<PronunciationText[]> {
    return this.http.get<PronunciationText[]>(`${this.base}/pronunciation/texts`);
  }

  getText(id: string): Observable<PronunciationText> {
    return this.http.get<PronunciationText>(`${this.base}/pronunciation/texts/${id}`);
  }

  submitRecording(textId: string, audioBlob: Blob): Observable<PronunciationScore> {
    const form = new FormData();
    form.append('audio', audioBlob, 'recording.webm');
    return this.http.post<PronunciationScore>(`${this.base}/pronunciation/texts/${textId}/score`, form);
  }
}
