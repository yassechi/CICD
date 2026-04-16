import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class AppComponent {
  title = 'MojoVelo';
}
