// Deliberately no Vite transforms or SPA fallback: test the files a host publishes.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(process.env.APP_OUT_DIR || "dist");
const base = process.env.APP_BASE || "/";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (!pathname.startsWith(base)) {
      res.writeHead(404).end("Not found");
      return;
    }
    let file = path.resolve(root, pathname.slice(base.length));
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const data = await readFile(file);
    res
      .writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      })
      .end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(Number(process.env.PW_PORT || 4180), "127.0.0.1", () =>
  console.log(`Serving static build at ${base}`),
);
