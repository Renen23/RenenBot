import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefixo dos comandos.
export const PREFIX = "/";

// Emoji do bot.
export const BOT_EMOJI = "🤖";

// Nome do bot.
export const BOT_NAME = "Renen";

// ============================================================
// IMPORTANTE: configure abaixo os LIDs do dono e do bot.
// LID = numero com o codigo do pais e "@lid" no final.
// Exemplo: 557499741346@lid  (55 + DDD + 9 + 8 digitos)
//
// Para descobrir o LID de um numero depois de parear, o dono
// pode usar /meu-lid se o comando existir, ou ler a config.
// ============================================================

// LID do dono do bot (o unico que pode usar /on, /off e /adm).
// Numero do dono: 83991534841
export const OWNER_LID = "5583991534841@lid";

// LID do numero em que o bot esta pareado (o proprio bot).
// Se o bot estiver no MESMO numero do dono, deixe igual ao de cima.
// Se estiver em outro numero, troque aqui.
export const BOT_LID = "5583991534841@lid";

// Diretorio raiz do projeto.
export const ROOT_DIR = path.resolve(__dirname, "..");

// Diretorio dos dados (JSON). Nao vai para o git.
export const DATABASE_DIR = path.join(ROOT_DIR, "database");

// Diretorio dos arquivos de midia (imagens de gatinho etc).
export const ASSETS_DIR = path.join(ROOT_DIR, "assets");

// Diretorio temporario (logs do baileys).
export const TEMP_DIR = path.join(ASSETS_DIR, "temp");
