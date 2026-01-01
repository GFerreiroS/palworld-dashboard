import fs from "fs";
import path from "path";

const LOG_DIR = "/app/logs";
const LOG_FILE = path.join(LOG_DIR, "app.log");
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function ensureLogFile() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  if (fs.existsSync(LOG_FILE)) {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size > MAX_SIZE) {
      fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
    }
  }
}

export function log(line: string) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] ${line}`;

  // docker logs
  console.log(msg);

  // file logs
  try {
    ensureLogFile();
    fs.appendFileSync(LOG_FILE, msg + "\n");
  } catch {
    // ignore file logging errors
  }
}
