import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidNewsletter,
  isJidStatusBroadcast,
  useMultiFileAuthState,
} from "baileys";
import NodeCache from "node-cache";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import pino from "pino";
import { ROOT_DIR, TEMP_DIR } from "./config.js";
import { loadHandlers } from "./handlers/index.js";
import {
  errorLog,
  infoLog,
  successLog,
  warningLog,
} from "./logger.js";
import { onlyNumbers } from "./utils.js";

const SESSION_DIR = path.join(ROOT_DIR, "assets", "auth");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const logger = pino(
  { timestamp: () => `,"time":"${new Date().toJSON()}"` },
  pino.destination(path.join(TEMP_DIR, "wa-logs.txt")),
);

logger.level = "error";

const msgRetryCounterCache = new NodeCache();

let sessionErrorCount = 0;

function question(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => rl.question(message, resolve));
}

function formatPairingCode(code) {
  return code?.match(/.{1,4}/g)?.join("-") || code;
}

function normalizePhoneNumber(rawNumber) {
  const digits = onlyNumbers(rawNumber);

  if (!digits) {
    return null;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.length >= 12) {
    return digits;
  }

  return digits;
}

function clearSessionFilesExceptCreds() {
  try {
    const files = fs.readdirSync(SESSION_DIR);

    for (const file of files) {
      if (file === "creds.json") {
        continue;
      }

      fs.rmSync(path.join(SESSION_DIR, file), {
        recursive: true,
        force: true,
      });
    }
  } catch (error) {
    warningLog(`Não consegui limpar a sessão: ${error.message}`);
  }
}

async function requestPairing(socket) {
  console.log(
    'Informe o número do bot (SP/RJ exigem o 9º dígito).\nExemplo: "+5511912345678", demais estados: "+554112345678":',
  );

  const phoneNumber = await question("Número: ");

  if (!phoneNumber) {
    errorLog("Número inválido! Rode npm start de novo.");
    process.exit(1);
  }

  if (onlyNumbers(phoneNumber).length === 12) {
    warningLog(
      "Atenção: celulares brasileiros têm 13 dígitos (55 + DDD + 9 + 8). Se o pareamento falhar, confira o número.",
    );
  }

  let code;

  try {
    code = await socket.requestPairingCode(normalizePhoneNumber(phoneNumber));
  } catch (error) {
    errorLog(
      "Não consegui gerar o código de pareamento. Confira o número e rode npm start de novo.",
    );
    errorLog(`Detalhes: ${error?.message || error}`);
    process.exit(1);
  }

  if (!code) {
    errorLog("Não consegui gerar o código de pareamento. Rode npm start de novo.");
    process.exit(1);
  }

  console.log(`\nCódigo de pareamento: ${formatPairingCode(code)}`);
  console.log("\nPassos para conectar:");
  console.log("1. Abra o WhatsApp no celular com o número acima.");
  console.log("2. Configurações (⚙️) -> Aparelhos conectados -> Conectar um aparelho.");
  console.log("3. Escolha 'Conectar com número de telefone em vez do código QR'.");
  console.log("4. Digite o código. IMPORTANTE: ele expira em cerca de 1 minuto!\n");
}

async function connectOnce() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    logger,
    defaultQueryTimeoutMs: undefined,
    retryRequestDelayMs: 5000,
    auth: state,
    shouldIgnoreJid: (jid) =>
      isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid),
    connectTimeoutMs: 20_000,
    keepAliveIntervalMs: 30_000,
    maxMsgRetryCount: 5,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    emitOwnEvents: false,
    msgRetryCounterCache,
    shouldSyncHistoryMessage: () => false,
  });

  if (!socket.authState.creds.registered) {
    await requestPairing(socket);
  }

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      successLog("✅ Bot iniciado com sucesso!");
      successLog("Fui conectado com sucesso!");
      infoLog(`Versão do WhatsApp Web: ${version.join(".")}`);
      sessionErrorCount = 0;
      return;
    }

    if (connection !== "close") {
      return;
    }

    const error = lastDisconnect?.error;
    const statusCode = error?.output?.statusCode;
    const isBadMac =
      error?.message?.includes("Bad MAC") ||
      error?.toString()?.includes("Bad MAC");

    if (statusCode === DisconnectReason.loggedOut) {
      errorLog("Bot desconectado! O aparelho foi removido do WhatsApp.");
      warningLog(
        "Para reconectar: apague a pasta assets/auth e rode npm start de novo.",
      );
      process.exit(1);
      return;
    }

    if (
      isBadMac ||
      statusCode === DisconnectReason.badSession
    ) {
      sessionErrorCount += 1;
      warningLog(
        `Erro de sessão (${sessionErrorCount}/5). Tentando reconectar...`,
      );

      if (sessionErrorCount >= 5) {
        warningLog(
          "Limpando arquivos de sessão problemáticos (mantendo o pareamento)...",
        );
        clearSessionFilesExceptCreds();
        sessionErrorCount = 0;
      }
    }

    infoLog("Reconectando em 3 segundos...");

    setTimeout(async () => {
      const newSocket = await connectOnce();
      loadHandlers(newSocket);
    }, 3000);
  });

  socket.ev.on("creds.update", saveCreds);

  return socket;
}

export async function connect() {
  return await connectOnce();
}
