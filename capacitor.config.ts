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
      statsUrl: 'https://api.capgo.app/stats',
      updateUrl: 'https://api.capgo.app/updates',
    },
  },
}

export default config
