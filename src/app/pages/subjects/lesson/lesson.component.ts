import { Component, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { SubjectsApi, Lesson, Quiz, QuizAttemptResult } from '../../../api/subjects.api';
import { TtsService } from '../../../core/services/tts.service';
import { LessonTeacherApi } from '../../../api/lesson-teacher.api';
import { AudioRecorderService } from '../../../core/services/audio-recorder.service';
import { environment } from '../../../../environments/environment';

export type TeacherStatus = 'idle' | 'recording' | 'thinking' | 'speaking';

@Component({
  selector: 'app-lesson',
  standalone: true,
  imports: [RouterLink, PdfViewerModule, NgClass],
  templateUrl: './lesson.component.html',
  styles: [`
    .wave-bar { animation: wave 1.2s ease-in-out infinite; }
    .wave-bar-still { height: 8px; }
    @keyframes wave { 0%, 100% { height: 8px; } 50% { height: 36px; } }
    .mic-pulse { animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite; }
    @keyframes pulse-ring {
      0%   { transform: scale(0.85); opacity: 0.5; }
      50%  { transform: scale(1.15); opacity: 0.25; }
      100% { transform: scale(0.85); opacity: 0.5; }
    }
  `],
})
export class LessonComponent implements OnInit, OnDestroy {
  private api         = inject(SubjectsApi);
  private teacherApi  = inject(LessonTeacherApi);
  private route       = inject(ActivatedRoute);
  private ngZone      = inject(NgZone);
  private recorder    = inject(AudioRecorderService);
  tts                 = inject(TtsService);
  location            = inject(Location);

  lesson:      Lesson | null = null;
  bookLessons: Lesson[] = [];
  quiz:        Quiz | null = null;
  loading      = true;

  // PDF viewer state
  currentPage = 1;
  totalPages  = 0;
  zoom        = 1.0;

  // Quiz state
  quizStarted = false;
  answers: Record<string, number> = {};
  result: QuizAttemptResult | null = null;
  submitting  = false;

  // ── Teacher chat sidebar ──────────────────────────────────────────────────
  teacherOpen        = false;
  startingTeacher    = false;
  teacherSessionId   = '';
  teacherStatus: TeacherStatus = 'idle';
  teacherTranscript  = '';
  teacherReply       = '';

  private mediaBase      = environment.apiUrl.replace('/api/v1', '');
  private currentAudio:  HTMLAudioElement | null = null;
  private blobSub?:      Subscription;

  readonly waveBars   = [0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1, 0];
  readonly suggestions = [
    { label: 'Explain this lesson', emoji: '📖' },
    { label: 'I have a question',   emoji: '❓' },
    { label: 'Say that again',      emoji: '🔄' },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getLesson(id).subscribe(l => {
      this.lesson  = l;
      this.loading = false;
      this.api.getLessons(l.bookId).subscribe({ next: ls => this.bookLessons = ls ?? [], error: () => {} });
      this.api.getQuiz(l.id).subscribe({ next: q => this.quiz = q, error: () => {} });
    });

    this.blobSub = this.recorder.audioBlob$.subscribe(blob => {
      if (blob && this.teacherOpen) this.sendVoice(blob);
    });
  }

  ngOnDestroy() {
    this.blobSub?.unsubscribe();
    this.stopAudio();
  }

  // ── PDF controls ──────────────────────────────────────────────────────────

  afterLoadComplete(pdf: any) { this.totalPages = pdf.numPages; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  zoomIn()   { this.zoom = Math.min(2.0, parseFloat((this.zoom + 0.25).toFixed(2))); }
  zoomOut()  { this.zoom = Math.max(0.5, parseFloat((this.zoom - 0.25).toFixed(2))); }
  get zoomPct(): string { return Math.round(this.zoom * 100) + '%'; }
  get pageArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  // ── Quiz ──────────────────────────────────────────────────────────────────

  submitQuiz() {
    if (!this.lesson || !this.quiz) return;
    this.submitting = true;
    this.api.submitQuiz(this.lesson.id, this.answers).subscribe({
      next:  r => { this.result = r; this.submitting = false; },
      error: () => { this.submitting = false; },
    });
  }

  speakText() { if (this.lesson?.content) this.tts.speak(this.lesson.content); }

  // ── Teacher chat ──────────────────────────────────────────────────────────

  openTeacher() {
    if (!this.lesson || this.startingTeacher) return;

    // Reuse existing session if already opened this page visit
    if (this.teacherSessionId) {
      this.teacherOpen = true;
      return;
    }

    this.startingTeacher = true;
    this.teacherApi.createSession(this.lesson.id).subscribe({
      next: ({ sessionId }) => {
        this.teacherSessionId = sessionId;
        this.teacherOpen      = true;
        this.startingTeacher  = false;
      },
      error: () => { this.startingTeacher = false; },
    });
  }

  closeTeacher() {
    this.stopAudio();
    this.recorder.stop();
    this.teacherStatus = 'idle';
    this.teacherOpen   = false;
  }

  async toggleRecording() {
    if (this.teacherStatus === 'thinking') return;
    if (this.teacherStatus === 'speaking') {
      this.stopAudio();
      this.teacherStatus = 'idle';
      return;
    }
    if (this.teacherStatus === 'recording') {
      this.recorder.stop();
      this.teacherStatus = 'thinking';
    } else {
      this.stopAudio();
      await this.recorder.start();
      this.teacherStatus = 'recording';
    }
  }

  private sendVoice(blob: Blob) {
    this.teacherStatus = 'thinking';
    this.teacherApi.sendVoiceMessage(this.lesson!.id, this.teacherSessionId, blob).subscribe({
      next: ({ transcript, reply, audioUrl }) => {
        this.teacherTranscript = transcript;
        this.teacherReply      = reply;
        this.playAudio(this.mediaBase + audioUrl);
      },
      error: () => { this.teacherStatus = 'idle'; },
    });
  }

  sendSuggestion(text: string) {
    if (this.teacherStatus !== 'idle') return;
    this.teacherStatus    = 'thinking';
    this.teacherTranscript = text;
    this.teacherApi.sendMessage(this.lesson!.id, this.teacherSessionId, text).subscribe({
      next: ({ reply }) => {
        this.teacherReply  = reply;
        this.teacherStatus = 'speaking';
        this.tts.speak(reply);
        const ms = Math.max(reply.length * 60, 3000);
        setTimeout(() => { if (this.teacherStatus === 'speaking') this.teacherStatus = 'idle'; }, ms);
      },
      error: () => { this.teacherStatus = 'idle'; },
    });
  }

  private playAudio(url: string) {
    this.stopAudio();
    this.teacherStatus = 'speaking';
    this.currentAudio  = new Audio(url);
    this.currentAudio.play().catch(() => {
      this.ngZone.run(() => { this.teacherStatus = 'idle'; });
    });
    this.currentAudio.onended = () => {
      this.ngZone.run(() => { this.teacherStatus = 'idle'; });
    };
  }

  private stopAudio() {
    this.tts.stop();
    this.currentAudio?.pause();
    this.currentAudio = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get teacherStatusLabel(): string {
    switch (this.teacherStatus) {
      case 'recording': return 'Listening...';
      case 'thinking':  return 'Thinking...';
      case 'speaking':  return 'Speaking...';
      default:          return 'Tap to ask!';
    }
  }

  get waveActive(): boolean {
    return this.teacherStatus === 'recording' || this.teacherStatus === 'speaking';
  }
}
