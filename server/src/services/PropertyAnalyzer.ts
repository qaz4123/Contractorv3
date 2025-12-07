/**
 * Property Analyzer Service
 * Orchestrates web search and AI analysis to provide comprehensive property insights
 */

import { TavilyProvider } from './search/TavilyProvider';
import { GeminiProvider, GeminiAnalysisOutput } from './ai/GeminiProvider';
import { CacheService } from './cache/CacheService';
import { v4 as uuidv4 } from 'uuid';

// Types
interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

interface DataSource {
  name: string;
  url?: string;
  dataType: 'listing' | 'valuation' | 'market' | 'neighborhood' | 'general';
  retrievedAt: Date;
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  source: string;
}

interface PropertyAnalysis {
  id: string;
  address: PropertyAddress;
  details: any;
  valuation: any;
  marketData: any;
  neighborhood: any;
  scores: any;
  pros: string[];
  cons: string[];
  recommendations: string[];
  aiSummary: string;
  sources: DataSource[];
  analyzedAt: Date;
  cached: boolean;
}

export interface AnalyzePropertyRequest {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  userId?: string;
  skipCache?: boolean;
}

interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

export class PropertyAnalyzerService {
  private searchProvider: TavilyProvider;
  private aiProvider: GeminiProvider;
  private cache: CacheService;

  constructor(
    tavilyApiKey?: string,
    geminiApiKey?: string,
    cacheOptions?: { ttlMinutes?: number }
  ) {
    this.searchProvider = new TavilyProvider(tavilyApiKey);
    this.aiProvider = new GeminiProvider(geminiApiKey);
    this.cache = new CacheService(cacheOptions?.ttlMinutes);
  }

  /**
   * Main analysis method - performs comprehensive property analysis
   */
  async analyzeProperty(request: AnalyzePropertyRequest): Promise<PropertyAnalysis> {
    const startTime = Date.now();
    console.log(`🏠 Starting analysis for: ${request.address}`);

    // Parse the address
    const parsedAddress = this.parseAddress(request);
    const cacheKey = this.generateCacheKey(parsedAddress.fullAddress);

    // Check cache first (unless skip requested)
    if (!request.skipCache) {
      const cached = this.cache.get<PropertyAnalysis>(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit for: ${parsedAddress.fullAddress}`);
        return { ...cached, cached: true };
      }
    }

    try {
      // Step 1: Perform comprehensive web search
      console.log('🔍 Searching for property data...');
      const searchData = await this.searchProvider.comprehensivePropertySearch(
        parsedAddress.fullAddress,
        parsedAddress.city,
        parsedAddress.state
      );

      // Step 2: Analyze with AI
      console.log('🤖 Analyzing with AI...');
      const aiAnalysis = await this.aiProvider.analyzeProperty({
        address: parsedAddress.street,
        city: parsedAddress.city,
        state: parsedAddress.state,
        zipCode: parsedAddress.zipCode,
        searchResults: searchData.allResults,
      });

      // Step 3: Build the complete analysis result
      const analysis = this.buildAnalysisResult(
        parsedAddress,
        aiAnalysis,
        searchData.allResults,
        request.userId
      );

      // Step 4: Cache the result
      this.cache.set(cacheKey, analysis);

      const duration = Date.now() - startTime;
      console.log(`✅ Analysis complete in ${duration}ms`);

      return analysis;
    } catch (error) {
      console.error('❌ Property analysis failed:', error);
      
      // Return a partial result with error indication
      return this.buildErrorResult(parsedAddress, error as Error);
    }
  }

  /**
   * Parse address into components
   */
  private parseAddress(request: AnalyzePropertyRequest): ParsedAddress {
    let street = request.address;
    let city = request.city || '';
    let state = request.state || '';
    let zipCode = request.zipCode || '';

    // Try to parse if full address is provided
    if (!city || !state) {
      const parsed = this.parseFullAddress(request.address);
      street = parsed.street || street;
      city = parsed.city || city;
      state = parsed.state || state;
      zipCode = parsed.zipCode || zipCode;
    }

    // Default to common values if still missing
    city = city || 'Unknown City';
    state = state || 'CA';

    const fullAddress = [street, city, state, zipCode].filter(Boolean).join(', ');

    return { street, city, state, zipCode, fullAddress };
  }

  /**
   * Try to parse a full address string
   */
  private parseFullAddress(address: string): Partial<ParsedAddress> {
    const result: Partial<ParsedAddress> = {};

    // Common US address pattern: "123 Main St, City, ST 12345"
    const patterns = [
      // Pattern: Street, City, State ZIP
      /^(.+?),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i,
      // Pattern: Street, City State ZIP
      /^(.+?),\s*([^,]+)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i,
      // Pattern: Street City, State ZIP
      /^(.+?)\s+([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i,
    ];

    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match) {
        result.street = match[1]?.trim();
        result.city = match[2]?.trim();
        result.state = match[3]?.toUpperCase();
        result.zipCode = match[4]?.trim();
        break;
      }
    }

    // If no pattern matched, try to extract just the zip code
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
    if (zipMatch && !result.zipCode) {
      result.zipCode = zipMatch[1];
    }

    return result;
  }

  /**
   * Build the complete analysis result
   */
  private buildAnalysisResult(
    address: ParsedAddress,
    aiAnalysis: GeminiAnalysisOutput,
    searchResults: SearchResult[],
    userId?: string
  ): PropertyAnalysis {
    const sources: DataSource[] = searchResults.map((r) => ({
      name: r.source,
      url: r.url,
      dataType: this.categorizeSource(r.source),
      retrievedAt: new Date(),
    }));

    return {
      id: uuidv4(),
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        fullAddress: address.fullAddress,
      },
      details: {
        bedrooms: aiAnalysis.details.bedrooms,
        bathrooms: aiAnalysis.details.bathrooms,
        squareFeet: aiAnalysis.details.squareFeet,
        yearBuilt: aiAnalysis.details.yearBuilt,
        propertyType: aiAnalysis.details.propertyType as any,
      },
      valuation: {
        estimatedValue: aiAnalysis.valuation.estimatedValue || 0,
        priceRange: {
          low: aiAnalysis.valuation.priceRangeLow || 0,
          high: aiAnalysis.valuation.priceRangeHigh || 0,
        },
        pricePerSqFt: aiAnalysis.valuation.pricePerSqFt,
        lastSoldPrice: aiAnalysis.valuation.lastSoldPrice,
        lastSoldDate: aiAnalysis.valuation.lastSoldDate,
      },
      marketData: {
        medianHomePrice: aiAnalysis.marketData.medianHomePrice || 0,
        avgDaysOnMarket: aiAnalysis.marketData.avgDaysOnMarket || 0,
        priceChangeYoY: aiAnalysis.marketData.priceChangeYoY || 0,
        inventoryLevel: (aiAnalysis.marketData.inventoryLevel as any) || 'moderate',
        marketTrend: (aiAnalysis.marketData.marketTrend as any) || 'balanced',
      },
      neighborhood: {
        walkScore: aiAnalysis.neighborhood.walkScore,
        transitScore: aiAnalysis.neighborhood.transitScore,
        bikeScore: aiAnalysis.neighborhood.bikeScore,
        crimeRate: aiAnalysis.neighborhood.crimeRate as any,
        schoolRating: aiAnalysis.neighborhood.schoolRating,
        nearbyAmenities: aiAnalysis.neighborhood.nearbyAmenities,
      },
      scores: aiAnalysis.scores,
      pros: aiAnalysis.pros,
      cons: aiAnalysis.cons,
      recommendations: aiAnalysis.recommendations,
      aiSummary: aiAnalysis.summary,
      sources,
      analyzedAt: new Date(),
      cached: false,
    };
  }

  /**
   * Build an error result when analysis fails
   */
  private buildErrorResult(address: ParsedAddress, error: Error): PropertyAnalysis {
    return {
      id: uuidv4(),
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        fullAddress: address.fullAddress,
      },
      details: {},
      valuation: {
        estimatedValue: 0,
        priceRange: { low: 0, high: 0 },
      },
      marketData: {
        medianHomePrice: 0,
        avgDaysOnMarket: 0,
        priceChangeYoY: 0,
        inventoryLevel: 'moderate',
        marketTrend: 'balanced',
      },
      neighborhood: {
        nearbyAmenities: [],
      },
      scores: {
        investment: 0,
        location: 0,
        condition: 0,
        marketTiming: 0,
        overall: 0,
      },
      pros: [],
      cons: [],
      recommendations: ['An error occurred while analyzing the property. Please try again later.'],
      aiSummary: `Error: ${error.message}`,
      sources: [],
      analyzedAt: new Date(),
      cached: false,
    };
  }

  /**
   * Categorize a source by its domain
   */
  private categorizeSource(source: string): 'listing' | 'valuation' | 'market' | 'neighborhood' | 'general' {
    const domain = source.toLowerCase();
    
    if (['zillow.com', 'redfin.com', 'realtor.com', 'trulia.com'].some(d => domain.includes(d))) {
      return 'listing';
    }
    if (['walkscore.com', 'greatschools.org', 'niche.com', 'areavibes.com'].some(d => domain.includes(d))) {
      return 'neighborhood';
    }
    if (['nar.realtor', 'noradarealestate.com'].some(d => domain.includes(d))) {
      return 'market';
    }
    
    return 'general';
  }

  /**
   * Generate a cache key from address
   */
  private generateCacheKey(address: string): string {
    return address.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; size: number } {
    return this.cache.getStats();
  }

  /**
   * Check if all providers are configured
   */
  isConfigured(): { search: boolean; ai: boolean } {
    return {
      search: this.searchProvider.isConfigured(),
      ai: this.aiProvider.isConfigured(),
    };
  }
}

// Export factory function
export function createPropertyAnalyzer(
  tavilyApiKey?: string,
  geminiApiKey?: string
): PropertyAnalyzerService {
  return new PropertyAnalyzerService(tavilyApiKey, geminiApiKey);
}
