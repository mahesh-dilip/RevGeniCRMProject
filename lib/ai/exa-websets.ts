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

export class ExaWebsetsService {
  private exa: Exa;

  constructor() {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error('EXA_API_KEY environment variable is not set');
    }
    this.exa = new Exa(apiKey);
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
      // Create webset with search
      // Note: The Exa websets API structure may vary - this is a simplified implementation
      // that should be verified against the latest Exa SDK documentation
      const webset = await this.exa.websets.create({
        search: {
          query,
          count: maxResults
        },
        enrichments: [
          { description: 'Official company website URL' },
          { description: 'Number of employees' },
          { description: 'Company headquarters location with city and country' },
          { description: 'Primary industry and business model' },
          { description: 'Company description and what they do' },
          { description: 'Year the company was founded' },
          { description: 'Latest funding information if venture-backed' },
          { description: 'Annual revenue range if publicly available' }
        ]
      } as any); // Using 'as any' temporarily - needs verification with Exa API docs

      logInfo('Company webset created', { websetId: webset.id });

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
      // Create webset with search
      // Note: The Exa websets API structure may vary - this is a simplified implementation
      const webset = await this.exa.websets.create({
        search: {
          query,
          count: maxResults
        },
        enrichments: [
          { description: 'Full name' },
          { description: 'Professional email address' },
          { description: 'Phone number' },
          { description: 'LinkedIn profile URL' },
          { description: 'Current company name' },
          { description: 'Current job title' },
          { description: 'Seniority level (entry, mid, senior, executive)' },
          { description: 'Years of experience in current role' },
          { description: 'Location or city' }
        ]
      } as any); // Using 'as any' temporarily - needs verification with Exa API docs

      logInfo('People webset created', { websetId: webset.id });

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
   */
  async getWebsetResults(websetId: string, timeout: number = 600000) {
    logInfo('Waiting for webset to complete', { websetId });

    try {
      const completedWebset = await this.exa.websets.waitUntilIdle(websetId, {
        timeout,
        pollInterval: 5000,
        onPoll: (status) => {
          logInfo('Webset polling', { websetId, status });
        }
      });

      const items = await this.exa.websets.items.getAll(websetId);

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

      return {
        id: webset.id,
        status: webset.status,
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
}
