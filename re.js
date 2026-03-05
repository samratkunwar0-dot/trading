const fetch = require('node-fetch'); // Needs to be available or use dynamic import

async function reproduce() {
    const API_BASE = 'http://localhost:3000/api';

    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'samrat', password: 'samrat123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed', await loginRes.text());
            return;
        }

        const { token } = await loginRes.json();
        console.log('Login successful! Token acquired.');

        // 2. Try to post a notice
        console.log('Attempting to post a notice...');
        const noticeRes = await fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: 'Reproduce Test', content: 'Testing from script' })
        });

        if (noticeRes.ok) {
            console.log('Notice posted successfully!');
        } else {
            console.error('Post Notice FAILED with status:', noticeRes.status);
            console.error('Error Body:', await noticeRes.text());
        }

        // 3. Try to update a bill (if any exist)
        const billsRes = await fetch(`${API_BASE}/bills`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bills = await billsRes.json();
        if (bills.length > 0) {
            const billId = bills[0].id;
            console.log(`Attempting to update status of bill ${billId}...`);
            const updateRes = await fetch(`${API_BASE}/bills/${billId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'Paid' })
            });
            if (updateRes.ok) {
                console.log('Bill updated successfully!');
            } else {
                console.error('Update Bill FAILED with status:', updateRes.status);
                console.error('Error Body:', await updateRes.text());
            }
        }

    } catch (err) {
        console.error('Reproduction Script Error:', err.message);
    }
}

reproduce();
