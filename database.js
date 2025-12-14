const Pool = require('pg').Pool;

const pool = new Pool({
    user: "postgres",
    password: "s8N4G1Ut",
    database: "WAD-team",
    host: "localhost",
    port: "5432"
});

const execute = (query) => pool.query(query)

// users table
const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS "users" (
	    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	    email VARCHAR(200) NOT NULL UNIQUE,
        password VARCHAR(200) NOT NULL,
        username VARCHAR(200) NOT NULL
    );`;

// posts table
const createPostTableQuery = `
    CREATE TABLE IF NOT EXISTS "posttable" (
	    "id" SERIAL PRIMARY KEY,         
	    "title" VARCHAR(200) NOT NULL,
	    "body" TEXT NOT NULL,
        "urllink" VARCHAR(200),
        "user_id" uuid NOT NULL,
        "date" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );`;

// A function to execute the previous query   
const initDb = async () => {
    await execute(createUsersTableQuery);
    console.log('Users table ready');

    await execute(createPostTableQuery);
    console.log('Posttable ready');
};
initDb();

module.exports = pool;