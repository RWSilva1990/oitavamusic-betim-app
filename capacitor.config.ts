import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.oitavabetim.music',
  appName: 'Oitava Music',
  webDir: 'native-shell',
  backgroundColor: '#F0F2F8',
  loggingBehavior: 'debug',
  server: {
    // Somente para o protótipo Android: usa o Preview estável desta branch
    // para validar recursos nativos sem publicar o código na main.
    // Remover antes de uma versão Android de produção.
    url: 'https://oitavamusic-betim-app-git-feature-android-c-a86611-raphaelsilva.vercel.app',
    cleartext: false,
  },
  android: {
    backgroundColor: '#F0F2F8',
  },
};

export default config;
