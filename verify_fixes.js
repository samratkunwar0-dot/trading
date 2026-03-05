const fetch = require('node-fetch');

async function verifyFixes() {
    const API_BASE = 'http://localhost:3000/api';
    let token;

    try {
        console.log('1. Logging in as samrat...');
        const loginRes = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'samrat', password: 'samrat123' })
        });
        const loginData = await loginRes.json();
        token = loginData.token;
        console.log('Login successful.');

        console.log('\n2. Posting a new notice...');
        const postRes = await fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: 'Verification Notice', content: 'Initial content' })
        });
        const postData = await postRes.json();
        const noticeId = postData.id;
        console.log(`Notice posted. ID: ${noticeId}`);

        console.log('\n3. Updating the notice (PUT)...');
        const updateRes = await fetch(`${API_BASE}/notices/${noticeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title: 'Updated Notice Title', content: 'Updated content' })
        });
        const updateData = await updateRes.json();
        console.log('Update result:', updateData.message);

        console.log('\n4. Verifying update in database...');
        const getRes = await fetch(`${API_BASE}/notices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const notices = await getRes.json();
        const updatedNotice = notices.find(n => n.id === noticeId);
        if (updatedNotice && updatedNotice.title === 'Updated Notice Title') {
            console.log('Verification success: Title matches.');
        } else {
            console.error('Verification FAILED: Title does not match or notice not found.');
        }

        console.log('\n5. Deleting the notice (DELETE)...');
        const deleteRes = await fetch(`${API_BASE}/notices/${noticeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const deleteData = await deleteRes.json();
        console.log('Delete result:', deleteData.message);

        console.log('\n6. Verifying deletion...');
        const getResAfter = await fetch(`${API_BASE}/notices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const noticesAfter = await getResAfter.json();
        if (!noticesAfter.find(n => n.id === noticeId)) {
            console.log('Verification success: Notice deleted.');
        } else {
            console.error('Verification FAILED: Notice still exists.');
        }

    } catch (err) {
        console.error('Verification Script Error:', err.message);
    }
}

verifyFixes();
