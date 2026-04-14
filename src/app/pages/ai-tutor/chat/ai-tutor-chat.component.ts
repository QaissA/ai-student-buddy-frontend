import { Component, inject, NgZone, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AiApi, AiSession } from '../../../api/ai.api';
import { AudioRecorderService } from '../../../core/services/audio-recorder.service';
import { TtsService } from '../../../core/services/tts.service';
import { environment } from '../../../../environments/environment';

export type VoiceStatus = 'idle' | 'recording' | 'thinking' | 'speaking';

@Component({
  selector: 'app-ai-tutor-chat',
  standalone: true,
  imports: [],
  templateUrl: './ai-tutor-chat.component.html',
  styles: [`
    .mic-pulse {
      animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
    }
    @keyframes pulse-ring {
      0%   { transform: scale(0.85); opacity: 0.5; }
      50%  { transform: scale(1.15); opacity: 0.25; }
      100% { transform: scale(0.85); opacity: 0.5; }
    }
    .wave-bar {
      animation: wave 1.2s ease-in-out infinite;
    }
    .wave-bar-still {
      height: 8px;
    }
    @keyframes wave {
      0%, 100% { height: 8px; }
      50%       { height: 48px; }
    }
  `],
})
export class AiTutorChatComponent implements OnInit, OnDestroy {
  private api      = inject(AiApi);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private ngZone   = inject(NgZone);
  private recorder = inject(AudioRecorderService);
  private tts      = inject(TtsService);

  session:        AiSession | null = null;
  sessionId       = '';
  status:         VoiceStatus = 'idle';
  lastTranscript  = '';
  lastReply       = '';
  volume          = 1;

  private mediaBase    = environment.apiUrl.replace('/api/v1', '');
  private currentAudio: HTMLAudioElement | null = null;
  private blobSub?:     Subscription;

  readonly waveBars   = [0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1, 0];
  readonly suggestions = [
    { label: 'Tell me a story', emoji: '🎤' },
    { label: 'Ask me a question', emoji: '❓' },
    { label: 'Explain that again', emoji: '🔄' },
  ];

  endSession() {
    this.stopAudio();
    this.router.navigate(['/ai-tutor']);
  }

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId')!;
    // Only load session metadata (language/level/topic for header) — not old messages
    this.api.getSession(this.sessionId).subscribe(s => {
      this.session = s;
    });

    this.blobSub = this.recorder.audioBlob$.subscribe(blob => {
      if (blob) this.sendVoice(blob);
    });
  }

  ngOnDestroy() {
    this.blobSub?.unsubscribe();
    this.stopAudio();
  }

  // ── Mic toggle ───────────────────────────────────────────────────────────────

  async toggleRecording() {
    if (this.status === 'thinking') return;
    // Tapping mic while speaking interrupts audio and goes back to idle
    if (this.status === 'speaking') {
      this.stopAudio();
      this.status = 'idle';
      return;
    }
    if (this.status === 'recording') {
      this.recorder.stop();
      this.status = 'thinking';
    } else {
      this.stopAudio();
      await this.recorder.start();
      this.status = 'recording';
    }
  }

  // ── Send voice ───────────────────────────────────────────────────────────────

  private sendVoice(blob: Blob) {
    this.status = 'thinking';
    this.api.sendVoiceMessage(this.sessionId, blob).subscribe({
      next: ({ transcript, reply, audioUrl }) => {
        this.lastTranscript = transcript;
        this.lastReply      = reply;
        this.playAudio(this.mediaBase + audioUrl);
      },
      error: () => { this.status = 'idle'; },
    });
  }

  // ── Suggestion pill ──────────────────────────────────────────────────────────

  sendSuggestion(text: string) {
    if (this.status !== 'idle') return;
    this.status        = 'thinking';
    this.lastTranscript = text;
    this.api.sendMessage(this.sessionId, text).subscribe({
      next: ({ reply }) => {
        this.lastReply = reply;
        this.status    = 'speaking';
        this.tts.speak(reply);
        // Return to idle after browser TTS (approx)
        const ms = Math.max(reply.length * 60, 3000);
        setTimeout(() => { if (this.status === 'speaking') this.status = 'idle'; }, ms);
      },
      error: () => { this.status = 'idle'; },
    });
  }

  // ── Audio playback ───────────────────────────────────────────────────────────

  playAudio(url: string) {
    this.stopAudio();
    this.status       = 'speaking';
    this.currentAudio = new Audio(url);
    this.currentAudio.volume = this.volume;
    this.currentAudio.play().catch(() => {
      this.ngZone.run(() => { this.status = 'idle'; });
    });
    // onended fires outside Angular's zone — wrap so change detection runs
    this.currentAudio.onended = () => {
      this.ngZone.run(() => { this.status = 'idle'; });
    };
  }

  replayLast() {
    // Re-speak last reply via browser TTS if no audio URL cached
    if (this.lastReply) {
      this.status = 'speaking';
      this.tts.speak(this.lastReply);
      const ms = Math.max(this.lastReply.length * 60, 2000);
      setTimeout(() => { if (this.status === 'speaking') this.status = 'idle'; }, ms);
    }
  }

  setVolume(event: Event) {
    this.volume = +(event.target as HTMLInputElement).value;
    if (this.currentAudio) this.currentAudio.volume = this.volume;
  }

  private stopAudio() {
    this.tts.stop();
    this.currentAudio?.pause();
    this.currentAudio = null;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  get statusLabel(): string {
    switch (this.status) {
      case 'recording': return 'Listening...';
      case 'thinking':  return 'Thinking...';
      case 'speaking':  return 'Speaking...';
      default:          return 'Tap to talk!';
    }
  }

  get waveActive(): boolean {
    return this.status === 'recording' || this.status === 'speaking';
  }
}
