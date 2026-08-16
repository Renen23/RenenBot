import { OWNER_LID } from "./config.js";
import { isBotAdmin } from "./database.js";

export function isOwner(userLid) {
  return !!userLid && userLid === OWNER_LID;
}

export function isBotAdminUser(userLid) {
  return !!userLid && isBotAdmin(userLid);
}

export function canUseBot(userLid) {
  return isOwner(userLid) || isBotAdminUser(userLid);
}
