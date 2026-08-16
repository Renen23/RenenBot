import fs from "node:fs";
import { delay } from "baileys";
import { BOT_EMOJI } from "./config.js";

export function createSender({ socket, webMessage }) {
  const remoteJid = webMessage?.key?.remoteJid;

  const sendTyping = async () => {
    await socket.sendPresenceUpdate("composing", remoteJid);
    await delay(400);
  };

  const buildParams = (mentions) => {
    let optionalParams = {};
    if (mentions?.length) {
      optionalParams = { mentions };
    }
    return optionalParams;
  };

  const sendText = async (text, mentions) => {
    await sendTyping();
    return await socket.sendMessage(remoteJid, {
      text: `${BOT_EMOJI} ${text}`,
      ...buildParams(mentions),
    });
  };

  const sendReply = async (text, mentions) => {
    await sendTyping();
    return await socket.sendMessage(
      remoteJid,
      {
        text: `${BOT_EMOJI} ${text}`,
        ...buildParams(mentions),
      },
      { quoted: JSON.parse(JSON.stringify(webMessage)) },
    );
  };

  const sendSuccessReply = async (text, mentions) => {
    return await sendReply(`✅ ${text}`, mentions);
  };

  const sendWarningReply = async (text, mentions) => {
    return await sendReply(`⚠️ Atenção! ${text}`, mentions);
  };

  const sendErrorReply = async (text, mentions) => {
    return await sendReply(`❌ Erro! ${text}`, mentions);
  };

  const sendReact = async (emoji) => {
    return await socket.sendMessage(remoteJid, {
      react: { text: emoji, key: webMessage.key },
    });
  };

  const sendImageFromFile = async (file, caption = "", mentions = null) => {
    return await socket.sendMessage(
      remoteJid,
      {
        image: fs.readFileSync(file),
        caption: `${BOT_EMOJI} ${caption}`,
        ...buildParams(mentions),
      },
      { quoted: JSON.parse(JSON.stringify(webMessage)) },
    );
  };

  const deleteMessage = async (key = webMessage.key) => {
    const { id, participant } = key;
    return await socket.sendMessage(remoteJid, {
      delete: { remoteJid, fromMe: false, id, participant },
    });
  };

  return {
    remoteJid,
    sendText,
    sendReply,
    sendSuccessReply,
    sendWarningReply,
    sendErrorReply,
    sendReact,
    sendImageFromFile,
    deleteMessage,
  };
}
