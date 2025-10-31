require('dotenv').config({ path: '.env.local' });
const Exa = require('exa-js').default;

// Initialize Exa client
const apiKey = process.env.EXA_API_KEY || process.env.EXASEARCH_API_KEY;
if (!apiKey) {
  console.error('EXA_API_KEY not found in environment');
  process.exit(1);
}
console.log('Using API key:', apiKey.substring(0, 10) + '...');
const exa = new Exa(apiKey);

async function testPeopleWebset() {
  try {
    console.log('Creating people webset...');

    // Create webset with sample criteria
    const websetResponse = await exa.websets.create({
      search: {
        query: 'People working at Moneyhub',
        count: 5,
      },
      enrichments: [
        { description: 'Full name' },
        { description: 'Professional email address' },
        { description: 'LinkedIn profile URL' },
        { description: 'Current company name' },
        { description: 'Current job title' },
        { description: 'Location or city' }
      ]
    });

    console.log('Webset created:', websetResponse);
    const websetId = websetResponse.id;

    // Wait for webset to complete
    console.log('\nWaiting for webset to complete...');
    await exa.websets.waitUntilIdle(websetId, {
      timeout: 120000,
      pollInterval: 3000,
      onPoll: (status) => console.log('Status:', status)
    });

    // Get results
    console.log('\nFetching results...');
    const items = await exa.websets.items.getAll(websetId);

    console.log('\n=== FULL RESULTS ===');
    console.log(`Found ${items.length} items`);
    console.log(JSON.stringify(items, null, 2));

    if (items && items.length > 0) {
      console.log('\n=== FIRST ITEM DETAILED ===');
      const firstItem = items[0];
      console.log('ID:', firstItem.id);
      console.log('\nProperties:', JSON.stringify(firstItem.properties, null, 2));
      console.log('\nEnrichments:', JSON.stringify(firstItem.enrichments, null, 2));

      // Extract data using our logic
      console.log('\n=== EXTRACTION TEST (OLD LOGIC) ===');
      const properties = firstItem.properties || {};
      const enrichments = firstItem.enrichments || [];

      const textEnrichments = enrichments.filter(e => e.format === 'text');
      const emailEnrichment = enrichments.find(e => e.format === 'email');
      const urlEnrichment = enrichments.find(e => e.format === 'url');

      console.log('Text enrichments:', JSON.stringify(textEnrichments, null, 2));
      console.log('Email enrichment:', JSON.stringify(emailEnrichment, null, 2));
      console.log('URL enrichment:', JSON.stringify(urlEnrichment, null, 2));

      console.log('\n OLD EXTRACTION:');
      console.log('- Name:', properties.name || textEnrichments[0]?.result?.[0] || 'Unknown');
      console.log('- Title:', properties.title || textEnrichments[1]?.result?.[0] || null);
      console.log('- Company:', properties.company || properties.organization || null);
      console.log('- Email:', emailEnrichment?.result?.[0] || properties.email || null);
      console.log('- LinkedIn:', urlEnrichment?.result?.[0] || properties.url || null);
      console.log('- Location:', properties.location || null);

      console.log('\n=== EXTRACTION TEST (NEW LOGIC - FROM PERSON OBJECT) ===');
      const person = properties.person || {};
      console.log('Person object:', JSON.stringify(person, null, 2));

      console.log('\n NEW EXTRACTION:');
      console.log('- Name:', person.name || textEnrichments[0]?.result?.[0] || 'Unknown');
      console.log('- Title:', person.title || textEnrichments[1]?.result?.[0] || null);
      console.log('- Company:', person.company || properties.company || null);
      console.log('- Email:', person.email || emailEnrichment?.result?.[0] || null);
      console.log('- LinkedIn:', person.linkedin || urlEnrichment?.result?.[0] || null);
      console.log('- Location:', properties.location || null);
    }

  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testPeopleWebset();
