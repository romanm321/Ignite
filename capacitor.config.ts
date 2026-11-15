import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.td.bank.td.bank',
  appName: 'TD Bank',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
      autoDeleteFailed: true,
      autoDeletePrevious: true,
      resetWhenUpdate: true,
      appReadyTimeout: 15000,
      responseTimeout: 30,
      periodCheckDelay: 600,
      defaultChannel: 'dev',
    },
  },
}

export default config
