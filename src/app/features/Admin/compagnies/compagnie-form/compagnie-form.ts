import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';

// Services
import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { User, UserService } from '../../../../core/services/user.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';
import { ErrorService } from '../../../../core/services/error.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-compagnie-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule,
    CheckboxModule, FileUploadModule, SelectModule, ToastModule,
  ],
  providers: [PrimeMessageService],
  templateUrl: './compagnie-form.html',
  styleUrls: ['./compagnie-form.scss'],
})
export class CompagnieFormComponent {

  // --- DONNÉES ---
  loading      = signal(false);
  loadingUsers = signal(false);
  uploadedLogo = signal<string | null>(null);
  users        = signal<User[]>([]);
  isEdit       = false;
  organisationId: number | null = null;

  // --- FORMULAIRE ---
  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    id:            [0],
    name:          ['', Validators.required],
    code:          ['', Validators.required],
    address:       ['', Validators.required],
    contactEmail:  ['', [Validators.required, Validators.email]],
    emailAutorise: ['', [Validators.required, Validators.pattern(/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    idContact:     ['', Validators.required],
    isActif:       [true],
    logoUrl:       [''],
  });

  // Raccourcis pour accéder aux champs dans le HTML
  get name()          { return this.form.get('name'); }
  get code()          { return this.form.get('code'); }
  get address()       { return this.form.get('address'); }
  get contactEmail()  { return this.form.get('contactEmail'); }
  get emailAutorise() { return this.form.get('emailAutorise'); }
  get idContact()     { return this.form.get('idContact'); }

  // --- SERVICES ---
  private readonly organisationService = inject(OrganisationService);
  private readonly userService         = inject(UserService);
  private readonly messageService      = inject(PrimeMessageService);
  private readonly fileUploadService   = inject(FileUploadService);
  private readonly errorService        = inject(ErrorService);
  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);

  // --- INIT ---
  constructor() {
    this.loadUsers();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.organisationId = Number(id);
      this.loadOrganisation(this.organisationId);
    }
  }

  // --- CHARGEMENT ---
  loadUsers(): void {
    this.loadingUsers.set(true);
    this.userService.getAll().subscribe({
      next:  (data) => { this.users.set(data); this.loadingUsers.set(false); },
      error: ()     => this.loadingUsers.set(false),
    });
  }

  loadOrganisation(id: number): void {
    this.loading.set(true);
    this.organisationService.getOne(id).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.uploadedLogo.set(data.logoUrl || null);
        this.loading.set(false);
      },
      error: () => {
        this.errorService.showError('Impossible de charger la compagnie');
        this.loading.set(false);
        this.goBack();
      },
    });
  }

  // --- UPLOAD LOGO ---
  onUpload(event: any): void {
    const file = event.files[0];
    if (!file) return;

    const maxSize     = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (file.size > maxSize)              { this.errorService.showError('Fichier trop volumineux (max 5MB)'); return; }
    if (!allowedTypes.includes(file.type)) { this.errorService.showError('Format non autorisé (jpg, png, gif)'); return; }

    this.fileUploadService.uploadLogo(file).subscribe({
      next: (response) => {
        const logoUrl = `${environment.urls.coreBase}${response.url}`;
        this.uploadedLogo.set(logoUrl);
        this.form.patchValue({ logoUrl });
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Logo téléchargé' });
      },
    });
  }

  // --- SOUMISSION ---
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    const payload = { ...this.form.value, id: this.form.value.id || 0 } as any;

    // Si id = 0 → création, sinon → modification
    const operation = !payload.id
      ? this.organisationService.create(payload)
      : this.organisationService.update(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: payload.id ? 'Compagnie mise à jour' : 'Compagnie créée' });
        this.loading.set(false);
        this.goBack();
      },
      error: () => this.loading.set(false),
    });
  }

  // --- NAVIGATION ---
  goBack(): void { this.router.navigate(['/admin/compagnies']); }
}
