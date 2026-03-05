const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function checkDB() {
    const dbPath = path.join(__dirname, 'server', 'database.sqlite');
    console.log('Checking database at:', dbPath);
    try {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log('--- TABLES ---');
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        console.log(tables.map(t => t.name).join(', '));

        for (const table of tables) {
            const count = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
            console.log(`${table.name}: ${count.count} rows`);
        }

        console.log('--- FUNDS ---');
        const funds = await db.all("SELECT * FROM funds");
        console.log(JSON.stringify(funds, null, 2));

        console.log('--- LATEST NOTICE ---');
        const notice = await db.get("SELECT * FROM notices ORDER BY id DESC LIMIT 1");
        console.log(JSON.stringify(notice, null, 2));

        await db.close();
    } catch (err) {
        console.error('Check failed:', err.message);
    }
}

checkDB();
