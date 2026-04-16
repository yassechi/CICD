import { SidebarComponent } from '../sidebar/sidebar';
import { NavbarComponent } from '../navbar/navbar';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss'],
})
export class MainLayoutComponent {
  sidebarVisible = true;
  private readonly mobileMaxWidth = 768;

  constructor() {
    this.sidebarVisible = !this.isMobile();
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  onContentClick(): void {
    if (this.isMobile() && this.sidebarVisible) {
      this.sidebarVisible = false;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isMobile() && this.sidebarVisible) {
      this.sidebarVisible = false;
    } else if (!this.isMobile() && !this.sidebarVisible) {
      this.sidebarVisible = true;
    }
  }

  private isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= this.mobileMaxWidth;
  }
}
