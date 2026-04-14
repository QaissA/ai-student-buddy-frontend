import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AiApi, Language, LanguageLevel } from '../../../api/ai.api';

@Component({
  selector: 'app-ai-tutor-setup',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ai-tutor-setup.component.html',
})
export class AiTutorSetupComponent {
  private fb = inject(FormBuilder);
  private api = inject(AiApi);
  private router = inject(Router);

  form = this.fb.group({
    language: ['ENGLISH' as Language, Validators.required],
    level:    ['A1' as LanguageLevel, Validators.required],
    topic:    ['', Validators.required],
  });

  languages: { value: Language; label: string; flag: string }[] = [
    { value: 'ENGLISH', label: 'English',  flag: '🇬🇧' },
    { value: 'FRENCH',  label: 'Français', flag: '🇫🇷' },
    { value: 'ARABIC',  label: 'العربية',  flag: '🇸🇦' },
    { value: 'SPANISH', label: 'Español',  flag: '🇪🇸' },
  ];

  levels: { value: LanguageLevel; label: string; desc: string }[] = [
    { value: 'A1', label: 'A1', desc: 'Starter' },
    { value: 'A2', label: 'A2', desc: 'Elementary' },
    { value: 'B1', label: 'B1', desc: 'Intermediate' },
    { value: 'B2', label: 'B2', desc: 'Upper Intermediate' },
    { value: 'C1', label: 'C1', desc: 'Advanced' },
    { value: 'C2', label: 'C2', desc: 'Mastery' },
  ];

  loading = false;

  start() {
    if (this.form.invalid) return;
    this.loading = true;
    const { language, level, topic } = this.form.value;
    this.api.createSession(language as Language, level as LanguageLevel, topic!).subscribe({
      next: ({ sessionId }) => this.router.navigate(['/ai-tutor', sessionId]),
      error: () => { this.loading = false; },
    });
  }
}
