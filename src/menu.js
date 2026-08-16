import path from "node:path";
import pkg from "../package.json" with { type: "json" };
import { ASSETS_DIR, BOT_EMOJI, BOT_NAME, PREFIX } from "./config.js";
import { readMore } from "./utils.js";

let kittenIndex = 0;

const kittenImages = [1, 2, 3, 4].map((n) =>
  path.join(ASSETS_DIR, "images", "gatinhos", `gato-0${n}.png`),
);

export function getNextKitten() {
  const selectedImage = kittenImages[kittenIndex];
  kittenIndex = (kittenIndex + 1) % kittenImages.length;
  return selectedImage;
}

export function menuMessage() {
  const currentDate = new Date();

  const date = currentDate.toLocaleDateString("pt-BR");
  const time = currentDate.toLocaleTimeString("pt-BR");

  return `╭━━⪩ RENEN BOT ⪨━━${readMore()}
▢
▢ • ${BOT_NAME} ${BOT_EMOJI}
▢ • Data: ${date}
▢ • Hora: ${time}
▢ • Prefixo: ${PREFIX}
▢ • Versão: ${pkg.version}
▢
╰━━─「${BOT_EMOJI}」─━━

╭━━⪩ DONO ⪨━━
▢
▢ • ${PREFIX}on              Ativar bot neste grupo
▢ • ${PREFIX}off             Desativar bot neste grupo
▢ • ${PREFIX}adm             Gerenciar admins do bot
▢
╰━━─「👑」─━━

╭━━⪩ MODERAÇÃO ⪨━━
▢
▢ • ${PREFIX}ban             Remover membro
▢ • ${PREFIX}mute            Silenciar membro
▢ • ${PREFIX}unmute          Reativar membro
▢ • ${PREFIX}warn            Advertir membro
▢ • ${PREFIX}unwarn          Remover advertência
▢ • ${PREFIX}limpar-chat     Limpar o chat
▢ • ${PREFIX}link-grupo      Link do grupo
▢
╰━━─「🛡️」─━━

╭━━⪩ PROTEÇÃO ⪨━━
▢
▢ • ${PREFIX}anti-link (1/0) Bloquear links
▢ • ${PREFIX}confiavel      Liberar membros p/ links
▢
╰━━─「🔐」─━━

╭━━⪩ MENSAGENS ⪨━━
▢
▢ • ${PREFIX}welcome (1/0)   Boas-vindas
▢ • ${PREFIX}exit (1/0)      Despedida
▢ • ${PREFIX}set-welcome     Definir boas-vindas
▢ • ${PREFIX}set-exit        Definir despedida
▢
╰━━─「💬」─━━

╭━━⪩ GERAL ⪨━━
▢
▢ • ${PREFIX}menu
▢ • ${PREFIX}ping
▢
╰━━─「🐱」─━━

Feito por ${BOT_NAME} • ${BOT_EMOJI}`;
}
