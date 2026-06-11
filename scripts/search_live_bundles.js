const chunks = [
  'f1b4d49aa9e249c5.js',
  '45ec57deb75bf497.js',
  'ea553279be12e63a.js',
  '36979f8ce242764b.js',
  'f091501564eb2ea3.js',
  'turbopack-4bb32e50531f348c.js',
  '437b192cb409a339.js',
  'b77766711a25fae0.js',
  '7311e7823a1801ae.js',
  'b7296c342992d53b.js',
  '76a6058c75ba8b62.js',
  '3efe42f7303edc04.js',
  '8ff96f318f917170.js',
  'af15dfefbf2eebde.js',
  '6dca6414aa41af40.js',
  'ff1a16fafef87110.js',
  'ce1d10bfbd68819f.js',
  '2b26222ee97c352d.js',
  'a27ee8852dd16b8d.js',
  'f883b7ccdabca117.js'
];

async function searchBundles() {
  console.log('Starting search in live bundles...');
  for (const chunk of chunks) {
    const url = `https://sajagsports.store/_next/static/chunks/${chunk}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`Failed to fetch: ${chunk} (${res.status})`);
        continue;
      }
      const text = await res.text();
      
      const containsStringType = text.includes('stringType');
      const containsStringName = text.includes('stringName');
      const containsTensionLbs = text.includes('tension_lbs');
      const containsRepairForm = text.includes('RepairForm');
      
      if (containsStringType || containsStringName || containsTensionLbs || containsRepairForm) {
        console.log(`Chunk: ${chunk}`);
        console.log(`  contains stringType: ${containsStringType}`);
        console.log(`  contains stringName: ${containsStringName}`);
        console.log(`  contains tension_lbs: ${containsTensionLbs}`);
        console.log(`  contains RepairForm: ${containsRepairForm}`);
      }
    } catch (err) {
      console.error(`Error on chunk ${chunk}:`, err.message);
    }
  }
  console.log('Search complete.');
}

searchBundles();
