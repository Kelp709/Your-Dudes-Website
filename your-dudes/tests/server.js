/* Tiny static server for local testing. Mimics GitHub Pages: serves 404.html
   (with a 404 status) for unknown paths. Optionally serves the site under a
   subpath to simulate https://user.github.io/repo/ */
const http = require("http");
const fs = require("fs");
const path = require("path");

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".xml": "application/xml", ".txt": "text/plain" };

function start(root, port, prefix) {
  prefix = prefix || "";
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let file = null;
    if (!prefix || p === prefix || p.startsWith(prefix + "/")) {
      let rel = prefix ? p.slice(prefix.length) : p;
      if (rel === "" || rel.endsWith("/")) rel += "index.html";
      const full = path.normalize(path.join(root, rel));
      if (full.startsWith(root) && fs.existsSync(full) && fs.statSync(full).isFile()) file = full;
    }
    if (file) {
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(path.join(root, "404.html")).pipe(res);
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

module.exports = { start };

if (require.main === module) {
  const port = Number(process.argv[2]) || 8080;
  start(path.join(__dirname, ".."), port).then(() => console.log("Preview at http://localhost:" + port + "/  (Ctrl+C to stop)"));
}
