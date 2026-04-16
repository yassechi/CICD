import { MessageService as PrimeMessageService, PrimeIcons } from 'primeng/api';
import { Injectable, inject } from '@angular/core';
import { I18nService } from './I18n.service';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly primeMessageService = inject(PrimeMessageService);
  private readonly i18n = inject(I18nService);

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

  showError(detail: string, summary = this.i18n.get('common.erreur')): void {
    this.primeMessageService.add({
      severity: 'error',
      summary,
      detail,
      icon: PrimeIcons.EXCLAMATION_TRIANGLE,
    });
  }

  showSuccess(detail: string, summary = this.i18n.get('common.succes')): void {
    this.showMessage('success', detail, summary);
  }

  showInfo(detail: string, summary = this.i18n.get('common.info')): void {
    this.showMessage('info', detail, summary);
  }

  showWarn(detail: string, summary = this.i18n.get('common.attention')): void {
    this.showMessage('warn', detail, summary);
  }
}
