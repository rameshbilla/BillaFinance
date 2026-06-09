import { ApplicationConfig, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideFirebaseApp, initializeApp, FirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, initializeFirestore } from '@angular/fire/firestore';
import { persistentLocalCache, persistentMultipleTabManager, persistentSingleTabManager } from 'firebase/firestore';
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
      const app = inject(FirebaseApp);
      if (Capacitor.isNativePlatform()) {
        // Mobile APK: use long-polling + single-tab persistent cache
        return initializeFirestore(app, {
          experimentalForceLongPolling: true,
          localCache: persistentLocalCache({
            tabManager: persistentSingleTabManager({})
          })
        });
      }

      // Web browser: use persistent multi-tab cache for real-time sync across tabs
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    }),
    provideStorage(() => getStorage()),
    provideHttpClient(),
    provideCharts(withDefaultRegisterables())
  ]
};
