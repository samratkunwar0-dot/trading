const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function testWrite() {
    const dbPath = path.join(__dirname, 'server', 'database.sqlite');
    console.log('Testing write access to:', dbPath);
    try {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log('Attempting to insert a test notice...');
        const date = new Date().toISOString().split('T')[0];
        const result = await db.run(
            'INSERT INTO notices (title, content, date, author) VALUES (?, ?, ?, ?)',
            ['Write Test', 'Testing write access', date, 'System Test']
        );
        console.log('Insert success! ID:', result.lastID);

        console.log('Attempting to delete the test notice...');
        await db.run('DELETE FROM notices WHERE id = ?', [result.lastID]);
        console.log('Delete success!');

        await db.close();
    } catch (err) {
        console.error('Write Test Failed:', err.message);
        if (err.message.includes('readonly')) {
            console.log('CRITICAL: Database is read-only!');
        }
    }
}

testWrite();
