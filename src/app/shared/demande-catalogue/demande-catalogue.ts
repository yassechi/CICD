import { CreateDemandeWithVeloPayload, Demande, DemandeService, DemandeStatus } from '../../core/services/demande.service';
import { VeloBrand, VeloCatalogService, VeloItem } from '../../core/services/velo-catalog.service';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { User } from '../../core/models/user.model';
import { InputNumber } from 'primeng/inputnumber';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-demande-catalogue',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CardModule, ButtonModule, InputTextModule, SelectModule, InputNumber],
  templateUrl: './demande-catalogue.html',
  styleUrls: ['./demande-catalogue.scss'],
})
export class DemandeCatalogueComponent {
  loading = signal(false);
  loadingVelos = signal(false);
  velos = signal<VeloItem[]>([]);

  demande: Demande | null = null;
  demandeId: number | null = null;
  isEdit = false;

  searchTerm = '';
  selectedBrandId: number | null = null;
  selectedType: string | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  currentPage = 1;
  readonly pageSize = 8;

  private preselectedVeloId: number | null = null;
  private brandMap = new Map<number, VeloBrand>();

  private readonly fb = inject(FormBuilder);
  form = this.fb.group({ idVelo: this.fb.control<number | null>(null, Validators.required) });

  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly veloCatalogService = inject(VeloCatalogService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    const veloId = this.route.snapshot.queryParamMap.get('veloId');
    this.preselectedVeloId = veloId ? Number(veloId) : null;

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.demandeId = Number(id);
      this.loading.set(true);
      this.demandeService.getOne(this.demandeId).subscribe({
        next: (d) => { this.demande = d; this.form.patchValue({ idVelo: d.idVelo }); this.loading.set(false); },
        error: () => { this.loading.set(false); this.messageService.showError('Impossible de charger la demande'); this.goBack(); },
      });
    }

    this.loadingVelos.set(true);
    this.veloCatalogService.getBrands().subscribe({
      next: (brands) => { this.brandMap = new Map(brands.map((b) => [b.id, b])); },
      error: () => {},
    });
    this.veloCatalogService.getVelos().subscribe({
      next: (velos) => {
        this.velos.set(velos ?? []);
        this.loadingVelos.set(false);
        this.currentPage = 1;
        this.trySelectPreselectedVelo();
      },
      error: () => { this.loadingVelos.set(false); this.messageService.showError('Impossible de charger les velos'); },
    });
  }

  get selectedVeloId(): number | null { return this.form.get('idVelo')?.value ?? null; }
  get selectedVelo(): VeloItem | undefined { return this.velos().find((b) => b.id === this.selectedVeloId); }

  get filteredVelos(): VeloItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    const brandId = this.selectedBrandId;
    const typeF = this.selectedType?.toLowerCase() ?? '';
    const min = this.minPrice;
    const max = this.maxPrice;
    return this.velos().filter((b) => {
      const title = b.title?.rendered?.toLowerCase() ?? '';
      const type = b.acf?.type?.toLowerCase() ?? '';
      const brand = this.getBrandName(b.velos_brand?.[0]).toLowerCase();
      const price = b.acf?.prix ?? null;
      return (!term || title.includes(term) || type.includes(term) || brand.includes(term))
        && (!brandId || b.velos_brand?.includes(brandId))
        && (!typeF || type.includes(typeF))
        && (min === null || (price !== null && price >= min))
        && (max === null || (price !== null && price <= max));
    });
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredVelos.length / this.pageSize)); }
  get pagedVelos(): VeloItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredVelos.slice(start, start + this.pageSize);
  }

  get brandOptions(): Array<{ label: string; value: number }> {
    return Array.from(this.brandMap.values()).sort((a, b) => a.name.localeCompare(b.name)).map((b) => ({ label: b.name, value: b.id }));
  }
  get typeOptions(): Array<{ label: string; value: string }> {
    const types = Array.from(new Set(this.velos().map((b) => b.acf?.type).filter((v): v is string => !!v)));
    return types.sort().map((t) => ({ label: t, value: t }));
  }

  selectVelo(velo: VeloItem): void {
    if (this.selectedVeloId === velo.id) return;
    this.form.patchValue({ idVelo: velo.id });
    this.messageService.showInfo(velo.title?.rendered ?? '', 'Velo selectionne');
  }

  onFilterChange(): void { this.currentPage = 1; }
  goToPage(p: number): void { if (p >= 1 && p <= this.totalPages) this.currentPage = p; }
  nextPage(): void { this.goToPage(this.currentPage + 1); }
  prevPage(): void { this.goToPage(this.currentPage - 1); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const user: User | null = this.authService.getCurrentUser();
    if (!user?.id) { this.messageService.showError('Utilisateur non authentifie'); return; }
    if (!this.selectedVelo) { this.messageService.showError('Veuillez selectionner un velo'); return; }

    this.loading.set(true);
    const v = this.form.getRawValue();

    if (this.isEdit) {
      const payload: Demande = {
        id: this.demandeId ?? this.demande?.id,
        idUser: user.id,
        idVelo: Number(v.idVelo),
        status: this.demande?.status ?? DemandeStatus.Encours,
        discussionId: this.demande?.discussionId,
      };
      this.demandeService.update(payload).subscribe({
        next: () => {
          this.messageService.showSuccess('Demande modifiee', 'Succes');
          this.loading.set(false);
          this.goToUserDemandes(user);
        },
        error: () => { this.loading.set(false); this.messageService.showError('Impossible de modifier la demande'); },
      });
      return;
    }

    const velo = this.selectedVelo!;
    const payload: CreateDemandeWithVeloPayload = {
      idUser: user.id,
      mojoId: user.id,
      velo: {
        cmsId: velo.id,
        marque: this.getBrandName(velo.velos_brand?.[0]),
        modele: velo.title?.rendered ?? 'Modele inconnu',
        type: velo.acf?.type ?? null,
        prixAchat: velo.acf?.prix ?? 0,
      },
    };

    this.demandeService.createWithVelo(payload).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.messageService.showSuccess('Demande creee', 'Succes');
        this.goToUserDemandes(user);
      },
      error: (err) => this.messageService.showError(err?.error?.message || 'Impossible de creer la demande'),
    });
  }

  goBack(): void {
    this.authService.isAuthenticated() ? this.router.navigate(['/user/demandes']) : this.router.navigate(['/catalogue-velos']);
  }

  getBrandName(brandId?: number): string { return brandId ? (this.brandMap.get(brandId)?.name ?? 'Marque inconnue') : 'Marque inconnue'; }
  getVeloImage(velo: VeloItem): string | null { return velo._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null; }
  formatCurrency(amount?: number): string { return amount == null ? '-' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount); }

  private trySelectPreselectedVelo(): void {
    if (!this.preselectedVeloId || !this.velos().length) return;
    const velo = this.velos().find((b) => b.id === this.preselectedVeloId);
    if (velo) { this.form.patchValue({ idVelo: velo.id }); this.preselectedVeloId = null; }
  }

  private goToUserDemandes(user: User): void {
    this.authService.setCurrentUser(user);
    if (!this.authService.isAuthenticated()) {
      this.messageService.showError('Veuillez vous connecter pour acceder a vos demandes');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/user/demandes' } });
      return;
    }
    this.router.navigate(['/user/demandes']);
  }
}
