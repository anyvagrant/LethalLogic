import { bootstrapApplication } from '@angular/platform-browser';
import { appcomponent } from './app/app.component';
import { provideZoneChangeDetection } from '@angular/core';

bootstrapApplication(appcomponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
}).catch((err) => console.error(err));
