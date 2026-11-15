# TD Bank — Ignite (Capacitor + CapGo)

Мобільний додаток **TD Bank**, побудований на базі **Capacitor** (нативні оболонки для **Android** та **iOS**) із внутрішньою частиною у вигляді статичного веб-бандлу (**Bundle**) та інтеграцією **CapGo Live Updates** (`com.td.bank.td.bank`).

## Архітектура проєкту

- **`android/` та `ios/`** — тонкі нативні оболонки Capacitor з інтегрованим плагіном `@capgo/capacitor-updater`.
- **`app/`, `components/`, `lib/`** — внутрішня мобільна частина додатку (виділена з `Tedi_prototypes` без десктопної обгортки), яка збирається у статичний бандл (`out/`).
- **`components/bank/capgo-updater.tsx`** — клієнтська ініціалізація CapGo (`CapacitorUpdater.notifyAppReady()`) для підтвердження успішного завантаження OTA-бандлу.
- **`capacitor.config.ts`** — конфігурація Capacitor для `appId: "com.td.bank.td.bank"` з увімкненим `autoUpdate: true` для CapGo.
- **`.github/workflows/capgo-bundle.yml`** — GitHub Actions пайплайн для автоматичної збірки бандлу та відправки в CapGo при пуші у гілку `main`.

## Основні команди

```bash
# Локальний запуск для розробки
npm run dev

# Збірка статичного веб-бандлу (у директорію out/)
npm run build

# Збірка бандлу та синхронізація з нативними оболонками Android і iOS
npm run cap:sync

# Запакувати внутрішню частину в CapGo Bundle (.zip)
npm run capgo:zip

# Відправити зібраний бандл у CapGo (com.td.bank.td.bank)
npx @capgo/cli bundle upload com.td.bank.td.bank --path out --apikey <YOUR_CAPGO_API_KEY>

# Відкрити нативні проєкти в Android Studio / Xcode
npm run cap:android
npm run cap:ios
```

## Інтеграція з CapGo

- **App ID:** `com.td.bank.td.bank`
- **CapGo Console:** https://console.capgo.app/app/com.td.bank.td.bank/getting-started
- Для автоматичного завантаження бандлів через GitHub Actions додайте секрет `CAPGO_API_KEY` у налаштуваннях репозиторію (`Settings -> Secrets and variables -> Actions`).
