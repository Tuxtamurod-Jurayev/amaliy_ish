import { readFile } from "node:fs/promises";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable topilmadi.");
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
