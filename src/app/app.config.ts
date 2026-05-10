import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore, initializeFirestore } from '@angular/fire/firestore';
import { persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { Capacitor } from '@capacitor/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => {
      if (Capacitor.isNativePlatform()) {
        return initializeFirestore(getAuth().app, {
          experimentalForceLongPolling: true,
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
      }

      return getFirestore();
    }),
    provideStorage(() => getStorage()),
    provideHttpClient(),
    provideCharts(withDefaultRegisterables())
  ]
};
