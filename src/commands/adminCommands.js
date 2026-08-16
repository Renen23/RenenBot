import { BOT_LID, OWNER_LID, PREFIX } from "../config.js";
import {
  activateAntiLinkGroup,
  activateExitGroup,
  activateWelcomeGroup,
  addTrustedUser,
  deactivateAntiLinkGroup,
  deactivateExitGroup,
  deactivateWelcomeGroup,
  getExitMessage,
  getTrustedUsers,
  getWelcomeMessage,
  isActiveAntiLinkGroup,
  isActiveExitGroup,
  isActiveWelcomeGroup,
  isTrustedUser,
  muteMember,
  removeTrustedUser,
  resetExitMessage,
  resetWelcomeMessage,
  setExitMessage,
  setWelcomeMessage,
  unmuteMember,
  isMutedMember,
} from "../database.js";
import {
  clearChat,
  isFalse,
  isTrue,
  normalizeText,
  onlyNumbers,
} from "../utils.js";
import { addWarn, getWarnCount, getWarnLimit, removeLastWarn } from "../services/warns.js";

function getTargetLid(args, isReply, replyLid) {
  if (isReply && replyLid) {
    return replyLid;
  }

  const mention = args?.find((arg) => arg.includes("@"));

  if (mention) {
    return `${onlyNumbers(mention)}@lid`;
  }

  return null;
}

async function memberInGroup(socket, remoteJid, userLid) {
  try {
    const metadata = await socket.groupMetadata(remoteJid);
    return metadata.participants.some((p) => p.id === userLid);
  } catch {
    return false;
  }
}

const adminCommands = [
  {
    name: "ban",
    level: "admin",
    commands: ["ban", "kick", "expulsar"],
    description: "Remove um membro do grupo.",
    usage: `${PREFIX}ban @usuario`,
    async handle({ args, isReply, replyLid, userLid, remoteJid, socket, sender }) {
      const targetLid = getTargetLid(args, isReply, replyLid);

      if (!targetLid) {
        await sender.sendWarningReply("Mencione um usuário (@) ou responda a mensagem dele!");
        return;
      }

      if (targetLid === userLid) {
        await sender.sendErrorReply("Você não pode remover você mesmo!");
        return;
      }

      if (targetLid === OWNER_LID) {
        await sender.sendErrorReply("Você não pode remover o dono do bot!");
        return;
      }

      if (targetLid === BOT_LID) {
        await sender.sendErrorReply("Você não pode me remover!");
        return;
      }

      if (!(await memberInGroup(socket, remoteJid, targetLid))) {
        await sender.sendErrorReply("Este usuário não está no grupo.");
        return;
      }

      try {
        await socket.groupParticipantsUpdate(remoteJid, [targetLid], "remove");
        await sender.sendSuccessReply(
          `@${onlyNumbers(targetLid)} removido do grupo!`,
          [targetLid],
        );
      } catch (error) {
        await sender.sendErrorReply(
          `Não consegui remover. Preciso ser admin do grupo. (${error.message})`,
        );
      }
    },
  },
  {
    name: "mute",
    level: "admin",
    commands: ["mute", "mutar", "silenciar"],
    description: "Silencia um membro (apaga as mensagens dele).",
    usage: `${PREFIX}mute @usuario`,
    async handle({ args, isReply, replyLid, remoteJid, socket, sender }) {
      const targetLid = getTargetLid(args, isReply, replyLid);

      if (!targetLid) {
        await sender.sendWarningReply("Mencione um usuário (@) ou responda a mensagem dele!");
        return;
      }

      if (targetLid === OWNER_LID || targetLid === BOT_LID) {
        await sender.sendErrorReply("Você não pode mutar este usuário.");
        return;
      }

      if (isMutedMember(remoteJid, targetLid)) {
        await sender.sendReply(
          `@${onlyNumbers(targetLid)} já está silenciado neste grupo.`,
          [targetLid],
        );
        return;
      }

      muteMember(remoteJid, targetLid);
      await sender.sendSuccessReply(
        `@${onlyNumbers(targetLid)} foi silenciado neste grupo!`,
        [targetLid],
      );
    },
  },
  {
    name: "unmute",
    level: "admin",
    commands: ["unmute", "desmutar", "reativar"],
    description: "Reativa um membro silenciado.",
    usage: `${PREFIX}unmute @usuario`,
    async handle({ args, isReply, replyLid, remoteJid, sender }) {
      const targetLid = getTargetLid(args, isReply, replyLid);

      if (!targetLid) {
        await sender.sendWarningReply("Mencione um usuário (@) ou responda a mensagem dele!");
        return;
      }

      if (!isMutedMember(remoteJid, targetLid)) {
        await sender.sendReply(
          `@${onlyNumbers(targetLid)} não está silenciado neste grupo.`,
          [targetLid],
        );
        return;
      }

      unmuteMember(remoteJid, targetLid);
      await sender.sendSuccessReply(
        `@${onlyNumbers(targetLid)} foi reativado neste grupo!`,
        [targetLid],
      );
    },
  },
  {
    name: "warn",
    level: "admin",
    commands: ["warn", "advertir", "advertência", "advt"],
    description: "Aplica uma advertência a um membro.",
    usage: `${PREFIX}warn @usuario motivo`,
    async handle({ args, isReply, replyLid, userLid, remoteJid, socket, sender }) {
      const targetLid = getTargetLid(args, isReply, replyLid);

      if (!targetLid) {
        await sender.sendWarningReply("Mencione um usuário (@) ou responda a mensagem dele!");
        return;
      }

      if (targetLid === userLid) {
        await sender.sendErrorReply("Você não pode se advertir!");
        return;
      }

      if (targetLid === OWNER_LID || targetLid === BOT_LID) {
        await sender.sendErrorReply("Não é possível advertir este usuário.");
        return;
      }

      const reason = args.slice(1).join(" ") || "Advertência genérica";
      const newCount = addWarn(remoteJid, targetLid, reason);
      const limit = getWarnLimit();

      await sender.sendReply(
        `⚠️ *@${onlyNumbers(targetLid)}* foi advertido!\n` +
          `Motivo: _"${reason}"_\n` +
          `Total: ${newCount}/${limit} advertências`,
        [targetLid],
      );

      if (newCount >= limit) {
        try {
          await socket.groupParticipantsUpdate(remoteJid, [targetLid], "remove");
          await sender.sendReply("❌ Limite de advertências atingido. Usuário removido.");
        } catch (error) {
          await sender.sendErrorReply(
            `Limite atingido, mas não consegui remover: ${error.message}`,
          );
        }
      }
    },
  },
  {
    name: "unwarn",
    level: "admin",
    commands: ["unwarn", "remover-advertencia", "limpar-advertencia"],
    description: "Remove a última advertência de um membro.",
    usage: `${PREFIX}unwarn @usuario`,
    async handle({ args, isReply, replyLid, remoteJid, sender }) {
      const targetLid = getTargetLid(args, isReply, replyLid);

      if (!targetLid) {
        await sender.sendWarningReply("Mencione um usuário (@) ou responda a mensagem dele!");
        return;
      }

      if (getWarnCount(remoteJid, targetLid) === 0) {
        await sender.sendReply(
          `@${onlyNumbers(targetLid)} não tem advertências.`,
          [targetLid],
        );
        return;
      }

      removeLastWarn(remoteJid, targetLid);
      await sender.sendSuccessReply(
        `Advertência removida! @${onlyNumbers(targetLid)} agora tem ${getWarnCount(remoteJid, targetLid)}/${getWarnLimit()}.`,
        [targetLid],
      );
    },
  },
  {
    name: "limpar-chat",
    level: "admin",
    commands: ["limpar-chat", "limpar", "limpa", "lc", "clean", "clear"],
    description: "Limpa o chat do grupo.",
    usage: `${PREFIX}limpar-chat`,
    async handle({ sender }) {
      await sender.sendText(`\n\n${clearChat()}`);
      await sender.sendSuccessReply("Chat limpo com sucesso!");
    },
  },
  {
    name: "link-grupo",
    level: "admin",
    commands: ["link-grupo", "link-gp", "convite"],
    description: "Mostra o link do grupo.",
    usage: `${PREFIX}link-grupo`,
    async handle({ remoteJid, socket, sender }) {
      try {
        const groupCode = await socket.groupInviteCode(remoteJid);
        if (!groupCode) {
          await sender.sendErrorReply("Preciso ser admin do grupo!");
          return;
        }
        await sender.sendReply(`https://chat.whatsapp.com/${groupCode}`);
      } catch {
        await sender.sendErrorReply("Preciso ser admin do grupo!");
      }
    },
  },
  {
    name: "confiavel",
    level: "admin",
    commands: ["confiavel", "confiaveis", "parceria", "trusted", "liberar-link"],
    description: "Libera membros para enviar links sem restrição.",
    usage: `${PREFIX}confiavel @usuario | ${PREFIX}confiavel remover @usuario | ${PREFIX}confiavel lista`,
    async handle({ args, isReply, replyLid, remoteJid, sender }) {
      const commandWord = args.length ? args[0] : "";
      const normalized = normalizeText(commandWord);

      if (!commandWord || ["lista", "listar", "list"].includes(normalized)) {
        const trusted = getTrustedUsers(remoteJid);

        if (!trusted.length) {
          await sender.sendReply(
            `Nenhum membro confiável ainda.\nUse: ${PREFIX}confiavel @usuario`,
          );
          return;
        }

        const list = trusted
          .map((lid, index) => `${index + 1}. @${onlyNumbers(lid)}`)
          .join("\n");

        await sender.sendReply(`Lista de confiáveis:\n${list}`, trusted);
        return;
      }

      const isRemove = ["remover", "remove", "tirar", "del"].includes(normalized);
      const targetLid = getTargetLid(args, isReply, replyLid);

      if (!targetLid) {
        await sender.sendWarningReply("Mencione um usuário (@) ou responda a mensagem dele!");
        return;
      }

      if (isRemove) {
        if (!isTrustedUser(remoteJid, targetLid)) {
          await sender.sendReply("Este membro não está na lista de confiáveis.");
          return;
        }

        removeTrustedUser(remoteJid, targetLid);
        await sender.sendSuccessReply(
          `@${onlyNumbers(targetLid)} removido dos confiáveis!`,
          [targetLid],
        );
        return;
      }

      if (isTrustedUser(remoteJid, targetLid)) {
        await sender.sendReply(
          `@${onlyNumbers(targetLid)} já está na lista de confiáveis.`,
          [targetLid],
        );
        return;
      }

      addTrustedUser(remoteJid, targetLid);
      await sender.sendSuccessReply(
        `@${onlyNumbers(targetLid)} agora pode enviar links sem restrição!`,
        [targetLid],
      );
    },
  },
  {
    name: "anti-link",
    level: "admin",
    commands: ["anti-link", "antilink"],
    description: "Liga/desliga a proteção contra links.",
    usage: `${PREFIX}anti-link 1`,
    async handle({ args, remoteJid, sender }) {
      const arg = args[0] ?? "";

      if (isTrue(arg)) {
        activateAntiLinkGroup(remoteJid);
        await sender.sendSuccessReply("Proteção anti-link ativada neste grupo!");
        return;
      }

      if (isFalse(arg)) {
        deactivateAntiLinkGroup(remoteJid);
        await sender.sendSuccessReply("Proteção anti-link desativada neste grupo!");
        return;
      }

      const status = isActiveAntiLinkGroup(remoteJid) ? "✅ Ativo" : "❌ Desativado";
      await sender.sendReply(`Anti-link: ${status}\nUse: ${PREFIX}anti-link 1 ou ${PREFIX}anti-link 0`);
    },
  },
  {
    name: "welcome",
    level: "admin",
    commands: ["welcome", "bemvindo", "boasvindas", "boas-vindas"],
    description: "Liga/desliga as mensagens de boas-vindas.",
    usage: `${PREFIX}welcome 1`,
    async handle({ args, remoteJid, sender }) {
      const arg = args[0] ?? "";

      if (isTrue(arg)) {
        activateWelcomeGroup(remoteJid);
        await sender.sendSuccessReply("Mensagens de boas-vindas ativadas!");
        return;
      }

      if (isFalse(arg)) {
        deactivateWelcomeGroup(remoteJid);
        await sender.sendSuccessReply("Mensagens de boas-vindas desativadas!");
        return;
      }

      const status = isActiveWelcomeGroup(remoteJid) ? "✅ Ativo" : "❌ Desativado";
      await sender.sendReply(`Boas-vindas: ${status}\nUse: ${PREFIX}welcome 1 ou ${PREFIX}welcome 0`);
    },
  },
  {
    name: "exit",
    level: "admin",
    commands: ["exit", "saida", "despedida"],
    description: "Liga/desliga as mensagens de despedida.",
    usage: `${PREFIX}exit 1`,
    async handle({ args, remoteJid, sender }) {
      const arg = args[0] ?? "";

      if (isTrue(arg)) {
        activateExitGroup(remoteJid);
        await sender.sendSuccessReply("Mensagens de despedida ativadas!");
        return;
      }

      if (isFalse(arg)) {
        deactivateExitGroup(remoteJid);
        await sender.sendSuccessReply("Mensagens de despedida desativadas!");
        return;
      }

      const status = isActiveExitGroup(remoteJid) ? "✅ Ativo" : "❌ Desativado";
      await sender.sendReply(`Despedida: ${status}\nUse: ${PREFIX}exit 1 ou ${PREFIX}exit 0`);
    },
  },
  {
    name: "set-welcome",
    level: "admin",
    commands: ["set-welcome", "set-bemvindo", "set-boasvindas"],
    description: "Define a mensagem de boas-vindas.",
    usage: `${PREFIX}set-welcome Bem-vindo @member!`,
    async handle({ fullArgs, remoteJid, sender }) {
      if (!fullArgs) {
        await sender.sendWarningReply(
          `Envie a nova mensagem com @member no lugar do nome.\nExemplo: ${PREFIX}set-welcome Bem-vindo @member!`,
        );
        return;
      }

      const normalized = normalizeText(fullArgs);

      if (["padrao", "default", "reset"].includes(normalized)) {
        resetWelcomeMessage(remoteJid);
        await sender.sendSuccessReply("Mensagem de boas-vindas restaurada para a padrão!");
        return;
      }

      setWelcomeMessage(remoteJid, fullArgs.trim());
      await sender.sendSuccessReply(
        `Mensagem de boas-vindas atualizada!\nAtual: ${getWelcomeMessage(remoteJid)}`,
      );
    },
  },
  {
    name: "set-exit",
    level: "admin",
    commands: ["set-exit", "set-saida", "set-despedida"],
    description: "Define a mensagem de despedida.",
    usage: `${PREFIX}set-exit Até logo @member!`,
    async handle({ fullArgs, remoteJid, sender }) {
      if (!fullArgs) {
        await sender.sendWarningReply(
          `Envie a nova mensagem com @member no lugar do nome.\nExemplo: ${PREFIX}set-exit Até logo @member!`,
        );
        return;
      }

      const normalized = normalizeText(fullArgs);

      if (["padrao", "default", "reset"].includes(normalized)) {
        resetExitMessage(remoteJid);
        await sender.sendSuccessReply("Mensagem de despedida restaurada para a padrão!");
        return;
      }

      setExitMessage(remoteJid, fullArgs.trim());
      await sender.sendSuccessReply(
        `Mensagem de despedida atualizada!\nAtual: ${getExitMessage(remoteJid)}`,
      );
    },
  },
];

export { adminCommands };
