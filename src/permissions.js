import { OWNER_LID } from "./config.js";
import { isBotAdmin } from "./database.js";
import { onlyNumbers } from "./utils.js";

export function isOwner(userLid) {
  return (
    !!userLid && onlyNumbers(userLid) === onlyNumbers(OWNER_LID)
  );
}

export function isBotAdminUser(userLid) {
  return !!userLid && isBotAdmin(onlyNumbers(userLid) + "@lid");
}

export function canUseBot(userLid) {
  return isOwner(userLid) || isBotAdminUser(userLid);
}
