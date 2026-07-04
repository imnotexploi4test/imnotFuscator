const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "bot_logs.txt");

function getTimestamp() {
  return new Date().toISOString();
}

function log(message) {
  const entry = `[${getTimestamp()}] ${message}\n`;
  console.log(entry.trim());
  try {
    fs.appendFileSync(LOG_FILE, entry, "utf-8");
  } catch (e) {
    console.error("Failed to write log:", e);
  }
}

function getLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return fs.readFileSync(LOG_FILE, "utf-8");
    }
  } catch (e) {
    console.error("Failed to read logs:", e);
  }
  return "";
}

function clearLogs() {
  try {
    fs.writeFileSync(LOG_FILE, "", "utf-8");
  } catch (e) {
    console.error("Failed to clear logs:", e);
  }
}

module.exports = { log, getLogs, clearLogs };
