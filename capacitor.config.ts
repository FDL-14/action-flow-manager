
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ccf7b317ddfd4d06a5b91e7e8b4a91e6',
  appName: 'Gerenciador de Ações',
  webDir: 'dist',
  server: {
    url: 'https://ccf7b317-ddfd-4d06-a5b9-1e7e8b4a91e6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  // Configurações para app móvel - ajuste conforme necessário
  ios: {
    contentInset: 'always',
  },
  android: {
    backgroundColor: "#FFFFFF"
  }
};

export default config;
