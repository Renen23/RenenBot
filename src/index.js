import { connect } from "./connection.js";
import { loadHandlers } from "./handlers/index.js";
import {
  bannerLog,
  errorLog,
  infoLog,
  installConsoleNoiseFilter,
} from "./logger.js";

installConsoleNoiseFilter();

process.on("uncaughtException", (error) => {
  errorLog(`Erro crítico não capturado: ${error.message}`);

  if (
    !error.message.includes("ENOTFOUND") &&
    !error.message.includes("timeout")
  ) {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason) => {
  errorLog(`Promessa rejeitada não tratada: ${reason?.message || reason}`);
});

async function startBot() {
  try {
    bannerLog();
    infoLog("Iniciando Renen Bot...");

    const socket = await connect();

    loadHandlers(socket);

    // Mantém o processo vivo mesmo em momentos de espera da conexão.
    setInterval(() => {}, 1 << 30);
  } catch (error) {
    errorLog(`Erro ao iniciar o bot: ${error.message}`);
    errorLog(error.stack);
    process.exit(1);
  }
}

startBot();
