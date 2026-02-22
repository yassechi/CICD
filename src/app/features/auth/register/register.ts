import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { UserService, UserRole } from '../../../core/services/user.service';
import { Organisation, OrganisationService } from '../../../core/services/organisation.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, SelectModule, ToastModule],
  providers: [PrimeMessageService],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class RegisterComponent {

  loading              = signal(false);
  loadingOrganisations = signal(false);
  organisations        = signal<Organisation[]>([]);

  private readonly fb                  = inject(FormBuilder);
  private readonly userService         = inject(UserService);
  private readonly organisationService = inject(OrganisationService);
  private readonly router              = inject(Router);
  private readonly messageService      = inject(PrimeMessageService);
  private readonly errorService        = inject(ErrorService);

  form = this.fb.group({
    userName:        ['', Validators.required],
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    phoneNumber:     ['', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    organisationId:  [null as number | null, Validators.required],
  }, { validators: this.passwordMatchValidator });

  constructor() { this.loadOrganisations(); }

  loadOrganisations(): void {
    this.loadingOrganisations.set(true);
    this.organisationService.getAll().subscribe({
      next: (data) => {
        this.organisations.set((data ?? []).slice().sort((a: Organisation, b: Organisation) => a.name.localeCompare(b.name)));
        this.loadingOrganisations.set(false);
      },
      error: () => {
        this.loadingOrganisations.set(false);
        this.errorService.showError('Impossible de charger les organisations');
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.getRawValue();
    this.userService.create({
      userName:        String(v.userName        ?? '').trim(),
      firstName:       String(v.firstName       ?? '').trim(),
      lastName:        String(v.lastName        ?? '').trim(),
      email:           String(v.email           ?? '').trim(),
      phoneNumber:     String(v.phoneNumber     ?? '').trim(),
      password:        v.password,
      confirmPassword: v.confirmPassword,
      role:            UserRole.User,
      isActif:         true,
      organisationId:  Number(v.organisationId),
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Compte cree avec succes' });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorService.showError(err?.error?.message || 'Impossible de creer le compte');
      },
    });
  }

  goToLogin(): void { this.router.navigate(['/login']); }

  private passwordMatchValidator(form: FormGroup) {
    const pwd     = form.get('password');
    const confirm = form.get('confirmPassword');
    if (!pwd || !confirm) return null;
    if (!pwd.value && !confirm.value) {
      if (confirm.errors?.['passwordMismatch']) {
        const { passwordMismatch, ...rest } = confirm.errors;
        confirm.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }
    if (pwd.value !== confirm.value) {
      confirm.setErrors({ ...(confirm.errors ?? {}), passwordMismatch: true });
      return { passwordMismatch: true };
    }
    if (confirm.errors?.['passwordMismatch']) {
      const { passwordMismatch, ...rest } = confirm.errors;
      confirm.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  }
}
