const Pool = require('pg').Pool;

const pool = new Pool({
    user: "postgres",
    password: "s8N4G1Ut",
    database: "WAD-team",
    host: "localhost",
    port: "5432"
});

const execute = async(query) => {
    try {
        await pool.connect(); // gets connection
        await pool.query(query); // sends queries
        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

// posts table
const createPostTableQuery = `
    CREATE TABLE IF NOT EXISTS "posttable" (
	    "id" SERIAL PRIMARY KEY,         
	    "title" VARCHAR(200) NOT NULL,
	    "body" VARCHAR(200) NOT NULL,
        "urllink" VARCHAR(200),
        "uid" SERIAL,
        "date" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );`;

// A function to execute the previous query   
execute(createPostTableQuery).then(result => {
    if (result) {
        console.log('If does not exist, create the "posttable" table');
    }
});

// users table
const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS "users" (
	    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),         
	    name VARCHAR(200) NOT NULL,
	    email VARCHAR(200) NOT NULL UNIQUE,
        password VARCHAR(200) NOT NULL
    );`;

// A function to execute the previous query   
execute(createUsersTableQuery).then(result => {
    if (result) {
        console.log('If does not exist, create the "users" table');
    }
});

module.exports = pool;