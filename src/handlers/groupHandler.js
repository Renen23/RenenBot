import {
  getExitMessage,
  getWelcomeMessage,
  isActiveExitGroup,
  isActiveWelcomeGroup,
  isAuthorizedGroup,
} from "../database.js";
import { errorLog } from "../logger.js";
import { exitMessage, welcomeMessage } from "../messages.js";
import { onlyNumbers } from "../utils.js";

export async function handleGroupEvent({ socket, remoteJid, action, memberLid }) {
  try {
    if (!isAuthorizedGroup(remoteJid)) {
      return;
    }

    const isAdd = action === "add";

    if (isAdd && !isActiveWelcomeGroup(remoteJid)) {
      return;
    }

    if (!isAdd && !isActiveExitGroup(remoteJid)) {
      return;
    }

    const custom = isAdd ? getWelcomeMessage(remoteJid) : getExitMessage(remoteJid);
    const base = custom || (isAdd ? welcomeMessage : exitMessage);

    const mentions = [];
    let text = base;

    if (text.includes("@member")) {
      text = text.replace("@member", `@${onlyNumbers(memberLid)}`);
      mentions.push(memberLid);
    }

    await socket.sendMessage(remoteJid, { text, mentions });
  } catch (error) {
    errorLog(`Erro no evento de grupo: ${error.message}`);
  }
}
