import fs from "node:fs";
import path from "node:path";
import { DATABASE_DIR } from "../config.js";

const WARN_LIMIT = 3;
const WARNS_FILE = "warns.json";
const WARNS_PATH = path.join(DATABASE_DIR, WARNS_FILE);

function ensureFile() {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });

  if (!fs.existsSync(WARNS_PATH)) {
    fs.writeFileSync(WARNS_PATH, JSON.stringify({}, null, 2));
  }
}

function loadDB() {
  ensureFile();

  try {
    const data = JSON.parse(fs.readFileSync(WARNS_PATH, "utf8"));

    if (Array.isArray(data)) {
      fs.writeFileSync(WARNS_PATH, JSON.stringify({}, null, 2));
      return {};
    }

    return data || {};
  } catch {
    return {};
  }
}

function saveDB(data) {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
  fs.writeFileSync(WARNS_PATH, JSON.stringify(data, null, 2));
}

function getValidWarns(db, groupId, userLid) {
  const list = db?.[groupId]?.warns?.[userLid] || [];
  return list.filter((w) => w.valid);
}

export function getWarnLimit() {
  return WARN_LIMIT;
}

export function addWarn(groupId, userLid, reason = "Advertência") {
  const db = loadDB();

  if (!db[groupId]) {
    db[groupId] = {};
  }
  if (!db[groupId].warns) {
    db[groupId].warns = {};
  }
  if (!db[groupId].warns[userLid]) {
    db[groupId].warns[userLid] = [];
  }

  db[groupId].warns[userLid].push({
    reason,
    timestamp: Date.now(),
    valid: true,
  });

  saveDB(db);

  return getValidWarns(db, groupId, userLid).length;
}

export function getWarnCount(groupId, userLid) {
  const db = loadDB();
  return getValidWarns(db, groupId, userLid).length;
}

export function removeLastWarn(groupId, userLid) {
  const db = loadDB();

  const warns = db?.[groupId]?.warns?.[userLid];

  if (!warns?.length) {
    return false;
  }

  const lastValid = [...warns].reverse().find((w) => w.valid);

  if (!lastValid) {
    return false;
  }

  lastValid.valid = false;

  saveDB(db);

  return true;
}
