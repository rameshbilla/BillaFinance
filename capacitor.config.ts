import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.finserve.app',
  appName: 'FinServe',
  webDir: 'dist/finance-app/browser',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
