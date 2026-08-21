import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.oitavabetim.music',
  appName: 'Oitava Music',
  webDir: 'native-shell',
  backgroundColor: '#F0F2F8',
  loggingBehavior: 'debug',
  server: {
    // Protótipo inicial: carrega a versão web estável para validarmos o contêiner Android
    // sem duplicar nem alterar o backend existente. Remover antes de uma versão de produção.
    url: 'https://oitavamusicbetim.vercel.app',
    cleartext: false,
  },
  android: {
    backgroundColor: '#F0F2F8',
  },
};

export default config;
