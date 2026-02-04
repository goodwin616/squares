import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

const app = initializeApp(environment.firebase);

if (typeof window !== 'undefined') {
  if (!environment.production) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

    const auth = getAuth(app);
    connectAuthEmulator(auth, 'http://localhost:9099');

    const firestore = getFirestore(app);
    connectFirestoreEmulator(firestore, 'localhost', 8080);

    const functions = getFunctions(app);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }

  const isPlaceholder = environment.recaptchaKey === 'YOUR_RECAPTCHA_V3_SITE_KEY';

  if (environment.recaptchaKey && !isPlaceholder) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(environment.recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });
  } else if (isPlaceholder) {
    console.warn(
      'Firebase App Check skipped: Placeholder key detected. Replace "YOUR_RECAPTCHA_V3_SITE_KEY" in environment.ts with your real key to enable.',
    );
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
  ],
};
