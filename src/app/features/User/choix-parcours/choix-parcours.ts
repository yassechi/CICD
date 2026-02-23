import { ActivatedRoute, Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-user-choix-parcours',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './choix-parcours.html',
  styleUrls: ['./choix-parcours.scss'],
})
export class ChoixParcoursUtilisateurComponent {
  firstName = '';
  lastName = '';
  organisationName = '';
  organisationLogoUrl: string | null = null;

  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).snapshot.queryParams;

  constructor() {
    this.firstName = this.params['firstName'] || '';
    this.lastName = this.params['lastName'] || '';
    this.organisationName = this.params['organisationName'] || '';
    this.organisationLogoUrl = this.params['organisationLogoUrl'] || null;
  }

  goToQuestionnaire(): void { this.router.navigate(['/questionnaire-guide'], { queryParams: this.queryParams() }); }
  goToCatalogue(): void { this.router.navigate(['/catalogue-velos'], { queryParams: this.queryParams() }); }

  private queryParams(): Record<string, string> {
    const p: Record<string, string> = {};
    if (this.firstName) p['firstName'] = this.firstName;
    if (this.lastName) p['lastName'] = this.lastName;
    if (this.organisationName) p['organisationName'] = this.organisationName;
    if (this.organisationLogoUrl) p['organisationLogoUrl'] = this.organisationLogoUrl;
    return p;
  }
}
