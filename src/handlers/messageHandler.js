import { findCommand, hasPermissionFor } from "../commands/registry.js";
import {
  isAuthorizedGroup,
  isMutedMember,
} from "../database.js";
import { errorLog } from "../logger.js";
import { isBotAdminUser, isOwner } from "../permissions.js";
import { createSender } from "../sender.js";
import { handleAntiLink } from "../services/antiLink.js";
import {
  extractMessage,
  isFromBot,
  isGroupMessage,
} from "../session.js";
import {
  GROUP_PARTICIPANT_ADD,
  GROUP_PARTICIPANT_LEAVE,
  isAddOrLeave,
  isTooOld,
} from "../utils.js";
import { handleGroupEvent } from "./groupHandler.js";

export async function handleMessage({ socket, webMessage }) {
  try {
    const remoteJid = webMessage?.key?.remoteJid;

    if (!isGroupMessage(remoteJid)) {
      return;
    }

    const { userLid, fullMessage, commandName, args, fullArgs, isReply, replyLid } =
      extractMessage(webMessage);

    if (isFromBot(webMessage) && !isOwner(userLid)) {
      return;
    }

    if (isTooOld(webMessage.messageTimestamp)) {
      return;
    }

    if (isAddOrLeave.includes(webMessage.messageStubType)) {
      const action =
        webMessage.messageStubType === GROUP_PARTICIPANT_ADD ? "add" : "remove";
      const memberLid = webMessage.messageStubParameters?.[0];

      if (memberLid) {
        await handleGroupEvent({ socket, remoteJid, action, memberLid });
      }

      return;
    }

    if (!userLid) {
      return;
    }

    const authorizedGroup = isAuthorizedGroup(remoteJid);

    if (authorizedGroup && isMutedMember(remoteJid, userLid)) {
      try {
        const { id, participant } = webMessage.key;
        await socket.sendMessage(remoteJid, {
          delete: { remoteJid, fromMe: false, id, participant },
        });
      } catch {
        // A exclusão só funciona se o bot for admin do grupo.
      }

      return;
    }

    if (authorizedGroup) {
      const handledByAntiLink = await handleAntiLink({
        socket,
        webMessage,
        fullMessage,
        userLid,
      });

      if (handledByAntiLink) {
        return;
      }
    }

    const owner = isOwner(userLid);
    const command = findCommand(commandName);
    const isOnCommand = command?.name === "on";

    // Gate 1: grupo não autorizado → ignora tudo, exceto /on usado pelo dono.
    if (!authorizedGroup && !(owner && isOnCommand)) {
      return;
    }

    // Gate 2: quem não é dono nem admin autorizado é completamente ignorado.
    if (!(owner || isBotAdminUser(userLid))) {
      return;
    }

    if (!command) {
      return;
    }

    // Gate 3: permissão do próprio comando (owner ou admin).
    if (!hasPermissionFor(command, userLid)) {
      return;
    }

    const sender = createSender({ socket, webMessage });

    await command.handle({
      socket,
      remoteJid,
      userLid,
      args,
      fullArgs,
      isReply,
      replyLid,
      sender,
    });
  } catch (error) {
    errorLog(`Erro ao processar mensagem: ${error.message}`);
  }
}
