import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.oitavabetim.music',
  appName: 'Oitava Music',
  webDir: 'native-shell',
  backgroundColor: '#F0F2F8',
  loggingBehavior: 'debug',
  server: {
    // Somente para o protótipo Android: usa um Preview exato da branch
    // e mantém esse host dentro da WebView durante o teste.
    // Remover antes de uma versão Android de produção.
    url: 'https://oitavamusic-betim-bla32c66w-raphaelsilva.vercel.app',
    allowNavigation: ['oitavamusic-betim-bla32c66w-raphaelsilva.vercel.app'],
    cleartext: false,
  },
  android: {
    backgroundColor: '#F0F2F8',
  },
};

export default config;
