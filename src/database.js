import fs from "node:fs";
import path from "node:path";
import { DATABASE_DIR } from "./config.js";

const AUTHORIZED_GROUPS = "authorized-groups.json";
const BOT_ADMINS = "bot-admins.json";
const WELCOME_GROUPS = "welcome-groups.json";
const EXIT_GROUPS = "exit-groups.json";
const WELCOME_MESSAGES = "welcome-messages.json";
const EXIT_MESSAGES = "exit-messages.json";
const ANTI_LINK_GROUPS = "anti-link-groups.json";
const TRUSTED_USERS = "trusted-users.json";
const MUTED_USERS = "muted.json";

function ensureDir() {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

function readJSON(filename, fallback) {
  ensureDir();

  const fullPath = path.join(DATABASE_DIR, filename);

  if (!fs.existsSync(fullPath)) {
    writeJSON(filename, fallback);
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJSON(filename, data) {
  ensureDir();
  fs.writeFileSync(path.join(DATABASE_DIR, filename), JSON.stringify(data, null, 2));
}

// ---------------- Grupos autorizados ----------------

export function authorizeGroup(groupId) {
  const groups = readJSON(AUTHORIZED_GROUPS, []);
  if (!groups.includes(groupId)) {
    groups.push(groupId);
  }
  writeJSON(AUTHORIZED_GROUPS, groups);
}

export function revokeGroup(groupId) {
  const groups = readJSON(AUTHORIZED_GROUPS, []);
  writeJSON(AUTHORIZED_GROUPS, groups.filter((g) => g !== groupId));
}

export function isAuthorizedGroup(groupId) {
  return readJSON(AUTHORIZED_GROUPS, []).includes(groupId);
}

// ---------------- Admins do bot (via /adm) ----------------

export function addBotAdmin(userLid) {
  const admins = readJSON(BOT_ADMINS, []);
  if (!admins.includes(userLid)) {
    admins.push(userLid);
  }
  writeJSON(BOT_ADMINS, admins);
}

export function removeBotAdmin(userLid) {
  const admins = readJSON(BOT_ADMINS, []);
  writeJSON(BOT_ADMINS, admins.filter((a) => a !== userLid));
}

export function isBotAdmin(userLid) {
  return readJSON(BOT_ADMINS, []).includes(userLid);
}

export function getBotAdmins() {
  return readJSON(BOT_ADMINS, []);
}

// ---------------- Boas-vindas ----------------

export function activateWelcomeGroup(groupId) {
  const groups = readJSON(WELCOME_GROUPS, []);
  if (!groups.includes(groupId)) {
    groups.push(groupId);
  }
  writeJSON(WELCOME_GROUPS, groups);
}

export function deactivateWelcomeGroup(groupId) {
  const groups = readJSON(WELCOME_GROUPS, []);
  writeJSON(WELCOME_GROUPS, groups.filter((g) => g !== groupId));
}

export function isActiveWelcomeGroup(groupId) {
  return readJSON(WELCOME_GROUPS, []).includes(groupId);
}

export function setWelcomeMessage(groupId, text) {
  const messages = readJSON(WELCOME_MESSAGES, {});
  messages[groupId] = text;
  writeJSON(WELCOME_MESSAGES, messages);
}

export function resetWelcomeMessage(groupId) {
  const messages = readJSON(WELCOME_MESSAGES, {});
  delete messages[groupId];
  writeJSON(WELCOME_MESSAGES, messages);
}

export function getWelcomeMessage(groupId) {
  return readJSON(WELCOME_MESSAGES, {})[groupId] || null;
}

// ---------------- Despedida ----------------

export function activateExitGroup(groupId) {
  const groups = readJSON(EXIT_GROUPS, []);
  if (!groups.includes(groupId)) {
    groups.push(groupId);
  }
  writeJSON(EXIT_GROUPS, groups);
}

export function deactivateExitGroup(groupId) {
  const groups = readJSON(EXIT_GROUPS, []);
  writeJSON(EXIT_GROUPS, groups.filter((g) => g !== groupId));
}

export function isActiveExitGroup(groupId) {
  return readJSON(EXIT_GROUPS, []).includes(groupId);
}

export function setExitMessage(groupId, text) {
  const messages = readJSON(EXIT_MESSAGES, {});
  messages[groupId] = text;
  writeJSON(EXIT_MESSAGES, messages);
}

export function resetExitMessage(groupId) {
  const messages = readJSON(EXIT_MESSAGES, {});
  delete messages[groupId];
  writeJSON(EXIT_MESSAGES, messages);
}

export function getExitMessage(groupId) {
  return readJSON(EXIT_MESSAGES, {})[groupId] || null;
}

// ---------------- Anti-link ----------------

export function activateAntiLinkGroup(groupId) {
  const groups = readJSON(ANTI_LINK_GROUPS, []);
  if (!groups.includes(groupId)) {
    groups.push(groupId);
  }
  writeJSON(ANTI_LINK_GROUPS, groups);
}

export function deactivateAntiLinkGroup(groupId) {
  const groups = readJSON(ANTI_LINK_GROUPS, []);
  writeJSON(ANTI_LINK_GROUPS, groups.filter((g) => g !== groupId));
}

export function isActiveAntiLinkGroup(groupId) {
  return readJSON(ANTI_LINK_GROUPS, []).includes(groupId);
}

// ---------------- Confiaveis (podem mandar link) ----------------

export function addTrustedUser(groupId, userLid) {
  const data = readJSON(TRUSTED_USERS, {});
  if (!data[groupId]) {
    data[groupId] = [];
  }
  if (!data[groupId].includes(userLid)) {
    data[groupId].push(userLid);
  }
  writeJSON(TRUSTED_USERS, data);
}

export function removeTrustedUser(groupId, userLid) {
  const data = readJSON(TRUSTED_USERS, {});
  if (data[groupId]) {
    data[groupId] = data[groupId].filter((u) => u !== userLid);
  }
  writeJSON(TRUSTED_USERS, data);
}

export function isTrustedUser(groupId, userLid) {
  return readJSON(TRUSTED_USERS, {})[groupId]?.includes(userLid) || false;
}

export function getTrustedUsers(groupId) {
  return readJSON(TRUSTED_USERS, {})[groupId] || [];
}

// ---------------- Mutados ----------------

export function muteMember(groupId, userLid) {
  const data = readJSON(MUTED_USERS, {});
  if (!data[groupId]) {
    data[groupId] = [];
  }
  if (!data[groupId].includes(userLid)) {
    data[groupId].push(userLid);
  }
  writeJSON(MUTED_USERS, data);
}

export function unmuteMember(groupId, userLid) {
  const data = readJSON(MUTED_USERS, {});
  if (data[groupId]) {
    data[groupId] = data[groupId].filter((u) => u !== userLid);
  }
  writeJSON(MUTED_USERS, data);
}

export function isMutedMember(groupId, userLid) {
  return readJSON(MUTED_USERS, {})[groupId]?.includes(userLid) || false;
}
