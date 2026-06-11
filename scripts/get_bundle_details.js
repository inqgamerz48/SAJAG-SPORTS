async function getBundleDetails() {
  const url = 'https://sajagsports.store/_next/static/chunks/1d15c2d7b752c4be.js';
  try {
    const res = await fetch(url);
    const text = await res.text();
    
    // Check if the chunk contains /api/create-order
    const apiIndex = text.indexOf('/api/create-order');
    if (apiIndex !== -1) {
      console.log('Found "/api/create-order" at index', apiIndex);
      console.log('Snippet:');
      console.log(text.slice(apiIndex - 150, apiIndex + 250));
    } else {
      console.log('"/api/create-order" not found in chunk.');
    }
  } catch (err) {
    console.error(err);
  }
}

getBundleDetails();
