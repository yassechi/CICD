import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Contrat, ContratService } from '../../core/services/contrat.service';
import { MessageService } from '../../core/services/message.service';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { map } from 'rxjs';

@Component({
  selector: 'app-contrat-detail-info',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './contrat-info.html',
  styleUrls: ['./contrat-info.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDetailInfoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly messageService = inject(MessageService);

  readonly contratId = toSignal((this.route.parent ?? this.route).paramMap.pipe(map((p) => Number(p.get('id')) || null)), { initialValue: null });
  readonly contrat = signal<Contrat | null>(null);
  readonly loading = signal(false);

  private readonly loadEffect = effect((onCleanup) => {
    const id = this.contratId();
    if (!id) { this.contrat.set(null); this.loading.set(false); return; }
    this.loading.set(true);
    const sub = this.contratService.getDetail(id).subscribe({
      next: (data) => { this.contrat.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.messageService.showError('Impossible de charger le contrat'); },
    });
    onCleanup(() => sub.unsubscribe());
  });

  onEditContrat(): void { const id = this.contrat()?.id; if (id) this.router.navigate(['/admin/contrats/edit', id]); }
  formatDate(date?: string): string { return date ? new Date(date).toLocaleDateString('fr-FR') : '-'; }
  formatCurrency(amount?: number): string { return amount == null ? '-' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount); }
}
