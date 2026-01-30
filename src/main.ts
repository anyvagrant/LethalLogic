import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component'; // MUDANÇA AQUI: sem a pasta /app/
import { provideZoneChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
}).catch((err) => console.error(err));
