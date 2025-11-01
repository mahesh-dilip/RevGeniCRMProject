require('dotenv').config({ path: '.env.local' });
const Exa = require('exa-js').default;

// Initialize Exa client
const apiKey = process.env.EXA_API_KEY || process.env.EXASEARCH_API_KEY;
if (!apiKey) {
  console.error('EXA_API_KEY not found in environment');
  process.exit(1);
}

const exa = new Exa(apiKey);

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to log section headers
const logSection = (title) => {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80) + '\n');
};

async function testWebsetsAPI() {
  try {
    // ============================================================================
    // TEST 1: Create webset WITHOUT enrichments (our optimized approach)
    // ============================================================================
    logSection('TEST 1: Create Webset WITHOUT Enrichments');
    
    console.log('Creating webset with NO enrichments...');
    const startTime1 = Date.now();
    
    const webset1 = await exa.websets.create({
      search: {
        query: "AI startups in San Francisco",
        count: 5
      }
      // NO enrichments array
    });
    
    const createTime1 = Date.now() - startTime1;
    console.log(`✅ Webset created in ${createTime1}ms`);
    console.log(`   ID: ${webset1.id}`);
    console.log(`   Status: ${webset1.status}`);
    console.log(`   Searches: ${webset1.searches?.length || 0}`);
    
    // Try to fetch items immediately
    console.log('\n📊 Attempting to fetch items immediately (without waiting)...');
    const itemsFetchStart = Date.now();
    
    try {
      const items1 = await exa.websets.items.getAll(webset1.id);
      const itemsFetchTime = Date.now() - itemsFetchStart;
      
      console.log(`✅ Items fetched in ${itemsFetchTime}ms`);
      console.log(`   Item count: ${items1.length}`);
      
      if (items1.length > 0) {
        console.log('\n   First item structure:');
        console.log(`   - ID: ${items1[0].id}`);
        console.log(`   - Type: ${items1[0].properties?.type}`);
        console.log(`   - URL: ${items1[0].properties?.url}`);
        console.log(`   - Enrichments: ${items1[0].enrichments?.length || 0}`);
        
        if (items1[0].enrichments && items1[0].enrichments.length > 0) {
          console.log(`   - First enrichment status: ${items1[0].enrichments[0].status}`);
        }
      }
    } catch (itemsError) {
      console.log(`❌ Error fetching items: ${itemsError.message}`);
    }
    
    // Check status after a few seconds
    console.log('\n⏱️  Waiting 5 seconds then checking status...');
    await wait(5000);
    
    const status1 = await exa.websets.get(webset1.id);
    console.log(`   Status after 5s: ${status1.status}`);
    console.log(`   Searches: ${status1.searches?.length || 0}`);
    if (status1.searches && status1.searches.length > 0) {
      console.log(`   First search status: ${status1.searches[0].status}`);
      console.log(`   First search progress: ${JSON.stringify(status1.searches[0].progress)}`);
    }
    
    // Try fetching items again
    console.log('\n📊 Fetching items again after 5s...');
    try {
      const items1After = await exa.websets.items.getAll(webset1.id);
      console.log(`   Item count: ${items1After.length}`);
    } catch (err) {
      console.log(`   Error: ${err.message}`);
    }
    
    // ============================================================================
    // TEST 2: Add enrichments AFTER creation (background enrichments)
    // ============================================================================
    logSection('TEST 2: Add Enrichments After Creation');
    
    console.log('Adding enrichments to existing webset...');
    
    try {
      // Test different ways to call the enrichments API
      console.log('\n🧪 Testing enrichment API call patterns...');
      
      // Pattern 1: Pass websetId as first param (what we think is correct)
      console.log('\n   Pattern 1: create(websetId, enrichmentConfig)');
      try {
        await exa.websets.enrichments.create(
          webset1.id,
          { description: 'Company founding year', format: 'number' }
        );
        console.log('   ✅ Pattern 1 SUCCESS');
      } catch (err) {
        console.log(`   ❌ Pattern 1 FAILED: ${err.message}`);
      }
      
      // Pattern 2: Pass everything as object (what we were doing wrong)
      console.log('\n   Pattern 2: create({ websetId, ...enrichmentConfig })');
      try {
        await exa.websets.enrichments.create({
          websetId: webset1.id,
          description: 'Number of employees',
          format: 'number'
        });
        console.log('   ✅ Pattern 2 SUCCESS');
      } catch (err) {
        console.log(`   ❌ Pattern 2 FAILED: ${err.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Error adding enrichments: ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    // ============================================================================
    // TEST 3: Create webset WITH enrichments (old approach)
    // ============================================================================
    logSection('TEST 3: Create Webset WITH Enrichments (Old Approach)');
    
    console.log('Creating webset WITH 3 enrichments...');
    const startTime3 = Date.now();
    
    const webset3 = await exa.websets.create({
      search: {
        query: "Tech companies in Austin",
        count: 3
      },
      enrichments: [
        { description: 'Company website URL', format: 'url' },
        { description: 'Number of employees', format: 'number' },
        { description: 'Company location' }
      ]
    });
    
    const createTime3 = Date.now() - startTime3;
    console.log(`✅ Webset created in ${createTime3}ms`);
    console.log(`   ID: ${webset3.id}`);
    console.log(`   Status: ${webset3.status}`);
    console.log(`   Enrichments: ${webset3.enrichments?.length || 0}`);
    
    // Try to fetch items immediately
    console.log('\n📊 Attempting to fetch items immediately...');
    try {
      const items3 = await exa.websets.items.getAll(webset3.id);
      console.log(`   Item count: ${items3.length}`);
      
      if (items3.length > 0 && items3[0].enrichments) {
        console.log(`   First item enrichments: ${items3[0].enrichments.length}`);
        items3[0].enrichments.forEach((e, i) => {
          console.log(`     Enrichment ${i + 1}: status=${e.status}, format=${e.format}`);
        });
      }
    } catch (err) {
      console.log(`   Error: ${err.message}`);
    }
    
    // ============================================================================
    // TEST 4: Progressive polling behavior
    // ============================================================================
    logSection('TEST 4: Progressive Polling Behavior');
    
    console.log('Polling webset1 every 2 seconds for 20 seconds...');
    console.log('Tracking: status changes, item count, enrichment status\n');
    
    for (let i = 0; i < 10; i++) {
      await wait(2000);
      
      const status = await exa.websets.get(webset1.id);
      const items = await exa.websets.items.getAll(webset1.id);
      
      console.log(`Poll ${i + 1} (${(i + 1) * 2}s):`);
      console.log(`  Webset status: ${status.status}`);
      console.log(`  Item count: ${items.length}`);
      
      if (status.searches && status.searches.length > 0) {
        console.log(`  Search status: ${status.searches[0].status}`);
        if (status.searches[0].progress) {
          console.log(`  Progress: ${status.searches[0].progress.completion}% complete`);
          console.log(`  Found: ${status.searches[0].progress.found} items`);
        }
      }
      
      if (items.length > 0 && items[0].enrichments) {
        const pendingEnrichments = items[0].enrichments.filter(e => e.status === 'pending').length;
        const completedEnrichments = items[0].enrichments.filter(e => e.status === 'completed').length;
        console.log(`  Enrichments: ${completedEnrichments} completed, ${pendingEnrichments} pending`);
      }
      
      // Stop if webset is idle
      if (status.status === 'idle') {
        console.log('\n✅ Webset reached idle status!');
        break;
      }
    }
    
    // ============================================================================
    // TEST 5: Items structure analysis
    // ============================================================================
    logSection('TEST 5: Detailed Item Structure Analysis');
    
    console.log('Fetching final items from webset1...');
    const finalItems = await exa.websets.items.getAll(webset1.id);
    
    if (finalItems.length > 0) {
      console.log(`\nTotal items: ${finalItems.length}`);
      console.log('\nFirst item detailed structure:');
      console.log(JSON.stringify(finalItems[0], null, 2));
    } else {
      console.log('No items found');
    }
    
    // ============================================================================
    // SUMMARY
    // ============================================================================
    logSection('SUMMARY & FINDINGS');
    
    console.log('Key Findings:');
    console.log('1. Webset creation time (no enrichments):', createTime1, 'ms');
    console.log('2. Webset creation time (with enrichments):', createTime3, 'ms');
    console.log('3. Items available immediately:', items1?.length > 0 ? 'YES' : 'NO');
    console.log('4. Enrichment API pattern that works: [TO BE DETERMINED]');
    console.log('\nRecommendations:');
    console.log('- Use NO enrichments on creation for faster initial results');
    console.log('- Add enrichments separately in background');
    console.log('- Poll every 2 seconds for progressive updates');
    console.log('- Items are available before enrichments complete');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\nFull error:', error);
  }
}

// Run the tests
console.log('Starting Exa WebSets API Behavior Tests...');
console.log('This will take about 30-40 seconds to complete.\n');

testWebsetsAPI()
  .then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });

