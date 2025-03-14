import knex from "knex";
import config from "./dotenv.js";

const db = knex({
  client: "mssql",
  connection: {
    server: config.DB_SERVER,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_DATABASE,
    port: parseInt(config.DB_PORT, 10),
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
  pool: { min: 2, max: 10 },
  migrations: {
    tableName: "knex_migrations",
  },
});

export default db;
