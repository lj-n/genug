import * as tables from "./tables";
import { createDatabase, type Database } from "./create-database";
import { env } from "$env/dynamic/private";

if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
}

const database = createDatabase(env.DATABASE_URL);

export { createDatabase, type Database, database, tables };
