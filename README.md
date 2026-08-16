# Renen Bot

Bot de WhatsApp para moderação de grupos.

**Segurança:** o bot só responde para o **dono** e para quem o dono autorizar (`/adm`), e apenas em grupos ativados pelo dono (`/on`). Qualquer outra pessoa é completamente ignorada.

## Como configurar

1. Edite `src/config.js` e ajuste:
   - `OWNER_LID` → seu número no formato `55DDD9XXXXXXXX@lid`
   - `BOT_LID` → o número em que o bot estará pareado
2. Instale as dependências:
   ```
   npm install
   ```
3. Inicie o bot:
   ```
   npm start
   ```
4. Na primeira vez, informe o número do bot e faça o pareamento (código de 8 dígitos no WhatsApp).

## Primeiros passos no grupo

1. Entre no grupo com o número do bot e, no grupo, o **dono** envia: `/on`
2. O dono pode adicionar um admin do bot com `/adm add @usuario`
3. Opcionais: `/welcome 1`, `/exit 1`, `/anti-link 1`

## Comandos

| Comando | Quem pode | Função |
| --- | --- | --- |
| `/on` | dono | Ativa o bot no grupo |
| `/off` | dono | Desativa o bot no grupo |
| `/adm add/remove/lista @user` | dono | Gerencia admins do bot |
| `/menu` | dono + admins | Menu de comandos |
| `/ping` | dono + admins | Teste de conexão |
| `/ban @user` | dono + admins | Remove membro |
| `/mute` / `/unmute` | dono + admins | Silencia / reativa membro |
| `/warn @user motivo` | dono + admins | Advertência (3 → remove) |
| `/unwarn @user` | dono + admins | Remove advertência |
| `/limpar-chat` | dono + admins | Limpa o chat |
| `/link-grupo` | dono + admins | Link do grupo |
| `/confiavel` | dono + admins | Libera membros p/ links |
| `/anti-link 1/0` | dono + admins | Bloqueia links |
| `/welcome 1/0` | dono + admins | Boas-vindas |
| `/exit 1/0` | dono + admins | Despedida |
| `/set-welcome texto @member` | dono + admins | Mensagem de boas-vindas |
| `/set-exit texto @member` | dono + admins | Mensagem de despedida |
