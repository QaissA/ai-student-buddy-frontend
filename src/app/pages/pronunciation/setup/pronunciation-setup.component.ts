import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PronunciationApi, PronunciationText } from '../../../api/pronunciation.api';

@Component({
  selector: 'app-pronunciation-setup',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pronunciation-setup.component.html',
})
export class PronunciationSetupComponent implements OnInit {
  private api = inject(PronunciationApi);
  texts: PronunciationText[] = [];
  loading = true;

  ngOnInit() {
    this.api.getTexts().subscribe({
      next: t => { this.texts = t; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
