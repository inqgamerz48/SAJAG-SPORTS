async function probeCreateOrder() {
  try {
    const res = await fetch('https://sajagsports.store/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({})
    });
    console.log('Status:', res.status);
    const body = await res.json();
    console.log('Response body:', JSON.stringify(body, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

probeCreateOrder();
