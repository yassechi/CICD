import { OrganisationService } from '../../../../core/services/organisation.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { User, UserService } from '../../../../core/services/user.service';
import { MessageService } from '../../../../core/services/message.service';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-compagnie-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    FileUploadModule,
    SelectModule],
  templateUrl: './compagnie-form.html',
  styleUrls: ['./compagnie-form.scss'],
})
export class CompagnieFormComponent {
  loading = signal(false);
  loadingUsers = signal(false);
  uploadedLogo = signal<string | null>(null);
  users = signal<User[]>([]);
  isEdit = false;
  private pendingLogo: { base64: string; fileName: string; mimeType: string } | null = null;

  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    id: [0],
    name: ['', Validators.required],
    code: ['', Validators.required],
    address: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    emailAutorise: [
      '',
      [Validators.required, Validators.pattern(/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    idContact: ['', Validators.required],
    isActif: [true],
  });

  get name() {
    return this.form.get('name');
  }
  get code() {
    return this.form.get('code');
  }
  get address() {
    return this.form.get('address');
  }
  get contactEmail() {
    return this.form.get('contactEmail');
  }
  get emailAutorise() {
    return this.form.get('emailAutorise');
  }
  get idContact() {
    return this.form.get('idContact');
  }

  private readonly organisationService = inject(OrganisationService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    this.loadingUsers.set(true);
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users.set(data ?? []);
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false),
    });

    const id = Number(this.route.snapshot.paramMap.get('id')) || 0;
    this.isEdit = !!id;
    if (!id) return;

    this.loading.set(true);
    this.organisationService.getOne(id).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.loadActiveLogo(id);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.showError('Impossible de charger la compagnie');
        this.loading.set(false);
        this.goBack();
      },
    });
  }

  private loadActiveLogo(organisationId: number): void {
    this.organisationService.getActiveLogo(organisationId).subscribe({
      next: (logo) => this.uploadedLogo.set(this.organisationService.buildLogoDataUrl(logo)),
      error: () => {},
    });
  }

  onUpload(event: any): void {
    const file = event?.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.messageService.showError('Fichier trop volumineux (max 5MB)');
      return;
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      this.messageService.showError('Format non autorisé (jpg, png, gif)');
      return;
    }

    this.readFileAsBase64(file)
      .then(({ base64, dataUrl }) => {
        this.pendingLogo = { base64, fileName: file.name, mimeType: file.type };
        this.uploadedLogo.set(dataUrl);
      })
      .catch(() => this.messageService.showError('Impossible de lire le fichier'));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = { ...this.form.value, id: this.form.value.id || 0 } as any;
    const op = payload.id
      ? this.organisationService.update(payload)
      : this.organisationService.create(payload);
    op.subscribe({
      next: (response) => {
        const organisationId = payload.id || response?.id;
        if (this.pendingLogo) {
          if (!organisationId) {
            this.messageService.showError('Logo non enregistre');
            this.finishSave(!!payload.id);
            return;
          }
          this.organisationService.createLogo({
            organisationId,
            fichier: this.pendingLogo.base64,
            nomFichier: this.pendingLogo.fileName,
            typeFichier: this.pendingLogo.mimeType,
            isActif: true,
          }).subscribe({
            next: () => this.finishSave(!!payload.id),
            error: () => {
              this.loading.set(false);
              this.messageService.showError('Logo non enregistre');
            },
          });
          return;
        }
        this.finishSave(!!payload.id);
      },
      error: () => this.loading.set(false),
    });
  }

  private finishSave(isEdit: boolean): void {
    this.messageService.showSuccess(
      isEdit ? 'Compagnie mise à jour' : 'Compagnie créée',
      'Succès',
    );
    this.loading.set(false);
    this.goBack();
  }

  private readFileAsBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const base64 = dataUrl.split(',')[1] || '';
        if (!base64) {
          reject(new Error('Empty base64'));
          return;
        }
        resolve({ base64, dataUrl });
      };
      reader.onerror = () => reject(reader.error ?? new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/compagnies']);
  }
}
