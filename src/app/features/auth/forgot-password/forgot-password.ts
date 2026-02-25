import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from '../../../core/services/message.service';
import { AuthService } from '../../../core/services/auth.service';
import { Component, inject, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, InputTextModule, ButtonModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  forgotForm: FormGroup = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  loading = signal(false);
  emailSent = signal(false);

  onSubmit(): void {
    if (this.forgotForm.invalid) { this.forgotForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.authService.forgotPassword(this.forgotForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.emailSent.set(true);
        this.messageService.showSuccess('Si cet email existe, vous recevrez un lien de r?initialisation.', 'Email envoy?');
      },
      error: () => {
        this.loading.set(false);
        this.messageService.showError('Une erreur est survenue. Veuillez r?essayer.');
      }
    });
  }

  get email() { return this.forgotForm.get('email'); }
}
