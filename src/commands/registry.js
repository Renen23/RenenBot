import { isBotAdminUser, isOwner } from "../permissions.js";
import { normalizeCommand } from "../utils.js";
import { ownerCommands } from "./ownerCommands.js";
import { adminCommands } from "./adminCommands.js";
import { generalCommands } from "./generalCommands.js";

const allCommands = [...ownerCommands, ...adminCommands, ...generalCommands];

const registry = new Map();

for (const command of allCommands) {
  for (const alias of command.commands) {
    registry.set(normalizeCommand(alias), command);
  }
}

export function findCommand(commandName) {
  return registry.get(normalizeCommand(commandName)) || null;
}

export function hasPermissionFor(command, userLid) {
  if (command.level === "owner") {
    return isOwner(userLid);
  }

  if (command.level === "admin") {
    return isOwner(userLid) || isBotAdminUser(userLid);
  }

  return false;
}
