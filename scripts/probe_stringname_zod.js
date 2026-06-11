async function probeStringNameZod() {
  const longStringName = 'A'.repeat(110);
  const payload = {
    amount: 1180,
    customerInfo: {
      name: "Nandan Probe",
      email: "nandan@example.com",
      phone: "9876543210",
      address: "123 Test Street, Pune, Maharashtra, 411001",
      pincode: "411001"
    },
    pickupAddress: {
      line1: "123 Test Street",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001"
    },
    items: [
      {
        name: "Yonex Astrox 100ZZ Repair + BG 65",
        price: 1180,
        quantity: 1,
        type: "service",
        serviceType: "repair",
        racquetBrand: "Yonex",
        racquetModel: "Astrox 100ZZ",
        tension: 24,
        stringName: longStringName
      }
    ],
    costBreakdown: {
      total: 1180
    }
  };

  try {
    const res = await fetch('https://sajagsports.store/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify(payload)
    });
    console.log('Status:', res.status);
    const body = await res.json();
    console.log('Response body:', JSON.stringify(body, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

probeStringNameZod();
