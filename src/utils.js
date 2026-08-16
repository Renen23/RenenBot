export const onlyNumbers = (text) => String(text ?? "").replace(/[^0-9]/g, "");

export function normalizeText(text) {
  if (!text) {
    return "";
  }
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function normalizeCommand(text) {
  return normalizeText(text).replace(/[^a-z0-9-]/g, "");
}

export function isTrue(word) {
  return ["1", "ativar", "ligado", "ligar", "on", "sim", "true", "yes"].includes(
    normalizeText(word),
  );
}

export function isFalse(word) {
  return ["0", "desativar", "desligado", "desligar", "off", "nao", "no", "false"].includes(
    normalizeText(word),
  );
}

export function readMore() {
  return "\u200B".repeat(950);
}

export function isTooOld(timestamp, minimumMinutes = 5) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const diffInMinutes = Math.floor((currentTimestamp - timestamp) / 60);
  return diffInMinutes >= minimumMinutes;
}

export const GROUP_PARTICIPANT_ADD = 27;
export const GROUP_PARTICIPANT_LEAVE = 32;
export const isAddOrLeave = [GROUP_PARTICIPANT_ADD, GROUP_PARTICIPANT_LEAVE];

export function clearChat() {
  return `🗑️${"\n".repeat(1891)}🗑️`;
}
