type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  [key: string]: unknown;
}

function log(level: LogLevel, event: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...meta,
  };

  const line = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) =>
    log("info", event, meta),
  warn: (event: string, meta?: Record<string, unknown>) =>
    log("warn", event, meta),
  error: (event: string, meta?: Record<string, unknown>) =>
    log("error", event, meta),
};
