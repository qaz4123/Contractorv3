export interface TavilySearchOptions {
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  source: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  searchedAt: Date;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  query: string;
  answer?: string;
}

export class TavilyProvider {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVILY_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ Tavily API key not configured');
    }
  }

  /**
   * Perform a general web search
   */
  async search(query: string, options: TavilySearchOptions = {}): Promise<SearchResponse> {
    if (!this.apiKey) {
      throw new Error('Tavily API key not configured');
    }

    const payload = {
      api_key: this.apiKey,
      query,
      search_depth: options.searchDepth || 'advanced',
      include_answer: options.includeAnswer ?? true,
      include_raw_content: options.includeRawContent ?? false,
      max_results: options.maxResults || 10,
      include_domains: options.includeDomains || [],
      exclude_domains: options.excludeDomains || [],
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 429) {
           throw new Error('Tavily API rate limit exceeded');
        }
        throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as TavilyResponse;

      return {
        results: data.results.map((r: TavilyResult) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
          source: this.extractDomain(r.url),
        })),
        query: data.query,
        searchedAt: new Date(),
      };
    } catch (error) {
      console.error('Tavily search failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tavily API request timed out after 30 seconds');
      }
      throw error;
    }
  }

  /**
   * Perform a deep search with optimized settings for entity extraction
   */
  async searchDeep(query: string): Promise<SearchResponse> {
    return this.search(query, {
      searchDepth: 'advanced',
      maxResults: 15,
      includeAnswer: true,
      includeRawContent: true
    });
  }

  /**
   * Search for property listings and valuations
   */
  async searchPropertyListings(address: string): Promise<SearchResponse> {
    const query = `${address} property listing price home value zillow redfin realtor`;
    
    return this.search(query, {
      searchDepth: 'advanced',
      maxResults: 10,
      includeDomains: [
        'zillow.com',
        'redfin.com',
        'realtor.com',
        'trulia.com',
        'homes.com',
        'movoto.com',
      ],
    });
  }

  /**
   * Search for property market data
   */
  async searchMarketData(city: string, state: string): Promise<SearchResponse> {
    const query = `${city} ${state} real estate market trends 2024 median home price inventory`;
    
    return this.search(query, {
      searchDepth: 'advanced',
      maxResults: 8,
      includeDomains: [
        'zillow.com',
        'redfin.com',
        'realtor.com',
        'nar.realtor',
        'noradarealestate.com',
      ],
    });
  }

  /**
   * Search for neighborhood data
   */
  async searchNeighborhood(address: string): Promise<SearchResponse> {
    const query = `${address} neighborhood walk score schools crime rate amenities`;
    
    return this.search(query, {
      searchDepth: 'advanced',
      maxResults: 8,
      includeDomains: [
        'walkscore.com',
        'greatschools.org',
        'niche.com',
        'areavibes.com',
        'neighborhoodscout.com',
      ],
    });
  }

  /**
   * Search for comparable properties (comps)
   */
  async searchComparables(address: string, city: string): Promise<SearchResponse> {
    const query = `${city} recently sold homes near ${address} comparable sales`;
    
    return this.search(query, {
      searchDepth: 'advanced',
      maxResults: 10,
      includeDomains: [
        'zillow.com',
        'redfin.com',
        'realtor.com',
      ],
    });
  }

  /**
   * Comprehensive property search - combines multiple searches
   */
  async comprehensivePropertySearch(address: string, city: string, state: string): Promise<{
    listings: SearchResponse;
    market: SearchResponse;
    neighborhood: SearchResponse;
    comps: SearchResponse;
    allResults: SearchResult[];
  }> {
    // Run all searches in parallel for speed
    const [listings, market, neighborhood, comps] = await Promise.all([
      this.searchPropertyListings(address),
      this.searchMarketData(city, state),
      this.searchNeighborhood(address),
      this.searchComparables(address, city),
    ]);

    // Combine all results and remove duplicates by URL
    const allResults: SearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const response of [listings, market, neighborhood, comps]) {
      for (const result of response.results) {
        if (!seenUrls.has(result.url)) {
          seenUrls.add(result.url);
          allResults.push(result);
        }
      }
    }

    return {
      listings,
      market,
      neighborhood,
      comps,
      allResults,
    };
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const tavilyProvider = new TavilyProvider();
