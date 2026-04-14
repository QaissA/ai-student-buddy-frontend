import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TtsService {
  speak(text: string, lang = 'en-US', rate = 1): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = rate;
    window.speechSynthesis.speak(utt);
  }

  stop(): void {
    window.speechSynthesis?.cancel();
  }
}
