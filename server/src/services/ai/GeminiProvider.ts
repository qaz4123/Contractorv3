/**
 * Gemini AI Provider
 * Uses Google Gemini for analyzing property data and generating insights
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Types
export interface PropertyScores {
  investment: number;
  location: number;
  condition: number;
  marketTiming: number;
  overall: number;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  source: string;
}

export interface PropertyAnalysisInput {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  searchResults: SearchResult[];
}

export interface GeminiAnalysisOutput {
  scores: PropertyScores;
  details: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    yearBuilt?: number;
    propertyType?: string;
  };
  valuation: {
    estimatedValue?: number;
    priceRangeLow?: number;
    priceRangeHigh?: number;
    pricePerSqFt?: number;
    lastSoldPrice?: number;
    lastSoldDate?: string;
  };
  marketData: {
    medianHomePrice?: number;
    avgDaysOnMarket?: number;
    priceChangeYoY?: number;
    inventoryLevel?: string;
    marketTrend?: string;
  };
  neighborhood: {
    walkScore?: number;
    transitScore?: number;
    bikeScore?: number;
    schoolRating?: number;
    crimeRate?: string;
    nearbyAmenities: string[];
  };
  pros: string[];
  cons: string[];
  recommendations: string[];
  summary: string;
}

export class GeminiProvider {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = 'gemini-2.0-flash') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    this.modelName = modelName;

    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      // Configure model for deterministic output
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0,  // Deterministic responses
          topP: 1,
          topK: 1,
          maxOutputTokens: 8192,
        },
      });
    } else {
      console.warn('⚠️ Gemini API key not configured');
    }
  }

  /**
   * Analyze property data and generate insights
   */
  async analyzeProperty(input: PropertyAnalysisInput): Promise<GeminiAnalysisOutput> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildAnalysisPrompt(input);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return this.parseAnalysisResponse(text);
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build the analysis prompt
   */
  private buildAnalysisPrompt(input: PropertyAnalysisInput): string {
    const searchContext = input.searchResults
      .map((r, i) => `[Source ${i + 1}: ${r.source}]\n${r.content}`)
      .join('\n\n---\n\n');

    return `You are a Lead Intelligence Analyst for RENOVATION CONTRACTORS. Your job is to analyze property data and provide actionable business intelligence that helps contractors identify renovation opportunities and qualify leads.

PROPERTY ADDRESS:
${input.address}
${input.city}, ${input.state} ${input.zipCode}

SEARCH DATA:
${searchContext}

Analyze this property and provide intelligence useful for a renovation contractor. Focus on:
1. Property condition and renovation needs
2. Owner financial indicators (liens, mortgages, business ownership)
3. Permit history and status
4. Renovation opportunities to pitch to the owner

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks.

{
  "scores": {
    "leadQuality": <number 0-100 - how good is this lead for a contractor>,
    "renovationPotential": <number 0-100 - how much renovation work needed>,
    "ownerMotivation": <number 0-100 - likelihood owner will pay for renovations>,
    "profitPotential": <number 0-100 - potential profit margin>,
    "overall": <number 0-100>
  },
  "propertyDetails": {
    "bedrooms": <number or null>,
    "bathrooms": <number or null>,
    "squareFeet": <number or null>,
    "yearBuilt": <number or null>,
    "propertyType": "<single-family|condo|townhouse|multi-family|commercial or null>",
    "lotSize": "<lot size or null>",
    "lastSaleDate": "<date or null>",
    "lastSalePrice": <number or null>
  },
  "ownerIntelligence": {
    "ownerName": "<name if found or null>",
    "ownershipType": "<individual|trust|llc|corporation|unknown>",
    "businessOnProperty": "<company name if registered at address or null>",
    "estimatedEquity": "<high|medium|low|unknown>",
    "lengthOfOwnership": "<years or null>",
    "likelyToRenovate": "<yes|maybe|no|unknown>"
  },
  "financialIndicators": {
    "estimatedValue": <number or null>,
    "mortgageInfo": "<any mortgage/loan info found or null>",
    "liens": ["<lien 1>", "<lien 2>"] or [],
    "taxStatus": "<current|delinquent|unknown>",
    "foreclosureRisk": "<none|low|medium|high|unknown>"
  },
  "permitHistory": {
    "recentPermits": ["<permit 1 with date>", "<permit 2>"] or [],
    "openPermits": ["<open permit 1>"] or [],
    "lastRenovation": "<description and year or null>",
    "permitIssues": "<any red flags or null>"
  },
  "renovationOpportunities": {
    "suggestedProjects": [
      {"project": "<project name>", "estimatedCost": "<range>", "priority": "<high|medium|low>"},
      {"project": "<project name>", "estimatedCost": "<range>", "priority": "<high|medium|low>"}
    ],
    "urgentRepairs": ["<urgent repair 1>", "<urgent repair 2>"] or [],
    "valueAddProjects": ["<project that adds most value>"] or []
  },
  "salesApproach": {
    "bestPitch": "<recommended approach to pitch renovation services>",
    "painPoints": ["<owner pain point 1>", "<pain point 2>"],
    "objections": ["<likely objection 1>", "<objection 2>"],
    "timing": "<best time to approach - now|spring|after X|unknown>"
  },
  "competitiveIntel": {
    "recentContractorWork": "<any recent contractor work visible or null>",
    "neighborhoodTrend": "<are neighbors renovating? or null>"
  },
  "summary": "<2-3 paragraph summary in ENGLISH: Overall assessment of this lead, key opportunities, recommended approach, and any red flags>"
}

SCORING GUIDELINES FOR CONTRACTORS:
- Lead Quality: Is this a good lead to pursue? Consider owner situation, property needs, ability to pay
- Renovation Potential: How much work does this property need?
- Owner Motivation: Based on property age, condition, ownership length - how motivated might they be?
- Profit Potential: Considering scope of work and area, what's the profit potential?
- Overall: How worthwhile is it to pursue this lead?`;
  }

  /**
   * Parse the AI response into structured data
   */
  private parseAnalysisResponse(text: string): GeminiAnalysisOutput {
    try {
      // Remove any markdown code block markers if present
      let cleanText = text.trim();
      
      // Handle various markdown formats
      const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        cleanText = jsonMatch[1].trim();
      } else {
        // Try to find JSON object directly
        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
        }
      }

      const parsed = JSON.parse(cleanText);

      // Handle new format with leadQuality, renovationPotential etc
      const scores = parsed.scores;
      
      if (!scores) {
        throw new Error('AI response missing required "scores" object');
      }
      
      // Validate and normalize the response - no fallback values
      // Use new format names or old format names, but require at least one
      const investment = scores.leadQuality ?? scores.investment;
      const location = scores.location;
      const condition = scores.renovationPotential ?? scores.condition;
      const marketTiming = scores.ownerMotivation ?? scores.marketTiming;
      const overall = scores.overall;
      
      // Validate all required scores are present
      if (investment === undefined) {
        throw new Error('AI response missing required score: investment/leadQuality');
      }
      if (location === undefined) {
        throw new Error('AI response missing required score: location');
      }
      if (condition === undefined) {
        throw new Error('AI response missing required score: condition/renovationPotential');
      }
      if (marketTiming === undefined) {
        throw new Error('AI response missing required score: marketTiming/ownerMotivation');
      }
      if (overall === undefined) {
        throw new Error('AI response missing required score: overall');
      }
      
      return {
        scores: {
          investment: this.clampScore(investment),
          location: this.clampScore(location),
          condition: this.clampScore(condition),
          marketTiming: this.clampScore(marketTiming),
          overall: this.clampScore(overall),
        },
        details: {
          bedrooms: parsed.propertyDetails?.bedrooms || parsed.details?.bedrooms || undefined,
          bathrooms: parsed.propertyDetails?.bathrooms || parsed.details?.bathrooms || undefined,
          squareFeet: parsed.propertyDetails?.squareFeet || parsed.details?.squareFeet || undefined,
          yearBuilt: parsed.propertyDetails?.yearBuilt || parsed.details?.yearBuilt || undefined,
          propertyType: parsed.propertyDetails?.propertyType || parsed.details?.propertyType || undefined,
        },
        valuation: {
          estimatedValue: parsed.financialIndicators?.estimatedValue || parsed.valuation?.estimatedValue || undefined,
          priceRangeLow: parsed.valuation?.priceRangeLow || undefined,
          priceRangeHigh: parsed.valuation?.priceRangeHigh || undefined,
          pricePerSqFt: parsed.valuation?.pricePerSqFt || undefined,
          lastSoldPrice: parsed.propertyDetails?.lastSalePrice || parsed.valuation?.lastSoldPrice || undefined,
          lastSoldDate: parsed.propertyDetails?.lastSaleDate || parsed.valuation?.lastSoldDate || undefined,
        },
        marketData: {
          medianHomePrice: parsed.marketData?.medianHomePrice || undefined,
          avgDaysOnMarket: parsed.marketData?.avgDaysOnMarket || undefined,
          priceChangeYoY: parsed.marketData?.priceChangeYoY || undefined,
          inventoryLevel: parsed.marketData?.inventoryLevel || undefined,
          marketTrend: parsed.marketData?.marketTrend || undefined,
        },
        neighborhood: {
          walkScore: parsed.neighborhood?.walkScore || undefined,
          transitScore: parsed.neighborhood?.transitScore || undefined,
          bikeScore: parsed.neighborhood?.bikeScore || undefined,
          schoolRating: parsed.neighborhood?.schoolRating || undefined,
          crimeRate: parsed.neighborhood?.crimeRate || undefined,
          nearbyAmenities: parsed.neighborhood?.nearbyAmenities || [],
        },
        pros: Array.isArray(parsed.pros) ? parsed.pros : [],
        cons: Array.isArray(parsed.cons) ? parsed.cons : [],
        recommendations: Array.isArray(parsed.recommendations) 
          ? parsed.recommendations 
          : (parsed.renovationOpportunities?.suggestedProjects?.map((p: any) => p.project) || []),
        summary: parsed.summary || 'Unable to generate summary',
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Raw response:', text.substring(0, 500));
      
      // Throw error instead of returning fallback to maintain reliability
      throw new Error(`AI response parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clamp score to 0-100 range
   * Now throws error for invalid scores to ensure reliability
   */
  private clampScore(score: unknown): number {
    if (typeof score !== 'number' || isNaN(score)) {
      throw new Error(`Invalid score value: ${score}. Expected a valid number between 0-100.`);
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get fallback response when parsing fails
   * DEPRECATED: Now throws error instead of returning fallback
   */
  private getFallbackResponse(): GeminiAnalysisOutput {
    throw new Error('Failed to parse AI response. Cannot return fallback data as it would break reliability guarantees.');
  }

  /**
   * Generate lead intelligence analysis
   */
  async generateLeadIntelligence(prompt: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini model not initialized');
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini lead intelligence error:', error);
      throw error;
    }
  }

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean {
    return this.model !== null;
  }

  /**
   * Get the model name being used
   */
  getModelName(): string {
    return this.modelName;
  }
}

// Export singleton instance
export const geminiProvider = new GeminiProvider();
