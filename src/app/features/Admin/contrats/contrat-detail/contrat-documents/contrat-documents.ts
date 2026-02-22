import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService as PrimeMessageService } from 'primeng/api';

// Services
import { Document, DocumentService } from '../../../../../core/services/document.service';
import { ErrorService } from '../../../../../core/services/error.service';
import { ContratDetailStore } from '../contrat-detail.store';

@Component({
  selector: 'app-contrat-documents',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TooltipModule],
  templateUrl: './contrat-documents.html',
  styleUrls: ['./contrat-documents.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDocumentsComponent {

  // --- SERVICES ---
  private readonly documentService = inject(DocumentService);
  private readonly messageService  = inject(PrimeMessageService);
  private readonly errorService    = inject(ErrorService);
  private readonly store           = inject(ContratDetailStore);

  // --- DONNÉES ---
  readonly contratId = computed(() => this.store.contratId());

  readonly documents = signal<Document[]>([]);
  readonly loading   = signal(false);
  private readonly reloadDocuments = signal(0);

  private readonly loadDocumentsEffect = effect((onCleanup) => {
    const id = this.contratId();
    this.reloadDocuments();
    if (!id) {
      this.documents.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const sub = this.documentService.getByContrat(id).subscribe({
      next: (data) => {
        this.documents.set(data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        if (!this.isUnauthorized(error)) {
          this.errorService.showError('Impossible de charger les documents');
        }
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  // --- ACTIONS ---
  downloadDocument(doc: Document): void {
    this.documentService.downloadDocument(doc);
  }

  deleteDocument(doc: Document): void {
    if (!confirm(`Voulez-vous vraiment supprimer "${doc.nomFichier}" ?`)) return;

    this.documentService.delete(doc.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Document supprimé' });
        this.reloadDocuments.update((value) => value + 1);
      },
      error: () => this.errorService.showError('Impossible de supprimer le document'),
    });
  }

  onFileSelected(event: Event): void {
    const file      = (event.target as HTMLInputElement)?.files?.[0];
    const contratId = this.contratId();
    if (!file || !contratId) return;

    const reader  = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const newDoc: Document = {
        id:          0,
        contratId,
        fichier:     base64,
        nomFichier:  file.name,
        typeFichier: file.name.split('.').pop() || 'pdf',
        isActif:     true,
      };

      this.documentService.create(newDoc).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Document ajouté' });
          this.reloadDocuments.update((value) => value + 1);
        },
        error: () => this.errorService.showError("Impossible d'ajouter le document"),
      });
    };
    reader.readAsDataURL(file);
  }

  // Ignore les erreurs 401/403 (non connecté)
  private isUnauthorized(error: unknown): boolean {
    const err    = error as { status?: number; cause?: { status?: number } };
    const status = err?.status ?? err?.cause?.status;
    return status === 401 || status === 403;
  }
}
