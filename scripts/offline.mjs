import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { deflateSync } from "node:zlib";
import path from "node:path";
const base = process.env.APP_BASE || "/lboard/";
const output = process.env.APP_OUT_DIR || "dist";
if (!base.startsWith("/") || !base.endsWith("/"))
  throw new Error("APP_BASE must start and end with /.");
// Original flower icon, rasterized directly into PNG; no external assets.
function png(size) {
  const bytes = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        v = y / size;
      let rgb = [255, 249, 239];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const cx = 0.5 + Math.cos(a) * 0.17,
          cy = 0.5 + Math.sin(a) * 0.17;
        if (Math.hypot(u - cx, v - cy) < 0.135) rgb = [204, 123, 99];
      }
      if (Math.hypot(u - 0.5, v - 0.5) < 0.1) rgb = [241, 207, 124];
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      bytes.set([...rgb, 255], offset);
    }
  const crc = (b) => {
    let c = 0xffffffff;
    for (const n of b) {
      c ^= n;
      for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const name = Buffer.from(type),
      len = Buffer.alloc(4),
      checksum = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    checksum.writeUInt32BE(crc(Buffer.concat([name, data])));
    return Buffer.concat([len, name, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(bytes)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
for (const size of [180, 192, 512])
  await writeFile(
    `${output}/${size === 180 ? "apple-touch-icon" : `icon-${size}`}.png`,
    png(size),
  );
await writeFile(
  path.join(output, "manifest.webmanifest"),
  JSON.stringify({
    id: base,
    name: "Layla Board",
    short_name: "Layla Board",
    start_url: base,
    scope: base,
    display: "standalone",
    background_color: "#fff9ef",
    theme_color: "#fff9ef",
    icons: [192, 512].map((size) => ({
      src: `icon-${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any maskable",
    })),
  }),
);
async function walk(dir) {
  const list = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) list.push(...(await walk(file)));
    else if (!["sw.js"].includes(entry.name)) list.push(file);
  }
  return list;
}
const files = (await walk(output)).sort();
const hash = createHash("sha256");
hash.update(await readFile(new URL(import.meta.url)));
for (const file of files) hash.update(await readFile(file));
const version = hash.digest("hex").slice(0, 16),
  urls = files.map(
    (f) => base + path.relative(output, f).replaceAll("\\", "/"),
  );
const worker = `const CACHE='layla-${version}';
const URLS=${JSON.stringify(urls)};
const BASE=${JSON.stringify(base)};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);try{await cache.addAll(URLS);}catch(error){await caches.delete(CACHE);throw error;}})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE')self.skipWaiting();
 if(event.data?.type==='REPAIR')event.waitUntil((async()=>{try{const cache=await caches.open(CACHE);await cache.addAll(URLS);event.ports[0]?.postMessage({ready:true});}catch{event.ports[0]?.postMessage({ready:false});}})());
 if(event.data?.type==='STATUS')event.waitUntil((async()=>{const cache=await caches.open(CACHE);const entries=await Promise.all(URLS.map(url=>cache.match(url)));event.ports[0]?.postMessage({ready:entries.every(Boolean),version:CACHE});})());
});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);if(event.request.mode==='navigate')return (await cache.match(BASE+'index.html'))||fetch(event.request);// Use canonical release URL keys: module requests can add Origin headers that differ from precache requests.
 const key=url.pathname;
 if(URLS.includes(key))return (await cache.match(key))||fetch(event.request);
 if(key.startsWith(BASE+'assets/'))return (await caches.match(key))||fetch(event.request);
 return fetch(event.request);})());
});
// Keep previous release caches: another open client may still use their assets.
`;
await writeFile(path.join(output, "sw.js"), worker);
console.log(
  `Offline release ${version}: ${urls.length} local assets, atomic precache; scope ${base}`,
);
