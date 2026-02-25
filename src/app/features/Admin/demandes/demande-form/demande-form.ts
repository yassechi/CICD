import { DemandeService, DemandeStatus } from '../../../../core/services/demande.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, UserService } from '../../../../core/services/user.service';
import { MessageService } from '../../../../core/services/message.service';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-demande-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, ButtonModule, SelectModule, CheckboxModule, InputNumberModule],
  templateUrl: './demande-form.html',
  styleUrls: ['./demande-form.scss'],
})
export class DemandeFormDialogComponent {
  loading = signal(false);
  users = signal<User[]>([]);
  isEdit = false;
  demandeId: number | null = null;

  statusOptions = [
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Finalisation', value: DemandeStatus.Finalisation },
    { label: 'Valid?', value: DemandeStatus.Valide },
    { label: 'Refus?', value: DemandeStatus.Refuse }];

  private readonly fb = inject(FormBuilder);
  form: FormGroup = this.fb.group({
    id: [null],
    idUser: [null, Validators.required],
    idVelo: [null, Validators.required],
    status: [DemandeStatus.Encours, Validators.required],
    discussionId: [null],
    isActif: [true],
  });

  private readonly demandeService = inject(DemandeService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    this.userService.getAll().subscribe({ next: (data) => this.users.set(data ?? []) });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEdit = true;
    this.demandeId = Number(id);
    this.loading.set(true);
    this.demandeService.getOne(this.demandeId).subscribe({
      next: (d: any) => {
        this.form.patchValue({ ...d, isActif: d.isActif ?? true });
        this.loading.set(false);
      },
      error: () => {
        this.messageService.showError('Impossible de charger la demande');
        this.loading.set(false);
        this.goBack();
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    const v = this.form.getRawValue();
    const payload: any = {
      idUser: v.idUser,
      idVelo: Number(v.idVelo),
      status: Number(v.status),
      discussionId: v.discussionId ? Number(v.discussionId) : null,
      ...(this.isEdit && this.demandeId ? { id: this.demandeId } : {}),
    };

    (this.isEdit ? this.demandeService.update(payload) : this.demandeService.create(payload)).subscribe({
      next: () => {
        this.messageService.showSuccess(this.isEdit ? 'Demande modifi?e' : 'Demande cr??e', 'Succ?s');
        this.loading.set(false);
        this.goBack();
      },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void { this.router.navigate([this.router.url.startsWith('/manager/') ? '/manager/demandes' : '/admin/demandes']); }
}
