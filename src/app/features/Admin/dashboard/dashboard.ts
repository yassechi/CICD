import { DemandeService, DemandeStatus } from '../../../core/services/demande.service';
import { ContratService, StatutContrat } from '../../../core/services/contrat.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import {
  AiService,
  AiUploadMultipleResponse,
  AiPdfInfo,
  AiUploadSingleResponse,
} from '../../../core/services/ai.service';
import { MessageService } from '../../../core/services/message.service';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    ButtonModule,
    ConfirmDialogModule,
    TextareaModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class AdminDashboardComponent {
  stats = signal({ pendingDemandes: 0, activeContrats: 0, expiringContrats: 0 });
  activityFeed = signal<Array<{ title: string; detail: string; time: string }>>([]);
  demandeStatusChartData = signal<any>(null);
  contratStatusChartData = signal<any>(null);
  selectedAiFiles = signal<File[]>([]);
  uploadedAiFiles = signal<AiPdfInfo[]>([]);
  showUploadedFiles = signal(false);
  isDragOver = signal(false);
  aiMessages = signal<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([]);
  uploadLoading = signal(false);
  uploadedListLoading = signal(false);
  askLoading = signal(false);
  lastUploadSummary = signal<string | null>(null);
  aiQuestion = '';

  private readonly maxFileBytes = 10 * 1024 * 1024;

  readonly donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#475569', font: { family: 'Manrope', weight: '600' } },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleFont: { family: 'Space Grotesk', size: 13, weight: '700' },
        bodyFont: { family: 'Manrope', size: 12, weight: '600' },
        padding: 12,
        cornerRadius: 12,
      },
    },
  };

  private readonly dashboardService = inject(DashboardService);
  private readonly demandeService = inject(DemandeService);
  private readonly contratService = inject(ContratService);
  private readonly aiService = inject(AiService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  constructor() {
    this.dashboardService.getAdminDashboard().subscribe((data) => {
      this.stats.set({
        pendingDemandes: data.pendingDemandes,
        activeContrats: data.activeContrats,
        expiringContrats: data.expiringContrats,
      });
      this.activityFeed.set(data.activityFeed || []);
    });

    this.demandeService.getList().subscribe((demandes) => {
      const enCours = demandes.filter((d) => d.status === DemandeStatus.Encours).length;
      const attente = demandes.filter((d) => d.status === DemandeStatus.AttenteComagnie).length;
      const finalisation = demandes.filter((d) => d.status === DemandeStatus.Finalisation).length;
      const valide = demandes.filter((d) => d.status === DemandeStatus.Valide).length;
      const refuse = demandes.filter((d) => d.status === DemandeStatus.Refuse).length;

      // Remplir le chart 
      this.demandeStatusChartData.set({
        labels: ['En cours', 'Attente Compagnie', 'Finalisation', 'Valide', 'Refuse'],
        datasets: [
          {
            data: [enCours, attente, finalisation, valide, refuse],
            backgroundColor: ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      });
    });

    this.contratService.getList().subscribe((contrats) => {
      const statuses = [StatutContrat.EnCours, StatutContrat.Termine, StatutContrat.Resilie];
      this.contratStatusChartData.set({
        labels: statuses.map((s) => this.contratService.getStatutLabel(s)),
        datasets: [
          {
            data: statuses.map((s) => contrats.filter((c) => c.statutContrat === s).length),
            backgroundColor: ['#bbf7d0', '#4ade80', '#16a34a'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      });
    });
  }

  onAiFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    if (!files.length) return;

    this.processAiFiles(files);

    if (input) {
      input.value = '';
    }
  }

  private processAiFiles(files: File[]): void {
    const validFiles: File[] = [];
    const rejected: string[] = [];

    files.forEach((file) => {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        rejected.push(`${file.name} (format non PDF)`);
        return;
      }
      if (file.size > this.maxFileBytes) {
        rejected.push(`${file.name} (trop volumineux)`);
        return;
      }
      validFiles.push(file);
    });

    if (rejected.length) {
      this.messageService.showWarn(`Fichiers ignorés: ${rejected.join(' | ')}`);
    }
    this.selectedAiFiles.set(validFiles);
  }

  clearAiFiles(): void {
    this.selectedAiFiles.set([]);
  }

  removeSelectedAiFile(index: number): void {
    this.selectedAiFiles.update((files) => files.filter((_, i) => i !== index));
  }

  uploadAiFiles(): void {
    const files = this.selectedAiFiles();
    if (this.uploadLoading()) return;
    if (!files.length) {
      this.messageService.showWarn('Sélectionnez au moins un PDF.');
      return;
    }

    this.uploadLoading.set(true);
    const request$: Observable<AiUploadSingleResponse | AiUploadMultipleResponse> =
      files.length > 1
        ? this.aiService.uploadAdminMultiple(files)
        : this.aiService.uploadAdminSingle(files[0]);

    request$.subscribe({
      next: (response: any) => {
        if (response?.message) {
          this.messageService.showSuccess(response.message);
          this.lastUploadSummary.set(response.message);
        } else {
          const uploaded = response?.uploades ?? [];
          const errors = response?.erreurs ?? [];
          if (uploaded.length) {
            this.messageService.showSuccess(`${uploaded.length} fichier(s) uploadé(s).`);
            this.lastUploadSummary.set(`Uploadés : ${uploaded.join(', ')}`);
          }
          if (errors.length) {
            this.messageService.showWarn(`Erreurs: ${errors.join(' | ')}`);
          }
        }
        this.selectedAiFiles.set([]);
        if (this.showUploadedFiles()) {
          this.loadUploadedAiFiles();
        }
      },
      error: () => {
        this.messageService.showError("Impossible d'uploader les documents.");
        this.uploadLoading.set(false);
      },
      complete: () => this.uploadLoading.set(false),
    });
  }

  loadUploadedAiFiles(): void {
    this.uploadedListLoading.set(true);
    this.aiService.getAdminFiles().subscribe({
      next: (files) => this.uploadedAiFiles.set(files ?? []),
      error: () => {
        this.messageService.showError("Impossible de charger la liste des PDFs.");
        this.uploadedListLoading.set(false);
      },
      complete: () => this.uploadedListLoading.set(false),
    });
  }

  onAiDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.isDragOver.set(true);
  }

  onAiDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onAiDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    if (!files.length) return;
    this.processAiFiles(files);
  }

  toggleUploadedFiles(): void {
    const next = !this.showUploadedFiles();
    this.showUploadedFiles.set(next);
    if (next && this.uploadedAiFiles().length === 0 && !this.uploadedListLoading()) {
      this.loadUploadedAiFiles();
    }
  }


  deleteUploadedAiFile(file: AiPdfInfo): void {
    this.confirmationService.confirm({
      message: `Etes-vous sur de vouloir supprimer "${file.fileName}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.uploadedListLoading.set(true);
        this.aiService.deleteAdminFile(file.fileName).subscribe({
          next: (response) => {
            this.messageService.showSuccess(response?.message ?? 'Fichier supprime.');
            this.loadUploadedAiFiles();
          },
          error: () => {
            this.messageService.showError("Impossible de supprimer le fichier.");
            this.uploadedListLoading.set(false);
          },
        });
      },
    });
  }

  askAi(): void {
    const question = this.aiQuestion.trim();
    if (!question || this.askLoading()) return;

    this.appendAiMessage('user', question);
    this.aiQuestion = '';
    this.askLoading.set(true);

    this.aiService.askAdmin(question).subscribe({
      next: (response) => {
        const text = response?.response?.trim() || 'JE NE SAIS PAS';
        this.appendAiMessage('assistant', text);
      },
      error: () => {
        this.appendAiMessage(
          'assistant',
          "Une erreur est survenue. Merci de réessayer dans quelques instants.",
        );
        this.messageService.showError("Impossible d'obtenir une réponse IA.");
        this.askLoading.set(false);
      },
      complete: () => this.askLoading.set(false),
    });
  }

  private appendAiMessage(role: 'user' | 'assistant', text: string): void {
    const time = this.formatTime(new Date());
    this.aiMessages.update((items) => [...items, { role, text, time }]);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
  }

  formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
