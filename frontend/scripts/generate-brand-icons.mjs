// Derivatives only: never overwrite/recolor/crop the four official source assets.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
// Reuse Next.js's installed image processor; no new dependency.
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));
const root = fileURLToPath(new URL("../", import.meta.url));
const source = tone => resolve(root, `public/branding/madar-mark-${tone}.png`);
const png = (tone, size) => sharp(source(tone)).resize(size, size, { fit: "contain", withoutEnlargement: true }).png().toBuffer();
const icons = resolve(root, "public/branding/icons");
await mkdir(icons, { recursive: true });
for (const tone of ["navy", "ivory"]) {
  for (const size of [32, 192]) await writeFile(resolve(icons, `madar-mark-${tone}-${size}.png`), await png(tone, size));
}
await writeFile(resolve(root, "app/apple-icon.png"), await png("navy", 180));
const sizes = [16, 32, 48]; const images = await Promise.all(sizes.map(size => png("navy", size)));
const header = Buffer.alloc(6 + images.length * 16); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, i) => {
  const entry = 6 + i * 16;
  header[entry] = sizes[i]; header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8); header.writeUInt32LE(offset, entry + 12); offset += image.length;
});
await writeFile(resolve(root, "app/favicon.ico"), Buffer.concat([header, ...images]));
