import { PREFIX } from "./config.js";
import { normalizeCommand } from "./utils.js";

function extractInteractiveResponseId(paramsJson) {
  if (!paramsJson) {
    return null;
  }

  try {
    const params = JSON.parse(paramsJson);

    return (
      params.id ||
      params.selectedId ||
      params.selectedRowId ||
      params.rowId ||
      params.buttonId ||
      params.button_id ||
      null
    );
  } catch {
    return null;
  }
}

export function extractMessage(webMessage) {
  const message = webMessage?.message || {};

  const textMessage = message.conversation;
  const extendedTextMessage = message.extendedTextMessage;
  const extendedTextMessageText = extendedTextMessage?.text;
  const imageTextMessage = message.imageMessage?.caption;
  const videoTextMessage = message.videoMessage?.caption;
  const buttonsResponseMessage = message.buttonsResponseMessage?.selectedButtonId;
  const templateButtonReplyMessage =
    message.templateButtonReplyMessage?.selectedId;
  const listResponseMessage =
    message.listResponseMessage?.singleSelectReply?.selectedRowId;
  const interactiveResponseMessage =
    message.interactiveResponseMessage?.nativeFlowResponseMessage;
  const interactiveResponseId = extractInteractiveResponseId(
    interactiveResponseMessage?.paramsJson,
  );

  let fullMessage =
    textMessage ||
    extendedTextMessageText ||
    imageTextMessage ||
    videoTextMessage ||
    buttonsResponseMessage ||
    templateButtonReplyMessage ||
    listResponseMessage ||
    interactiveResponseId;

  if (!fullMessage) {
    fullMessage = "";
  }

  const isReply =
    !!extendedTextMessage && !!extendedTextMessage.contextInfo?.quotedMessage;

  const replyLid =
    !!extendedTextMessage && !!extendedTextMessage.contextInfo?.participant
      ? extendedTextMessage.contextInfo.participant
      : null;

  const userLid = webMessage?.key?.participant?.replace(/:[0-9][0-9]|:[0-9]/g, "");

  const remoteJid = webMessage?.key?.remoteJid;

  const [command, ...args] = fullMessage.split(" ");

  const commandName = normalizeCommand(
    command.replace(new RegExp(`^[${PREFIX}]+`), ""),
  );

  return {
    commandName,
    fullMessage: fullMessage.trim(),
    isReply,
    replyLid,
    remoteJid,
    userLid,
    args,
    fullArgs: args.join(" "),
  };
}

export function isGroupMessage(remoteJid) {
  return !!remoteJid?.endsWith("@g.us");
}

export function isFromBot(webMessage) {
  return !!webMessage?.key?.fromMe;
}
