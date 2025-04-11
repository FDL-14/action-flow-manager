
# Guia de Implantação do Sistema como SaaS

Este documento contém instruções detalhadas para implantar o sistema Gerenciador de Ações da Total Data como um Software as a Service (SaaS), permitindo que o sistema funcione na web e em dispositivos móveis (iOS e Android).

## Opção 1: Implantação Gratuita com Netlify

### 1. Preparando o código para implantação

1. Certifique-se de que tudo está funcionando localmente
2. Faça um fork ou clone do projeto para um repositório GitHub

### 2. Implantação com Netlify (Gratuito)

1. Crie uma conta em [Netlify](https://www.netlify.com/)
2. Clique em "Add new site" > "Import an existing project"
3. Selecione o GitHub e autorize o Netlify a acessar seus repositórios
4. Selecione o repositório do projeto
5. Configure as seguintes opções:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Clique em "Deploy site"

### 3. Configurando o domínio personalizado no Netlify (Opcional)

1. Compre um domínio (exemplo: totaldata.com.br) em um registrador como Namecheap, GoDaddy ou Registro.br
2. No painel do Netlify, vá para o seu site > Domain settings > Add custom domain
3. Digite seu domínio e siga o assistente para configurar os registros DNS

## Opção 2: Convertendo para Aplicativo Móvel com Capacitor

Para que a aplicação funcione em dispositivos móveis nativos (iOS e Android), siga estas etapas:

### 1. Configurando o Capacitor

1. Adicione o Capacitor ao projeto:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Gerenciador de Ações" "com.totaldata.actions" --web-dir=dist
```

2. Gere a versão de produção da aplicação web:
```bash
npm run build
```

3. Adicione as plataformas desejadas:
```bash
npx cap add android
npx cap add ios  # Requer macOS com Xcode instalado
```

4. Copie os arquivos da web para a aplicação nativa:
```bash
npx cap copy
```

### 2. Executando no Android

1. Abra o projeto no Android Studio:
```bash
npx cap open android
```

2. No Android Studio, clique em "Run" para implantar o aplicativo em um dispositivo ou emulador

3. Para gerar um APK para distribuição:
   - No Android Studio, vá para Build > Build Bundle(s) / APK(s) > Build APK(s)
   - O APK será gerado em `android/app/build/outputs/apk/debug/`

### 3. Executando no iOS (requer macOS)

1. Abra o projeto no Xcode:
```bash
npx cap open ios
```

2. No Xcode, selecione um dispositivo ou simulador e clique em "Run"

3. Para distribuir o aplicativo:
   - No Xcode, vá para Product > Archive
   - Siga as instruções para distribuir o aplicativo através da App Store ou TestFlight

## Opção 3: Hospedagem Gratuita com Firebase

O Firebase oferece um plano gratuito generoso e é uma excelente opção para implantar seu SaaS:

1. Crie uma conta no [Firebase](https://firebase.google.com/)
2. Instale o Firebase CLI:
```bash
npm install -g firebase-tools
```

3. Faça login no Firebase:
```bash
firebase login
```

4. Inicialize o Firebase no seu projeto:
```bash
firebase init
```

5. Selecione "Hosting" durante a configuração
6. Quando perguntado pelo diretório público, digite `dist`
7. Configure como um aplicativo de página única: Sim
8. Construa o projeto:
```bash
npm run build
```

9. Implante no Firebase:
```bash
firebase deploy
```

## Opção 4: Oracle Cloud Free Tier (Servidor Gratuito Permanente)

O Oracle Cloud oferece instâncias sempre gratuitas que são ideais para hospedar seu SaaS:

1. Crie uma conta no [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
2. Crie uma instância VM.Standard.E2.1.Micro (sempre gratuita)
3. Selecione Ubuntu como sistema operacional
4. Configure as regras de firewall para permitir tráfego HTTP (porta 80) e HTTPS (porta 443)
5. Conecte-se à instância via SSH
6. Instale o Node.js, Nginx e outras dependências:
```bash
sudo apt update
sudo apt install nodejs npm nginx certbot python3-certbot-nginx -y
```

7. Configure o Nginx como proxy reverso:
```
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        root /var/www/gerenciador-acoes/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

8. Clone o repositório e construa o projeto:
```bash
git clone seu-repositorio
cd seu-repositorio
npm install
npm run build
```

9. Copie os arquivos construídos para o diretório do servidor web:
```bash
sudo mkdir -p /var/www/gerenciador-acoes
sudo cp -r dist/* /var/www/gerenciador-acoes/
```

10. Configure HTTPS com Certbot:
```bash
sudo certbot --nginx -d seu-dominio.com
```

## Considerações para Escalar como SaaS

1. **Banco de Dados**: Atualmente, o sistema usa localStorage. Para um SaaS real, considere migrar para um banco de dados como:
   - Firebase Firestore (plano gratuito generoso)
   - Supabase (alternativa open-source ao Firebase com plano gratuito)
   - MongoDB Atlas (plano gratuito disponível)

2. **Autenticação**: Implemente um sistema de autenticação mais robusto:
   - Firebase Authentication (gratuito)
   - Auth0 (plano gratuito para até 7.000 usuários)
   - Supabase Auth (gratuito)

3. **Armazenamento de Arquivos**: Use um serviço de armazenamento para os anexos:
   - Firebase Storage (plano gratuito)
   - Cloudinary (plano gratuito)
   - Supabase Storage (gratuito)

4. **Planos de Assinatura**: Implemente um sistema de pagamento com:
   - Stripe (taxas por transação, sem mensalidade)
   - PayPal (taxas por transação)
   - MercadoPago (para o mercado brasileiro)

## Suporte e Manutenção

- Configure monitoramento gratuito com [UptimeRobot](https://uptimerobot.com/)
- Implemente registros de erro com o [Sentry](https://sentry.io/) (plano gratuito)
- Configure backups automáticos dos dados

## Teste e Otimização

1. Teste o desempenho do aplicativo com o [Lighthouse](https://developers.google.com/web/tools/lighthouse)
2. Otimize imagens e recursos para carregamento mais rápido
3. Implemente lazy loading para componentes grandes
4. Configure uma CDN gratuita com Cloudflare para melhorar o desempenho

## Conclusão

Com estas instruções, você pode implantar o Gerenciador de Ações da Total Data como um SaaS acessível via web e dispositivos móveis. O sistema está pronto para ser implantado gratuitamente e pode ser expandido conforme suas necessidades crescem.

Para suporte adicional ou dúvidas sobre a implantação, entre em contato com a equipe de desenvolvimento.
