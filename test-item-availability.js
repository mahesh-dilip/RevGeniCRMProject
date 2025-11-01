/**
 * Test when items become available vs when search count is reported
 */

const Exa = require('exa-js').default;

const EXA_API_KEY = process.env.EXA_API_KEY;
const exa = new Exa(EXA_API_KEY);

async function testItemAvailability() {
  console.log('🧪 Testing Item Availability Timing\n');

  // Use the existing webset from the logs
  const websetId = 'webset_01k8zjfem2dbnfzv9e3ft2nnqe';

  console.log(`Testing webset: ${websetId}\n`);
  console.log('Time  | Search Status | Search Count | Items Available');
  console.log('-'.repeat(70));

  for (let i = 0; i < 30; i++) {
    const elapsed = i * 2;

    try {
      // Check webset status
      const status = await exa.websets.get(websetId);
      const searches = status.searches || [];
      const search = searches[0];

      // Try to get items
      const items = await exa.websets.items.getAll(websetId);

      console.log(
        `${elapsed}s`.padEnd(6) + '| ' +
        (search?.status || 'N/A').padEnd(14) + '| ' +
        (search?.count || 0).toString().padEnd(13) + '| ' +
        items.length
      );

      // Stop once we get all items
      if (items.length === 10 && search?.status === 'completed') {
        console.log('\n✅ All items are now available!');
        break;
      }

    } catch (error) {
      console.error(`❌ Error at ${elapsed}s:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testItemAvailability().catch(console.error);
