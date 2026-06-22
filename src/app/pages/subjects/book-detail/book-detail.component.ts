import {
  Component, ElementRef, HostListener, inject, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { SubjectsApi, Book } from '../../../api/subjects.api';
import {
  DocumentsApi, SubjectDocument, DocChatTurn, GeneratedExercise,
} from '../../../api/documents.api';
import { TtsService } from '../../../core/services/tts.service';

const TTS_LANG: Record<string, string> = {
  ARABIC: 'ar-SA', FRENCH: 'fr-FR', ENGLISH: 'en-US', SPANISH: 'es-ES', OTHER: 'en-US',
};

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [RouterLink, PdfViewerModule, FormsModule],
  templateUrl: './book-detail.component.html',
  styles: [`
    .mic-pulse { animation: mic-pulse 1.6s ease-in-out infinite; }
    @keyframes mic-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
      50%      { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
    }
  `],
})
export class BookDetailComponent implements OnInit, OnDestroy {
  private api  = inject(SubjectsApi);
  private documentsApi = inject(DocumentsApi);
  private tts  = inject(TtsService);
  private route = inject(ActivatedRoute);

  book: Book | null = null;
  pdfDocs: SubjectDocument[] = [];   // the "course" = the book's PDFs
  loading = true;
  ttsLang = 'en-US';
  panel: 'ask' | 'exercises' = 'ask';

  // Collapsible panes (collapsing one expands the other; never both collapsed).
  aiCollapsed = false;
  pdfCollapsed = false;
  toggleAi()  { this.aiCollapsed = !this.aiCollapsed; if (this.aiCollapsed) this.pdfCollapsed = false; this.refitPdf(); }
  togglePdf() { this.pdfCollapsed = !this.pdfCollapsed; if (this.pdfCollapsed) this.aiCollapsed = false; this.refitPdf(); }
  get bothOpen(): boolean { return !this.aiCollapsed && !this.pdfCollapsed; }

  /** ng2-pdf-viewer re-fits on window resize — nudge it after a layout change. */
  private refitPdf() {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
  }

  // Draggable splitter — AI pane width as a % of the workspace.
  @ViewChild('split') split?: ElementRef<HTMLElement>;
  leftWidth = 42;          // %
  dragging = false;

  startDrag(e: MouseEvent) { this.dragging = true; e.preventDefault(); }

  @HostListener('document:mousemove', ['$event'])
  onDrag(e: MouseEvent) {
    if (!this.dragging || !this.split) return;
    const rect = this.split.nativeElement.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    this.leftWidth = Math.min(75, Math.max(25, pct));
  }

  @HostListener('document:mouseup')
  endDrag() { if (this.dragging) { this.dragging = false; this.refitPdf(); } }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getBook(id).subscribe(b => {
      this.book = b;
      if (b?.subjectId) {
        this.api.getSubject(b.subjectId).subscribe({
          next: s => this.ttsLang = TTS_LANG[s.language] ?? 'en-US',
          error: () => {},
        });
      }
    });
    this.documentsApi.list({ bookId: id }).subscribe({
      next: d => {
        this.pdfDocs = (d ?? []).filter(x => x.mimeType === 'application/pdf');
        this.loading = false;
        if (this.pdfDocs.length) this.loadCurrentPdf();
      },
      error: () => { this.pdfDocs = []; this.loading = false; },
    });
  }

  ngOnDestroy() { this.stopListening(); this.tts.stop(); }

  // ── PDF state (paginates across ALL the book's PDFs) ────────────────────────
  currentDocIndex = 0;
  pdfData: Uint8Array | null = null;
  currentPage = 1;
  totalPages  = 0;
  zoom        = 1.0;
  pdfLoading  = false;

  get currentDoc(): SubjectDocument | null { return this.pdfDocs[this.currentDocIndex] ?? null; }

  private loadCurrentPdf() {
    const doc = this.currentDoc;
    if (!doc) return;
    this.pdfLoading = true;
    this.pdfData = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.resetChat();
    this.exercises = [];
    this.documentsApi.rawArrayBuffer(doc.id).subscribe({
      next: buf => { this.pdfData = new Uint8Array(buf); this.pdfLoading = false; },
      error: () => { this.pdfLoading = false; },
    });
  }

  selectDoc(index: number) {
    if (index < 0 || index >= this.pdfDocs.length || index === this.currentDocIndex) return;
    this.currentDocIndex = index;
    this.panel = 'ask';
    this.loadCurrentPdf();
  }

  afterLoadComplete(pdf: any) { this.totalPages = pdf.numPages; }

  /** Pagination flows across documents: past the last page jumps to the next PDF. */
  nextPage() {
    if (this.currentPage < this.totalPages) { this.currentPage++; return; }
    if (this.currentDocIndex < this.pdfDocs.length - 1) this.selectDoc(this.currentDocIndex + 1);
  }
  prevPage() {
    if (this.currentPage > 1) { this.currentPage--; return; }
    if (this.currentDocIndex > 0) this.selectDoc(this.currentDocIndex - 1);
  }
  zoomIn()  { this.zoom = Math.min(2.0, parseFloat((this.zoom + 0.25).toFixed(2))); }
  zoomOut() { this.zoom = Math.max(0.5, parseFloat((this.zoom - 0.25).toFixed(2))); }
  get zoomPct(): string { return Math.round(this.zoom * 100) + '%'; }

  // ── AI helper (voice + image) ───────────────────────────────────────────────
  chatMessages: DocChatTurn[] = [];
  chatLoading = false;
  chatError = '';
  listening = false;
  pendingImage: string | null = null;
  textInput = '';
  private recognition: any = null;

  private resetChat() {
    this.chatMessages = [];
    this.chatError = '';
    this.pendingImage = null;
    this.textInput = '';
  }

  get speechSupported(): boolean {
    return typeof (window as any).webkitSpeechRecognition !== 'undefined'
        || typeof (window as any).SpeechRecognition !== 'undefined';
  }

  toggleVoice() {
    if (this.listening) { this.stopListening(); return; }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) { this.chatError = 'Voice input is not supported in this browser — use the text box.'; return; }
    this.tts.stop();
    this.recognition = new Ctor();
    this.recognition.lang = this.ttsLang;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? '';
      this.listening = false;
      if (transcript.trim()) this.ask(transcript.trim());
    };
    this.recognition.onerror = () => { this.listening = false; };
    this.recognition.onend = () => { this.listening = false; };
    this.listening = true;
    this.recognition.start();
  }

  stopListening() {
    this.listening = false;
    try { this.recognition?.stop(); } catch {}
    this.recognition = null;
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.pendingImage = reader.result as string; };
    reader.readAsDataURL(file);
  }
  clearImage() { this.pendingImage = null; }

  sendText() {
    const text = this.textInput.trim();
    if (text) this.ask(text);
    this.textInput = '';
  }

  /** Send a question (voice transcript or typed) + any attached image; speak the reply. */
  private ask(text: string) {
    const doc = this.currentDoc;
    if (!doc || this.chatLoading) return;
    this.chatError = '';
    const history = this.chatMessages.slice();
    const image = this.pendingImage ?? undefined;
    this.chatMessages.push({ role: 'user', content: image ? `🖼️ ${text}` : text });
    this.pendingImage = null;
    this.chatLoading = true;

    this.documentsApi.chat(doc.id, text, history, image).subscribe({
      next: ({ reply }) => {
        this.chatMessages.push({ role: 'assistant', content: reply });
        this.chatLoading = false;
        this.tts.speak(reply, this.ttsLang);
      },
      error: (e) => {
        this.chatLoading = false;
        this.chatError = e?.error?.message ?? 'The assistant could not respond. Please try again.';
      },
    });
  }

  replay(text: string) { this.tts.speak(text, this.ttsLang); }

  // ── Exercises ───────────────────────────────────────────────────────────────
  exercises: GeneratedExercise[] = [];
  exercisesLoading = false;
  exercisesError = '';
  selected: Record<number, number> = {};

  generateExercises() {
    const doc = this.currentDoc;
    if (!doc) return;
    this.panel = 'exercises';
    if (this.exercises.length || this.exercisesLoading) return; // keep until doc changes
    this.exercisesLoading = true;
    this.exercisesError = '';
    this.selected = {};
    this.documentsApi.generateExercises(doc.id).subscribe({
      next: ({ exercises }) => { this.exercises = exercises ?? []; this.exercisesLoading = false; },
      error: (e) => {
        this.exercisesLoading = false;
        this.exercisesError = e?.error?.message ?? 'Could not generate exercises. Please try again.';
      },
    });
  }

  regenerateExercises() {
    this.exercises = [];
    this.exercisesLoading = false;
    this.generateExercises();
  }

  choose(exerciseIndex: number, optionIndex: number) {
    if (this.selected[exerciseIndex] !== undefined) return;
    this.selected[exerciseIndex] = optionIndex;
  }
}
