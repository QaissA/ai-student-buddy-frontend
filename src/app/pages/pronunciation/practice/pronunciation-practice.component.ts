import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PronunciationApi, PronunciationText, PronunciationScore } from '../../../api/pronunciation.api';
import { AudioRecorderService } from '../../../core/services/audio-recorder.service';
import { TtsService } from '../../../core/services/tts.service';

@Component({
  selector: 'app-pronunciation-practice',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './pronunciation-practice.component.html',
})
export class PronunciationPracticeComponent implements OnInit {
  private api = inject(PronunciationApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  recorder = inject(AudioRecorderService);
  tts = inject(TtsService);

  text: PronunciationText | null = null;
  loading = true;
  submitting = false;
  textId = '';

  ngOnInit() {
    this.textId = this.route.snapshot.paramMap.get('textId')!;
    this.api.getText(this.textId).subscribe({
      next: t => { this.text = t; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  listen() {
    if (this.text) this.tts.speak(this.text.text, this.text.language === 'ARABIC' ? 'ar-SA' : 'en-US');
  }

  async toggleRecord() {
    if (this.recorder.isRecording$.value) {
      this.recorder.stop();
      this.recorder.audioBlob$.subscribe(blob => {
        if (blob) this.submit(blob);
      });
    } else {
      await this.recorder.start();
    }
  }

  private submit(blob: Blob) {
    this.submitting = true;
    this.api.submitRecording(this.textId, blob).subscribe({
      next: score => {
        this.submitting = false;
        this.router.navigate(['/pronunciation', this.textId, 'results'], { state: { score } });
      },
      error: () => { this.submitting = false; },
    });
  }
}
