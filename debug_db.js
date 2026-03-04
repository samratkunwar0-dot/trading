const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function debug() {
    const DB_PATH = path.join(__dirname, 'server', 'database.sqlite');
    console.log('Checking DB at:', DB_PATH);

    try {
        const db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        console.log('\n--- Tables ---');
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        console.log(tables.map(t => t.name).join(', '));

        for (const table of tables) {
            console.log(`\n--- Schema for ${table.name} ---`);
            const info = await db.all(`PRAGMA table_info(${table.name})`);
            console.table(info);
        }

        console.log('\n--- Testing Write ---');
        await db.run('INSERT INTO notices (title, content, date, author) VALUES (?, ?, ?, ?)',
            ['Test', 'Testing write', new Date().toISOString(), 'System']);
        console.log('Write Success!');

        const lastNotice = await db.get('SELECT * FROM notices ORDER BY id DESC LIMIT 1');
        console.log('Last Notice:', lastNotice);

        await db.run('DELETE FROM notices WHERE id = ?', [lastNotice.id]);
        console.log('Delete Success!');

    } catch (err) {
        console.error('DEBUG ERROR:', err);
    }
}

debug();
