// Genera el sitio estático en public/ a partir de src/ y site.json. Sin dependencias: `node build.mjs`.
//
// En las páginas de src/:
//   {{ruta.del.dato}}                    → valor de site.json (escapado para HTML)
//   <!-- include:nombre -->              → contenido de src/partials/nombre.html
//   <!-- if:ruta -->…<!-- endif:ruta -->      → se deja solo si el dato es verdadero
//   <!-- ifnot:ruta -->…<!-- endifnot:ruta --> → se deja solo si el dato es falso
//   <!-- cities:radar -->                → lista de ciudades del producto
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(readFileSync(join(root, "site.json"), "utf8"));
const out = join(root, "public");
const warnings = [];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const get = (path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), site);

function render(html, file) {
  html = html.replace(/<!-- include:([\w-]+) -->/g, (_, n) => readFileSync(join(root, "src/partials", `${n}.html`), "utf8"));
  html = html.replace(/<!-- if:([\w.]+) -->([\s\S]*?)<!-- endif:\1 -->/g, (_, p, body) => (get(p) ? body : ""));
  html = html.replace(/<!-- ifnot:([\w.]+) -->([\s\S]*?)<!-- endifnot:\1 -->/g, (_, p, body) => (get(p) ? "" : body));
  html = html.replace(/<!-- cities:(\w+) -->/g, (_, p) => site[p].cities
    .map((c) => `<li><span class="flag" aria-hidden="true">${c.flag}</span><span><b>${esc(c.country)}</b><br>${c.names.map(esc).join(", ")}</span></li>`).join("\n"));
  html = html.replace(/\{\{([\w.]+)\}\}/g, (_, p) => {
    const v = get(p);
    if (v === undefined) throw new Error(`${file}: falta "${p}" en site.json`);
    if (v === "" && p.includes("checkout")) { warnings.push(`${file}: ${p} vacío (el botón lleva a #planes)`); return "#planes"; }
    return esc(v);
  });
  return html;
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, "assets"), join(out, "assets"), { recursive: true });
for (const f of readdirSync(join(root, "src")).filter((f) => f.endsWith(".html"))) {
  writeFileSync(join(out, f), render(readFileSync(join(root, "src", f), "utf8"), f));
}
writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
const pages = ["", "radar-de-vuelos", "legal", "arrepentimiento"];
writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${site.url}/${p}</loc></url>`).join("\n")}\n</urlset>\n`);

console.log(`Sitio generado en public/ (${readdirSync(out).length} archivos en la raíz)`);
for (const w of [...new Set(warnings)]) console.warn(`⚠️  ${w}`);
