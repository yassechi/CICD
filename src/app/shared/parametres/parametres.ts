import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, UserService } from '../../core/services/user.service';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/I18n.service';
import { Component, inject, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, InputTextModule, ButtonModule, PasswordModule],
  templateUrl: './parametres.html',
  styleUrls: ['./parametres.scss'],
})
export class ParametresComponent {
  loading = signal(false);
  currentUser = signal<User | null>(null);
  activeTab: 'profile' | 'password' = 'profile';

  private readonly fb = inject(FormBuilder);
  profileForm: FormGroup = this.fb.group({
    userName: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    tailleCm: [177],
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  readonly i18n = inject(I18nService);

  constructor() {
    this.loadProfile();
  }

  updateProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    const u = this.currentUser();
    if (!u) return;

    this.loading.set(true);
    const v = this.profileForm.value;
    this.userService.update({
      id: u.id,
      userName: v.userName,
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phoneNumber: v.phoneNumber,
      role: u.role,
      tailleCm: Number(v.tailleCm),
      isActif: u.isActif,
      organisationId: u.organisationId,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.showSuccess(this.i18n.get('parametres.profileUpdated'));
        this.loadProfile();
      },
      error: () => {
        this.loading.set(false);
        this.messageService.showError(this.i18n.get('parametres.profileUpdateError'));
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    const u = this.currentUser();
    if (!u) return;

    this.loading.set(true);
    const v = this.passwordForm.value;
    this.userService.update({
      ...(u as any),
      password: v.newPassword,
      confirmPassword: v.confirmPassword,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.passwordForm.reset();
        this.messageService.showSuccess(this.i18n.get('parametres.passwordUpdated'));
      },
      error: () => {
        this.loading.set(false);
        this.messageService.showError(this.i18n.get('parametres.passwordUpdateError'));
      },
    });
  }

  setActiveTab(tab: 'profile' | 'password'): void { this.activeTab = tab; }

  private loadProfile(): void {
    const storedId = this.authService.getCurrentUser()?.id;

    this.userService.getMe().subscribe({
      next: (data: any) => this.applyUserData(data),
      error: () => {
        if (!storedId) {
          this.messageService.showError(this.i18n.get('parametres.loadProfileError'));
          return;
        }
        this.userService.getOne(storedId).subscribe({
          next: (data: any) => this.applyUserData(data),
          error: () => this.messageService.showError(this.i18n.get('parametres.loadProfileError')),
        });
      },
    });
  }

  private applyUserData(data: any): void {
    this.currentUser.set(data);
    this.profileForm.patchValue({
      userName: data.userName,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      tailleCm: data.tailleCm || 177,
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const pwd = form.get('newPassword')?.value;
    const confirm = form.get('confirmPassword');
    if (pwd !== confirm?.value) {
      confirm?.setErrors({ ...(confirm.errors ?? {}), passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }
}
