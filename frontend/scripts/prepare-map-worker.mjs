// Copy the installed MapLibre worker verbatim; this does not compile/build code.
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve("maplibre-gl/package.json"));
const { version } = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version))
  throw new Error("Unexpected MapLibre package version");
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const destination = join(projectRoot, "public", "maplibre", version);
await mkdir(destination, { recursive: true });
await Promise.all([
  ...[
    "maplibre-gl-worker.mjs",
    "maplibre-gl-worker.mjs.map",
    "maplibre-gl-shared.mjs",
  ].map((file) => copyFile(join(packageRoot, "dist", file), join(destination, file))),
  copyFile(join(packageRoot, "LICENSE.txt"), join(destination, "LICENSE.txt")),
]);
console.info(`[maps] Prepared local MapLibre ${version} worker assets.`);
