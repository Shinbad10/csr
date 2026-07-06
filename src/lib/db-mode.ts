// Chọn DB runtime: cloud (SQL Server) mặc định, offline (SQLite) tùy chọn.
let currentMode: "cloud" | "offline" = "cloud";

export function getDbMode(): "cloud" | "offline" {
  if (process.env.LOCAL_SERVER_MODE === "host") return "offline";
  return currentMode;
}

export function setDbMode(mode: "cloud" | "offline") {
  currentMode = mode;
}
