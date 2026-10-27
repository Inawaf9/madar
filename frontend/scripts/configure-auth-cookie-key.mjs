// Generate a local cookie encryption key without displaying it or replacing an existing key.
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const assignment = /^[\t ]*MADAR_AUTH_COOKIE_SECRET[\t ]*=[\t ]*([^\r\n]*)$/m;
const readOptional = async (path) => {
  try {
    return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
};
if (process.env.MADAR_AUTH_COOKIE_SECRET?.trim()) {
  console.info(
    "Cookie encryption key is already configured in the environment; no change made.",
  );
} else {
  let configured = false;
  for (const path of [
    ".env.local",
    ".env.development.local",
    ".env.development",
    ".env",
  ]) {
    const value = (await readOptional(path))
      .match(assignment)?.[1]
      ?.trim()
      .replace(/^["']|["']$/g, "");
    if (value) {
      configured = true;
      break;
    }
  }
  if (configured) {
    console.info(
      "Cookie encryption key is already configured in a local environment file; no change made.",
    );
  } else {
    const source = await readOptional(".env.local");
    const entry = `MADAR_AUTH_COOKIE_SECRET=${randomBytes(32).toString("base64")}`;
    const next = assignment.test(source)
      ? source.replace(assignment, entry)
      : `${source}${source && !source.endsWith("\n") ? "\n" : ""}${entry}\n`;
    await writeFile(new URL("../.env.local", import.meta.url), next, { mode: 0o600 });
    console.info(
      "Created an independent cookie encryption key in ignored .env.local. Restart the frontend to load it. The key was not displayed.",
    );
  }
}
