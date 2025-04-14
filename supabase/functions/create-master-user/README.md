
# Função de Criação de Usuário Master

Esta Função Edge cria um usuário master com todos os privilégios no sistema.

Ela realiza:
- Verificação se o usuário master já existe
- Criação do usuário no sistema de Autenticação
- Configuração do perfil do usuário com papel de master
- Adição de todas as permissões necessárias

## Variáveis de Ambiente
- SUPABASE_URL: A URL do seu projeto Supabase (definida automaticamente)
- SUPABASE_SERVICE_ROLE_KEY: A chave de serviço do seu projeto Supabase (deve ser configurada manualmente)

## Uso
Esta função é chamada a partir da página de login ao clicar no botão "Criar usuário master".

## Solução de Problemas
Se a função falhar, verifique:
1. Se a chave SUPABASE_SERVICE_ROLE_KEY está configurada corretamente
2. Se o usuário master já não existe no sistema
3. Os logs da função para mensagens de erro detalhadas
