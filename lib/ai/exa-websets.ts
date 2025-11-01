import Exa from 'exa-js';
import { logError, logInfo, logWarning } from '@/lib/logging';

export interface CompanySearchParams {
  industry: string;
  geography: string;
  size?: string;
  sizeMin?: number;
  sizeMax?: number;
  additionalContext?: string;
  maxResults?: number;
}

export interface PeopleSearchParams {
  companyNames?: string[];
  jobTitles?: string[];
  seniority?: string[];
  location?: string;
  industries?: string[];
  maxResults?: number;
}

export interface WebsetResult {
  id: string;
  status: string;
  itemCount?: number;
}

export interface ExaEnrichment {
  object: 'enrichment_result';
  status: string;
  format: string;
  result: any[];
  reasoning?: string;
  references?: any[];
  enrichmentId: string;
}

export interface ExaWebsetItem {
  id: string;
  object: 'webset_item';
  source: string;
  sourceId: string;
  websetId: string;
  properties: {
    type?: string;
    url?: string;
    description?: string;
    content?: string;
    company?: {
      name?: string;
      location?: string;
      employees?: number;
      industry?: string;
      about?: string;
      logoUrl?: string;
    };
    person?: {
      name?: string;
      email?: string;
      title?: string;
      company?: string;
      linkedin?: string;
    };
  };
  enrichments: ExaEnrichment[];
  evaluations?: any[];
  createdAt: string;
  updatedAt: string;
}

export class ExaWebsetsService {
  private exa: Exa;
  private webhookEnabled: boolean;

  constructor() {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error('EXA_API_KEY environment variable is not set');
    }
    this.exa = new Exa(apiKey);
    this.webhookEnabled = !!process.env.EXA_WEBHOOK_SECRET;
  }

  /**
   * Create a webset to find companies
   */
  async findCompanies(params: CompanySearchParams): Promise<WebsetResult> {
    const {
      industry,
      geography,
      size,
      sizeMin,
      sizeMax,
      additionalContext,
      maxResults = 50
    } = params;

    // Build search query
    let query = `${industry} companies in ${geography}`;
    if (size) {
      query += ` with ${size}`;
    }

    // Build criteria
    const criteria = [
      { description: `Company operates in the ${industry} industry` },
      { description: `Company is located in or headquartered in ${geography}` }
    ];

    if (sizeMin && sizeMax) {
      criteria.push({
        description: `Company has between ${sizeMin} and ${sizeMax} employees`
      });
    } else if (size) {
      criteria.push({
        description: `Company size: ${size}`
      });
    }

    if (additionalContext) {
      criteria.push({
        description: additionalContext
      });
    }

    logInfo('Creating company webset', { query, criteriaCount: criteria.length, maxResults });

    try {
      // Create webset without initial enrichments for faster results
      // Items will appear in 5-10 seconds, enrichments run in background
      const webset = await this.exa.websets.create({
        search: {
          query,
          count: maxResults
        }
        // NO enrichments - items appear in 5-10 seconds
      } as any);

      logInfo('Company webset created (no initial enrichments)', {
        websetId: webset.id,
        enrichmentsMode: 'background'
      });

      // Add enrichments in background (non-blocking)
      this.addCompanyEnrichments(webset.id).catch(err =>
        logError('Error adding background enrichments', err, { websetId: webset.id })
      );

      return {
        id: webset.id,
        status: (webset as any).status || 'pending',
        itemCount: 0
      };
    } catch (error) {
      logError('Error creating company webset', error, { query });
      throw error;
    }
  }

  /**
   * Create a webset to find people/contacts
   */
  async findPeople(params: PeopleSearchParams): Promise<WebsetResult> {
    const {
      companyNames = [],
      jobTitles = [],
      seniority = [],
      location,
      industries = [],
      maxResults = 50
    } = params;

    // Build search query
    let query = 'Business professionals';

    if (companyNames.length > 0) {
      query = `People working at ${companyNames.join(' or ')}`;
    } else if (industries.length > 0) {
      query = `People working in ${industries.join(' or ')} industry`;
    }

    if (jobTitles.length > 0) {
      query += ` with titles like ${jobTitles.join(', ')}`;
    }

    if (location) {
      query += ` in ${location}`;
    }

    // Build criteria
    const criteria = [];

    if (companyNames.length > 0) {
      companyNames.forEach(name => {
        criteria.push({
          description: `Person currently works at ${name}`
        });
      });
    }

    if (industries.length > 0) {
      criteria.push({
        description: `Person works in ${industries.join(' or ')} industry`
      });
    }

    if (jobTitles.length > 0) {
      criteria.push({
        description: `Person has job title or role: ${jobTitles.join(', ')}`
      });
    }

    if (seniority.length > 0) {
      criteria.push({
        description: `Person is at ${seniority.join(' or ')} seniority level`
      });
    }

    if (location) {
      criteria.push({
        description: `Person is located in ${location}`
      });
    }

    logInfo('Creating people webset', { query, criteriaCount: criteria.length, maxResults });

    try {
      // Create webset without initial enrichments for faster results
      // Items will appear in 5-10 seconds, enrichments run in background
      const webset = await this.exa.websets.create({
        search: {
          query,
          count: maxResults
        }
        // NO enrichments - items appear in 5-10 seconds
      } as any);

      logInfo('People webset created (no initial enrichments)', {
        websetId: webset.id,
        enrichmentsMode: 'background'
      });

      // Add enrichments in background (non-blocking)
      this.addPeopleEnrichments(webset.id).catch(err =>
        logError('Error adding background enrichments', err, { websetId: webset.id })
      );

      return {
        id: webset.id,
        status: (webset as any).status || 'pending',
        itemCount: 0
      };
    } catch (error) {
      logError('Error creating people webset', error, { query });
      throw error;
    }
  }

  /**
   * Wait for a webset to complete and get all results
   * Returns properly typed webset items with enrichments
   * @deprecated Use fetchItemsProgressive for faster results without waiting
   */
  async getWebsetResults(websetId: string, timeout: number = 600000): Promise<{
    webset: any;
    items: ExaWebsetItem[];
  }> {
    logInfo('Waiting for webset to complete', { websetId });

    try {
      const completedWebset = await this.exa.websets.waitUntilIdle(websetId, {
        timeout,
        pollInterval: 5000,
        onPoll: (status) => {
          logInfo('Webset polling', { websetId, status });
        }
      });

      // Use progressive fetching even after idle to handle pagination
      const items = await this.fetchItemsProgressive(websetId);

      logInfo('Webset results retrieved', { websetId, itemCount: items.length });

      return {
        webset: completedWebset,
        items
      };
    } catch (error) {
      logError('Error getting webset results', error, { websetId });
      throw error;
    }
  }

  /**
   * Check webset status without waiting
   */
  async checkStatus(websetId: string) {
    try {
      const webset = await this.exa.websets.get(websetId);

      // Check if searches are completed
      const searches = (webset as any).searches || [];
      const allSearchesCompleted = searches.length > 0 && 
        searches.every((s: any) => s.status === 'completed' || s.status === 'canceled');

      logInfo('Webset status check', {
        websetId,
        websetStatus: webset.status,
        searchCount: searches.length,
        searches: searches.map((s: any) => ({
          id: s.id,
          status: s.status,
          progress: s.progress,
          count: s.count
        })),
        allSearchesCompleted
      });

      return {
        id: webset.id,
        status: webset.status,
        searches: searches.map((s: any) => ({
          id: s.id,
          status: s.status,
        })),
        allSearchesCompleted,
        createdAt: webset.createdAt,
      };
    } catch (error) {
      logError('Error checking webset status', error, { websetId });
      throw error;
    }
  }

  /**
   * Cancel a running webset
   */
  async cancelWebset(websetId: string) {
    try {
      await this.exa.websets.cancel(websetId);
      logInfo('Webset cancelled', { websetId });
    } catch (error) {
      logError('Error cancelling webset', error, { websetId });
      throw error;
    }
  }

  /**
   * Fetch items progressively without waiting for idle
   * Items are immediately available through the list endpoint
   * This method handles pagination automatically if needed
   */
  async fetchItemsProgressive(websetId: string): Promise<ExaWebsetItem[]> {
    logInfo('Fetching items progressively', { websetId });
    
    try {
      // The exa-js SDK's getAll() method should handle pagination internally
      // Items are available immediately even while webset is still running
      const items = await this.exa.websets.items.getAll(websetId) as ExaWebsetItem[];
      
      logInfo('Items fetched progressively', { 
        websetId, 
        itemCount: items.length 
      });
      
      return items;
    } catch (error) {
      logError('Error fetching items progressively', error, { websetId });
      throw error;
    }
  }

  /**
   * Add enrichments to a company webset in the background
   * This allows items to be discovered quickly, then enriched progressively
   */
  private async addCompanyEnrichments(websetId: string) {
    const enrichments = [
      { description: 'Official company website URL' },
      { description: 'Number of employees', format: 'number' },
      { description: 'Company headquarters location with city and country' },
      { description: 'Primary industry and business model' },
      { description: 'Company description and what they do' },
      { description: 'Year the company was founded', format: 'number' },
      { description: 'Latest funding information if venture-backed' },
      { description: 'Annual revenue range if publicly available' }
    ];

    logInfo('Adding background enrichments to company webset', { websetId, count: enrichments.length });

    try {
      for (const enrichment of enrichments) {
        await (this.exa.websets.enrichments as any).create(
          websetId,  // Pass websetId as first parameter
          enrichment // Pass enrichment config as second parameter
        );
      }
      logInfo('Background enrichments added', { websetId });
    } catch (error) {
      logError('Error adding company enrichments', error, { websetId });
      // Don't throw - enrichments are optional and shouldn't block the flow
    }
  }

  /**
   * Add enrichments to a people webset in the background
   */
  private async addPeopleEnrichments(websetId: string) {
    const enrichments = [
      { description: 'Full name' },
      { description: 'Professional email address', format: 'email' },
      { description: 'Phone number', format: 'phone' },
      { description: 'LinkedIn profile URL', format: 'url' },
      { description: 'Current company name' },
      { description: 'Current job title' },
      { description: 'Seniority level (entry, mid, senior, executive)' },
      { description: 'Years of experience in current role', format: 'number' },
      { description: 'Location or city' }
    ];

    logInfo('Adding background enrichments to people webset', { websetId, count: enrichments.length });

    try {
      for (const enrichment of enrichments) {
        await (this.exa.websets.enrichments as any).create(
          websetId,  // Pass websetId as first parameter
          enrichment // Pass enrichment config as second parameter
        );
      }
      logInfo('Background enrichments added', { websetId });
    } catch (error) {
      logError('Error adding people enrichments', error, { websetId });
      // Don't throw - enrichments are optional and shouldn't block the flow
    }
  }

  /**
   * Register webhook for real-time event notifications
   * Should be called once during setup
   */
  async registerWebhook(baseUrl: string) {
    if (!this.webhookEnabled) {
      throw new Error('EXA_WEBHOOK_SECRET not configured');
    }

    try {
      const webhook = await (this.exa.websets.webhooks as any).create({
        url: `${baseUrl}/api/webhooks/exa`,
        events: [
          'webset.item.created',  // Item discovered
          'webset.item.enriched', // Enrichment completed
          'webset.idle'           // Processing complete
        ]
      });

      logInfo('Webhook registered successfully', {
        webhookId: webhook.id,
        url: webhook.url
      });

      return webhook;
    } catch (error) {
      logError('Error registering webhook', error);
      throw error;
    }
  }

  /**
   * List all registered webhooks
   */
  async listWebhooks() {
    try {
      const webhooks = await (this.exa.websets.webhooks as any).list();
      return webhooks;
    } catch (error) {
      logError('Error listing webhooks', error);
      throw error;
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string) {
    try {
      await (this.exa.websets.webhooks as any).delete(webhookId);
      logInfo('Webhook deleted', { webhookId });
    } catch (error) {
      logError('Error deleting webhook', error, { webhookId });
      throw error;
    }
  }
}
