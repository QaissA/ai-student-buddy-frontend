import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  isRecording$ = new BehaviorSubject<boolean>(false);
  audioBlob$ = new BehaviorSubject<Blob | null>(null);

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.chunks = [];
    this.audioBlob$.next(null);

    this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data);
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: 'audio/webm' });
      this.audioBlob$.next(blob);
      stream.getTracks().forEach(t => t.stop());
    };

    this.mediaRecorder.start();
    this.isRecording$.next(true);
  }

  stop(): void {
    this.mediaRecorder?.stop();
    this.isRecording$.next(false);
  }
}
