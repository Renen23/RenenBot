import {
  addBotAdmin,
  authorizeGroup,
  getBotAdmins,
  isAuthorizedGroup,
  isBotAdmin,
  removeBotAdmin,
  revokeGroup,
} from "../database.js";
import { PREFIX } from "../config.js";
import { onlyNumbers, normalizeText } from "../utils.js";

const ownerCommands = [
  {
    name: "on",
    level: "owner",
    commands: ["on", "ativar"],
    description: "Ativa o bot neste grupo.",
    async handle({ remoteJid, sender }) {
      if (isAuthorizedGroup(remoteJid)) {
        await sender.sendWarningReply("O bot já está ativado neste grupo!");
        return;
      }

      authorizeGroup(remoteJid);
      await sender.sendSuccessReply("Bot ativado neste grupo com sucesso!");
    },
  },
  {
    name: "off",
    level: "owner",
    commands: ["off", "desativar"],
    description: "Desativa o bot neste grupo.",
    async handle({ remoteJid, sender }) {
      if (!isAuthorizedGroup(remoteJid)) {
        await sender.sendWarningReply("O bot já está desativado neste grupo!");
        return;
      }

      revokeGroup(remoteJid);
      await sender.sendSuccessReply("Bot desativado neste grupo com sucesso!");
    },
  },
  {
    name: "adm",
    level: "owner",
    commands: ["adm", "admin", "add-admin", "remove-admin"],
    description: "Gerencia os admins do bot.",
    usage: `${PREFIX}adm add @usuario | ${PREFIX}adm remove @usuario | ${PREFIX}adm lista`,
    async handle({ args, isReply, replyLid, sender }) {
      const commandWord = args.length ? args[0] : "";
      const normalized = normalizeText(commandWord);

      if (!commandWord || ["lista", "listar", "list", "admins"].includes(normalized)) {
        const admins = getBotAdmins();

        if (!admins.length) {
          await sender.sendReply(
            `Nenhum admin cadastrado além de você.\nUse: ${PREFIX}adm add @usuario`,
          );
          return;
        }

        const list = admins
          .map((lid, index) => `${index + 1}. @${onlyNumbers(lid)}`)
          .join("\n");

        await sender.sendReply(`Admins do bot:\n${list}`, admins);
        return;
      }

      const isRemove = ["remover", "remove", "tirar", "del", "delete"].includes(
        normalized,
      );

      const mention = args.find((arg) => arg.includes("@"));
      const targetLid = isReply ? replyLid : null;

      if (!mention && !targetLid) {
        await sender.sendWarningReply(
          "Mencione um usuário (@) ou responda a mensagem dele!",
        );
        return;
      }

      const memberLid = targetLid || `${onlyNumbers(mention)}@lid`;

      if (isRemove) {
        if (!isBotAdmin(memberLid)) {
          await sender.sendReply("Este usuário não é admin do bot.");
          return;
        }

        removeBotAdmin(memberLid);
        await sender.sendSuccessReply(
          `@${onlyNumbers(memberLid)} removido dos admins do bot!`,
          [memberLid],
        );
        return;
      }

      if (isBotAdmin(memberLid)) {
        await sender.sendReply(
          `@${onlyNumbers(memberLid)} já é admin do bot.`,
          [memberLid],
        );
        return;
      }

      addBotAdmin(memberLid);
      await sender.sendSuccessReply(
        `@${onlyNumbers(memberLid)} agora é admin do bot!`,
        [memberLid],
      );
    },
  },
];

export { ownerCommands };
