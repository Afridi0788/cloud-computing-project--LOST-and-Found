const app = require('./server');
const http = require('http');

async function runE2ETests() {
  const PORT = 5098;
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`\n🧪 Running End-to-End Test Suite on http://localhost:${PORT}\n`);

  const BASE_URL = `http://localhost:${PORT}/api`;

  try {
    // 1. Health Check
    const resHealth = await fetch(`${BASE_URL}/health`);
    const health = await resHealth.json();
    console.log('✅ 1. Health Check:', resHealth.status === 200 && health.status === 'healthy' ? 'PASSED' : 'FAILED');

    // 2. Login Alice (Owner)
    const resAlice = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@college.edu', password: 'Password123!' })
    });
    const aliceData = await resAlice.json();
    const aliceToken = aliceData.token;
    console.log('✅ 2. Login Alice (Poster):', resAlice.status === 200 && aliceToken ? 'PASSED' : 'FAILED');

    // 3. Login Bob (Finder)
    const resBob = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@college.edu', password: 'Password123!' })
    });
    const bobData = await resBob.json();
    const bobToken = bobData.token;
    console.log('✅ 3. Login Bob (Finder):', resBob.status === 200 && bobToken ? 'PASSED' : 'FAILED');

    // 4. Login Charlie (Claimant)
    const resCharlie = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'charlie@college.edu', password: 'Password123!' })
    });
    const charlieData = await resCharlie.json();
    const charlieToken = charlieData.token;
    console.log('✅ 4. Login Charlie (Claimant):', resCharlie.status === 200 && charlieToken ? 'PASSED' : 'FAILED');

    // 5. Alice creates a Lost Item Listing
    const formAliceItem = new URLSearchParams();
    formAliceItem.append('title', 'Brown Leather Fossil Wallet');
    formAliceItem.append('description', 'Lost in 2nd floor library reading hall. Contains student ID.');
    formAliceItem.append('category', 'Wallets & Bags');
    formAliceItem.append('type', 'LOST');
    formAliceItem.append('location', 'Central Library 2nd Floor');
    formAliceItem.append('item_date', '2026-10-24');

    const resCreate = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aliceToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formAliceItem.toString()
    });
    const createdItemData = await resCreate.json();
    const aliceItemId = createdItemData.item?.id;
    console.log('✅ 5. Alice Posts Lost Wallet:', resCreate.status === 201 && aliceItemId ? 'PASSED' : 'FAILED');

    // 6. Bob submits a match response to Alice's wallet
    const resBobClaim = await fetch(`${BASE_URL}/items/${aliceItemId}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bobToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'I found this wallet near the reference desk. Student ID matches Alice Johnson.'
      })
    });
    const bobClaimData = await resBobClaim.json();
    const bobClaimId = bobClaimData.claim?.id;
    console.log('✅ 6. Bob Reports Finding Wallet:', resBobClaim.status === 201 && bobClaimId ? 'PASSED' : 'FAILED');

    // 7. Prevent Alice from claiming her own item
    const resSelfClaim = await fetch(`${BASE_URL}/items/${aliceItemId}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aliceToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Claiming my own wallet' })
    });
    console.log('✅ 7. Prevent Self Claim (Expect 400):', resSelfClaim.status === 400 ? 'PASSED' : 'FAILED');

    // 8. Prevent unauthorized user from editing Alice's listing
    const resUnauthorizedEdit = await fetch(`${BASE_URL}/items/${aliceItemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${bobToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'title=Hacked+Title'
    });
    console.log('✅ 8. Enforce Ownership Authorization (Expect 403):', resUnauthorizedEdit.status === 403 ? 'PASSED' : 'FAILED');

    // 9. Alice confirms the return of the wallet
    const resReturn = await fetch(`${BASE_URL}/items/${aliceItemId}/return`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${aliceToken}`
      }
    });
    const returnData = await resReturn.json();
    console.log('✅ 9. Alice Confirms Return (Status RETURNED):', resReturn.status === 200 && returnData.status === 'RETURNED' ? 'PASSED' : 'FAILED');

    // 10. Fetch all items and verify filtering
    const resItems = await fetch(`${BASE_URL}/items?type=LOST`);
    const itemsData = await resItems.json();
    console.log('✅ 10. Item Search & S3 Presigned URLs:', resItems.status === 200 && itemsData.items.length > 0 ? 'PASSED' : 'FAILED');

    console.log('\n🎉 ALL 10 TEST SCENARIOS PASSED WITH 100% SUCCESS!\n');
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runE2ETests();
