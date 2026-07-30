const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "bot_logs.txt");
const MAX_LOG_SIZE = 2 * 1024 * 1024; // 2MB rotation
const MAX_BACKUPS = 3;

function getTimestamp() {
  return new Date().toISOString();
}

function rotateIfNeeded() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const stat = fs.statSync(LOG_FILE);
    if (stat.size > MAX_LOG_SIZE) {
      for (let i = MAX_BACKUPS - 1; i >= 0; i--) {
        const src = i === 0 ? LOG_FILE : `${LOG_FILE}.${i}`;
        const dst = `${LOG_FILE}.${i + 1}`;
        if (fs.existsSync(src)) {
          if (fs.existsSync(dst)) fs.unlinkSync(dst);
          fs.renameSync(src, dst);
        }
      }
      // truncate main
      fs.writeFileSync(LOG_FILE, "", "utf-8");
    }
  } catch (e) {
    console.error("Log rotation failed:", e);
  }
}

function format(level, message, meta) {
  const ts = getTimestamp();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function writeLog(line) {
  try {
    rotateIfNeeded();
    fs.appendFileSync(LOG_FILE, line + "\n", "utf-8");
  } catch (e) {
    console.error("Failed to write log:", e);
  }
}

function log(message, meta) {
  const line = format("info", message, meta);
  console.log(line);
  writeLog(line);
}

function warn(message, meta) {
  const line = format("warn", message, meta);
  console.warn(line);
  writeLog(line);
}

function error(message, meta) {
  const line = format("error", message, meta);
  console.error(line);
  writeLog(line);
}

function debug(message, meta) {
  if (process.env.DEBUG || process.env.LOG_LEVEL === "debug") {
    const line = format("debug", message, meta);
    console.debug(line);
    writeLog(line);
  }
}

function getLogs(limit = 0) {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, "utf-8");
      if (limit > 0) {
        const lines = data.trim().split("\n");
        return lines.slice(-limit).join("\n");
      }
      return data;
    }
  } catch (e) {
    console.error("Failed to read logs:", e);
  }
  return "";
}

function clearLogs() {
  try {
    fs.writeFileSync(LOG_FILE, "", "utf-8");
    // clear backups
    for (let i = 1; i <= MAX_BACKUPS; i++) {
      const p = `${LOG_FILE}.${i}`;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  } catch (e) {
    console.error("Failed to clear logs:", e);
  }
}

function getStats() {
  try {
    if (!fs.existsSync(LOG_FILE)) return { size: 0, lines: 0, exists: false };
    const stat = fs.statSync(LOG_FILE);
    const content = fs.readFileSync(LOG_FILE, "utf-8");
    const lines = content ? content.trim().split("\n").length : 0;
    return { size: stat.size, lines, exists: true, path: LOG_FILE, mtime: stat.mtime };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { log, warn, error, debug, getLogs, clearLogs, getStats, LOG_FILE };
