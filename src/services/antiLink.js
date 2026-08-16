import { OWNER_LID } from "../config.js";
import {
  isActiveAntiLinkGroup,
  isBotAdmin,
  isTrustedUser,
} from "../database.js";
import { isBotAdminUser, isOwner } from "../permissions.js";
import { onlyNumbers } from "../utils.js";
import { errorLog } from "../logger.js";
import { addWarn, getWarnLimit } from "./warns.js";

const LINK_REGEX =
  /(?:https?:\/\/|ftp:\/\/|www\.|wa\.me|t\.me|telegram\.me|chat\.whatsapp\.com|bit\.ly|goo\.gl|tinyurl|youtu\.be)[^\s]+|[a-z0-9-]+\.(?:com|com\.br|net|org|io|xyz|site|shop|store|online|link|gg|cc|me|info|biz|tv|app|dev|tech|blog)(?:\/[^\s]*)?/i;

async function isGroupAdmin(socket, remoteJid, userLid) {
  try {
    const metadata = await socket.groupMetadata(remoteJid);

    const participant = metadata.participants.find((p) => p.id === userLid);

    if (!participant) {
      return false;
    }

    return participant.admin === "admin" || participant.admin === "superadmin";
  } catch {
    return false;
  }
}

export async function handleAntiLink({ socket, webMessage, fullMessage, userLid }) {
  try {
    const remoteJid = webMessage?.key?.remoteJid;

    if (!remoteJid?.endsWith("@g.us")) {
      return false;
    }

    if (!isActiveAntiLinkGroup(remoteJid)) {
      return false;
    }

    if (!userLid || !LINK_REGEX.test(fullMessage || "")) {
      return false;
    }

    if (isOwner(userLid) || isBotAdminUser(userLid)) {
      return false;
    }

    if (isTrustedUser(remoteJid, userLid)) {
      return false;
    }

    if (await isGroupAdmin(socket, remoteJid, userLid)) {
      return false;
    }

    try {
      const { id, participant } = webMessage.key;
      await socket.sendMessage(remoteJid, {
        delete: { remoteJid, fromMe: false, id, participant },
      });
    } catch (error) {
      errorLog(`Anti-link: não consegui apagar a mensagem: ${error.message}`);
    }

    const count = addWarn(remoteJid, userLid, "Link não permitido");
    const limit = getWarnLimit();
    const number = onlyNumbers(userLid);

    if (count >= limit) {
      await socket.sendMessage(remoteJid, {
        text: `🚫 *@${number}* atingiu o limite de advertências por enviar links e foi removido do grupo!`,
        mentions: [userLid],
      });

      try {
        await socket.groupParticipantsUpdate(remoteJid, [userLid], "remove");
      } catch (error) {
        errorLog(`Anti-link: não consegui remover o membro: ${error.message}`);
      }
    } else {
      await socket.sendMessage(remoteJid, {
        text: `🚫 *@${number}* enviou um link! O link foi apagado. Advertência ${count}/${limit}.`,
        mentions: [userLid],
      });
    }

    return true;
  } catch (error) {
    errorLog(`Erro no anti-link: ${error.message}`);
    return false;
  }
}
