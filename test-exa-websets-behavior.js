/**
 * Test script to understand Exa websets API behavior with progressive fetching
 * This will help us understand:
 * 1. How items become available over time
 * 2. When searches complete vs when enrichments complete
 * 3. How to properly fetch all items progressively
 */

const Exa = require('exa-js').default;

const EXA_API_KEY = process.env.EXA_API_KEY;

if (!EXA_API_KEY) {
  console.error('❌ EXA_API_KEY environment variable is not set');
  process.exit(1);
}

const exa = new Exa(EXA_API_KEY);

async function testWebsetsProgressive() {
  console.log('🧪 Testing Exa Websets Progressive Fetching\n');
  console.log('=' .repeat(60));

  try {
    // Create a simple webset
    console.log('\n1️⃣  Creating webset for "People working at Microsoft in London"...');
    const webset = await exa.websets.create({
      search: {
        query: 'People working at Microsoft in London',
        count: 10
      }
    });

    console.log(`✅ Webset created: ${webset.id}`);
    console.log(`   Status: ${webset.status}`);
    console.log(`   Searches:`, webset.searches?.length || 0);

    const websetId = webset.id;

    // Add enrichments in background
    console.log('\n2️⃣  Adding background enrichments...');
    const enrichments = [
      { description: 'Full name' },
      { description: 'Professional email address', format: 'email' },
      { description: 'LinkedIn profile URL', format: 'url' },
    ];

    for (const enrichment of enrichments) {
      await exa.websets.enrichments.create(websetId, enrichment);
    }
    console.log(`✅ Added ${enrichments.length} enrichments`);

    // Poll for items progressively
    console.log('\n3️⃣  Polling for items progressively (will poll for 2 minutes)...\n');
    console.log('Time  | Status  | Searches | Items | Sample Item');
    console.log('-'.repeat(80));

    const startTime = Date.now();
    const maxDuration = 120000; // 2 minutes
    const pollInterval = 3000; // 3 seconds
    let iteration = 0;
    let previousItemCount = 0;

    while (Date.now() - startTime < maxDuration) {
      iteration++;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      try {
        // Check webset status
        const status = await exa.websets.get(websetId);

        // Fetch items using getAll (should handle pagination)
        const items = await exa.websets.items.getAll(websetId);

        const searches = status.searches || [];
        const searchStatus = searches.map(s => s.status).join(',');
        const searchCounts = searches.map(s => `${s.count || 0}`).join(',');

        // Check if we got new items
        const newItems = items.length - previousItemCount;
        const itemInfo = newItems > 0 ? `+${newItems} NEW` : '';

        console.log(
          `${elapsed}s`.padEnd(6) + '| ' +
          status.status.padEnd(8) + '| ' +
          `${searchStatus} (${searchCounts})`.padEnd(9) + '| ' +
          `${items.length}`.padEnd(6) + '| ' +
          itemInfo
        );

        // If we got new items, show details
        if (newItems > 0) {
          const latestItem = items[items.length - 1];
          console.log(`   └─ Latest item: ${latestItem.properties?.person?.name || 'Unknown'}`);
          console.log(`      Enrichments: ${latestItem.enrichments?.length || 0} total`);
          const enrichmentStatuses = {};
          latestItem.enrichments?.forEach(e => {
            enrichmentStatuses[e.status] = (enrichmentStatuses[e.status] || 0) + 1;
          });
          console.log(`      Status breakdown:`, enrichmentStatuses);
        }

        previousItemCount = items.length;

        // Check if all searches are completed
        const allSearchesCompleted = searches.every(s =>
          s.status === 'completed' || s.status === 'canceled'
        );

        // If webset is idle AND all searches completed, we're done
        if (status.status === 'idle' && allSearchesCompleted) {
          console.log('\n✅ Webset is idle and all searches completed!');
          console.log(`   Final item count: ${items.length}`);

          // Show final statistics
          console.log('\n📊 Final Statistics:');
          console.log(`   Total items: ${items.length}`);
          console.log(`   Expected items: ${searches.reduce((sum, s) => sum + (s.count || 0), 0)}`);

          if (items.length > 0) {
            const enrichmentStats = { pending: 0, completed: 0, failed: 0 };
            items.forEach(item => {
              item.enrichments?.forEach(e => {
                enrichmentStats[e.status] = (enrichmentStats[e.status] || 0) + 1;
              });
            });
            console.log(`   Enrichment status:`, enrichmentStats);
          }

          break;
        }

      } catch (error) {
        console.error(`❌ Error at ${elapsed}s:`, error.message);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    console.log('\n4️⃣  Testing manual pagination...');

    // Test if there's a pagination issue by calling list with explicit pagination
    try {
      let allItems = [];
      let cursor = null;
      let page = 0;

      do {
        page++;
        console.log(`   Fetching page ${page}...`);

        const result = cursor
          ? await exa.websets.items.list(websetId, { cursor })
          : await exa.websets.items.list(websetId);

        allItems = allItems.concat(result.data || []);
        cursor = result.nextCursor || null;

        console.log(`   Page ${page}: ${result.data?.length || 0} items, cursor: ${cursor ? 'yes' : 'none'}`);

        if (!cursor) break;

      } while (page < 10); // Safety limit

      console.log(`\n   Total items via manual pagination: ${allItems.length}`);

    } catch (paginationError) {
      console.error('❌ Manual pagination error:', paginationError.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test complete!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testWebsetsProgressive().catch(console.error);
