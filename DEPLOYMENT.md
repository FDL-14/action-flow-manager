
# Guia de Implantação do Sistema como SaaS (Web, iOS e Android)

Este documento contém instruções detalhadas para implantar o sistema Gerenciador de Ações da Total Data como um Software as a Service (SaaS), permitindo que o sistema funcione na web e em dispositivos móveis (iOS e Android).

## Parte 1: Implantação Web

### Opção 1: Implantação Gratuita com Netlify

1. Crie uma conta em [Netlify](https://www.netlify.com/)
2. Clique em "Add new site" > "Import an existing project"
3. Selecione o GitHub e autorize o Netlify a acessar seus repositórios
4. Selecione o repositório do projeto
5. Configure as seguintes opções:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Clique em "Deploy site"

### Configuração de domínio personalizado (Opcional)

1. Compre um domínio (exemplo: totaldata.com.br) 
2. No painel do Netlify, vá para o seu site > Domain settings > Add custom domain
3. Digite seu domínio e siga o assistente para configurar os registros DNS

## Parte 2: Implantação Mobile (iOS e Android)

Este projeto utiliza Capacitor para funcionar como um aplicativo nativo iOS e Android.

### Preparação do Ambiente

1. Certifique-se de ter instalado:
   - Node.js 14 ou superior
   - Para Android: Android Studio e JDK 11+
   - Para iOS: macOS e Xcode 13+

### Passos para Gerar os Aplicativos Móveis

1. Clone o repositório:
```bash
git clone [URL-DO-REPOSITÓRIO]
cd [NOME-DO-PROJETO]
```

2. Instale as dependências:
```bash
npm install
```

3. Construa o projeto:
```bash
npm run build
```

4. Sincronize o projeto com Capacitor:
```bash
npx cap sync
```

### Para Android:

1. Abra o projeto no Android Studio:
```bash
npx cap open android
```

2. No Android Studio:
   - Clique em Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Distribua o arquivo APK gerado em `android/app/build/outputs/apk/debug/`

### Para iOS (requer macOS):

1. Abra o projeto no Xcode:
```bash
npx cap open ios
```

2. No Xcode:
   - Selecione seu dispositivo ou simulador
   - Clique em Product > Archive para gerar o arquivo IPA
   - Use o App Store Connect para distribuir o aplicativo

## Parte 3: Configuração de Email

O sistema está configurado para usar EmailJS para enviar emails automaticamente. Esta configuração já está funcional e não requer nenhuma configuração adicional.

Se você precisar alterar as credenciais:

1. Crie uma conta em [EmailJS](https://www.emailjs.com/)
2. Crie um serviço, template e obtenha seu user ID
3. Edite o arquivo `src/services/email.ts` com suas novas credenciais:
   - EMAILJS_SERVICE_ID
   - EMAILJS_TEMPLATE_ID
   - EMAILJS_USER_ID

## Considerações para Escalabilidade

1. **Banco de Dados**: Para um SaaS escalável, considere migrar de localStorage para:
   - Firebase Firestore
   - Supabase
   - MongoDB Atlas

2. **Autenticação**: Implemente autenticação mais robusta com:
   - Firebase Authentication
   - Auth0
   - Supabase Auth

3. **Armazenamento**: Para anexos e arquivos, use:
   - Firebase Storage
   - Cloudinary
   - AWS S3

4. **Monitoramento**: Configure:
   - UptimeRobot para monitoramento
   - Sentry para rastreamento de erros

## Suporte e Manutenção

Em caso de problemas ou dúvidas sobre a implantação, entre em contato com a equipe de desenvolvimento.
