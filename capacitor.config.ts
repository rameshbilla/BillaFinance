import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.finserve.app',
  appName: 'FinServe',
  webDir: 'dist/finance-app/browser',
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
  },
};

export default config;
