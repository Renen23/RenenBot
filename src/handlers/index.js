import { errorLog } from "../logger.js";
import { handleMessage } from "./messageHandler.js";

export function loadHandlers(socket) {
  socket.ev.on("messages.upsert", async ({ messages }) => {
    if (!messages?.length) {
      return;
    }

    for (const webMessage of messages) {
      try {
        await handleMessage({ socket, webMessage });
      } catch (error) {
        errorLog(`Erro ao processar mensagem: ${error.message}`);
      }
    }
  });
}
