import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Document, DocumentService } from '../../core/services/document.service';
import { MessageService } from '../../core/services/message.service';
import { I18nService } from '../../core/services/I18n.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { map } from 'rxjs';

@Component({
  selector: 'app-contrat-documents',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TooltipModule],
  templateUrl: './contrat-documents.html',
  styleUrls: ['./contrat-documents.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDocumentsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly documentService = inject(DocumentService);
  private readonly messageService = inject(MessageService);
  readonly i18n = inject(I18nService);

  readonly contratId = toSignal(
    (this.route.parent ?? this.route).paramMap.pipe(map((p) => Number(p.get('id')) || null)),
    { initialValue: null },
  );
  readonly documents = signal<Document[]>([]);
  readonly loading = signal(false);
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
        if (!this.isUnauthorized(error))
          this.messageService.showError(this.i18n.get('contrats.loadDocumentsError'));
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  downloadDocument(doc: Document): void {
    this.documentService.downloadDocument(doc);
  }

  deleteDocument(doc: Document): void {
    if (!confirm(this.i18n.format('contrats.deleteDocumentConfirm', { file: doc.nomFichier })))
      return;
    this.documentService.delete(doc.id).subscribe({
      next: () => {
        this.messageService.showSuccess(this.i18n.get('contrats.documentDeleted'));
        this.reloadDocuments.update((v) => v + 1);
      },
      error: () => this.messageService.showError(this.i18n.get('contrats.deleteDocumentError')),
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    const contratId = this.contratId();
    if (!file || !contratId) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.documentService
        .create({
          id: 0,
          contratId,
          fichier: base64,
          nomFichier: file.name,
          typeFichier: file.name.split('.').pop() || 'pdf',
          isActif: true,
        })
        .subscribe({
          next: () => {
            this.messageService.showSuccess(this.i18n.get('contrats.documentAdded'));
            this.reloadDocuments.update((v) => v + 1);
          },
          error: () => this.messageService.showError(this.i18n.get('contrats.addDocumentError')),
        });
    };
    reader.readAsDataURL(file);
  }

  private isUnauthorized(error: unknown): boolean {
    const err = error as { status?: number; cause?: { status?: number } };
    const status = err?.status ?? err?.cause?.status;
    return status === 401 || status === 403;
  }
}
