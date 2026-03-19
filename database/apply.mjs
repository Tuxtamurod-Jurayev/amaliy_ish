import { readFile } from "node:fs/promises";
import { Client } from "pg";

async function readDatabaseUrlFromEnvFile() {
  try {
    const envText = await readFile(new URL("../.env", import.meta.url), "utf8");
    const line = envText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find((item) => item.startsWith("DATABASE_URL="));

    if (!line) return "";

    const value = line.slice("DATABASE_URL=".length).trim();
    return value.replace(/^['"]|['"]$/g, "");
  } catch {
    return "";
  }
}

const connectionString = process.env.DATABASE_URL || (await readDatabaseUrlFromEnvFile());

if (!connectionString) {
  console.error("DATABASE_URL topilmadi. Root .env faylga yoki shell environment'ga qo'shing.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  await client.connect();
  const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  const seed = await readFile(new URL("./seed.sql", import.meta.url), "utf8");

  await client.query(schema);
  await client.query(seed);
  await client.end();
  console.log("Schema va seed muvaffaqiyatli qo'llandi.");
}

main().catch(async (error) => {
  console.error(error);
  try {
    await client.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
