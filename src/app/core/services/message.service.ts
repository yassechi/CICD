import { MessageService as PrimeMessageService, PrimeIcons } from 'primeng/api';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly primeMessageService = inject(PrimeMessageService);

  private showMessage(
    severity: 'success' | 'info' | 'warn' | 'error',
    detail: string,
    summary: string,
  ): void {
    this.primeMessageService.add({
      severity,
      summary,
      detail,
    });
  }

  showError(detail: string, summary = 'Erreur'): void {
    this.primeMessageService.add({
      severity: 'error',
      summary,
      detail,
      icon: PrimeIcons.EXCLAMATION_TRIANGLE,
    });
  }

  showSuccess(detail: string, summary = 'Succès'): void {
    this.showMessage('success', detail, summary);
  }

  showInfo(detail: string, summary = 'Info'): void {
    this.showMessage('info', detail, summary);
  }

  showWarn(detail: string, summary = 'Attention'): void {
    this.showMessage('warn', detail, summary);
  }
}


