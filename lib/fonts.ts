import localFont from 'next/font/local'

export const tdSansHeadline = localFont({
  variable: '--font-td-headline',
  display: 'swap',
  src: [
    { path: '../app/fonts/TDSansHeadline-Light.woff2', weight: '300', style: 'normal' },
    { path: '../app/fonts/TDSansHeadline-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../app/fonts/TDSansHeadline-Bold.woff2', weight: '700', style: 'normal' },
  ],
})

export const tdSansBody = localFont({
  variable: '--font-td-body',
  display: 'swap',
  src: [
    { path: '../app/fonts/TDSansBody-Light.woff2', weight: '300', style: 'normal' },
    { path: '../app/fonts/TDSansBody-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../app/fonts/TDSansBody-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../app/fonts/TDSansBody-Bold.woff2', weight: '700', style: 'normal' },
  ],
})
