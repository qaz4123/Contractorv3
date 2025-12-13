/**
 * Gemini 2.0 Grounded AI Provider
 * Uses Google Gemini with grounding for verifiable, source-cited responses
 * 
 * Documentation: https://ai.google.dev/gemini-api/docs/grounding
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { config } from '../../config';

// Types for grounded responses
export interface GroundingSource {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
}

export interface GroundedResponse<T = any> {
  data: T;
  sources: GroundingSource[];
  confidence: 'low' | 'medium' | 'high';
  groundingMetadata: {
    totalSources: number;
    verifiedClaims: number;
    unverifiedClaims: number;
  };
  modelUsed: string;
  timestamp: Date;
}

export interface GroundingConfig {
  enableWebSearch: boolean;
  enableDatabaseLookup: boolean;
  enableBusinessRecords: boolean;
  maxSources?: number;
  requireCitations: boolean;
}

/**
 * Gemini Grounded Provider
 * Provides AI responses with source citations and verification
 */
export class GeminiGroundedProvider {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private modelName: string;
  private groundingConfig: GroundingConfig;

  constructor(
    apiKey?: string,
    modelName: string = 'gemini-2.0-flash',
    groundingConfig?: Partial<GroundingConfig>
  ) {
    const key = apiKey || config.api.geminiKey;
    this.modelName = modelName;
    
    // Default grounding configuration
    this.groundingConfig = {
      enableWebSearch: true,
      enableDatabaseLookup: true,
      enableBusinessRecords: true,
      maxSources: 10,
      requireCitations: true,
      ...groundingConfig,
    };

    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      
      // Configure model with grounding settings
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0, // Deterministic for reliability
          topP: 1,
          topK: 1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json', // Ensure JSON output
        },
        // Note: Actual grounding configuration depends on Gemini API version
        // This is a placeholder for when grounding is fully supported
      });
    } else {
      console.warn('⚠️ Gemini API key not configured');
    }
  }

  /**
   * Run a grounded search query
   * Returns response with sources and citations
   */
  async runGroundedSearch(
    query: string,
    context?: string[],
    userProvidedSources?: GroundingSource[]
  ): Promise<GroundedResponse<any>> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildGroundedPrompt(query, context, userProvidedSources);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse response and extract grounding information
      return this.parseGroundedResponse(text, userProvidedSources || []);
    } catch (error) {
      console.error('Gemini grounded search failed:', error);
      throw error;
    }
  }

  /**
   * Run grounded enrichment for lead intelligence
   * Enriches data with verifiable sources
   */
  async runGroundedEnrichment(
    address: string,
    searchResults: any[],
    additionalContext?: any
  ): Promise<GroundedResponse<any>> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    // Convert search results to grounding sources
    const sources: GroundingSource[] = searchResults.map(r => ({
      title: r.title || 'Unknown Source',
      url: r.url || '',
      snippet: r.content || r.snippet || '',
      relevanceScore: r.score,
    }));

    const prompt = this.buildEnrichmentPrompt(address, sources, additionalContext);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return this.parseGroundedResponse(text, sources);
    } catch (error) {
      console.error('Gemini grounded enrichment failed:', error);
      throw error;
    }
  }

  /**
   * Generate grounded insights with citations
   * For business intelligence and decision support
   */
  async generateGroundedInsights(
    topic: string,
    data: any,
    requiredInsights: string[]
  ): Promise<GroundedResponse<any>> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.buildInsightsPrompt(topic, data, requiredInsights);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return this.parseGroundedResponse(text, []);
    } catch (error) {
      console.error('Gemini grounded insights failed:', error);
      throw error;
    }
  }

  /**
   * Build grounded prompt with source citation requirements
   */
  private buildGroundedPrompt(
    query: string,
    context?: string[],
    sources?: GroundingSource[]
  ): string {
    const contextSection = context && context.length > 0
      ? `\n\nContext:\n${context.join('\n')}`
      : '';

    const sourcesSection = sources && sources.length > 0
      ? `\n\nAvailable Sources:\n${sources.map((s, i) => 
          `[${i + 1}] ${s.title}\nURL: ${s.url}\n${s.snippet}`
        ).join('\n\n')}`
      : '';

    return `You are a grounded AI assistant that MUST cite sources for all factual claims.

CRITICAL REQUIREMENTS:
1. Every factual claim MUST be supported by a source citation
2. Use the format [Source N] after each fact
3. If a fact cannot be verified from available sources, explicitly state "Unverified: [claim]"
4. Include a "sources" array in your JSON response with all cited sources
5. Rate your confidence based on source quality and consistency

Query: ${query}${contextSection}${sourcesSection}

Return a JSON response with this exact structure:
{
  "data": { /* your analysis */ },
  "sources": [
    {
      "index": 1,
      "title": "Source title",
      "url": "Source URL",
      "snippet": "Relevant excerpt",
      "claims": ["List of claims supported by this source"]
    }
  ],
  "confidence": "low|medium|high",
  "groundingMetadata": {
    "totalSources": <number>,
    "verifiedClaims": <number>,
    "unverifiedClaims": <number>,
    "notes": "Any caveats or limitations"
  }
}`;
  }

  /**
   * Build enrichment prompt for lead intelligence
   */
  private buildEnrichmentPrompt(
    address: string,
    sources: GroundingSource[],
    additionalContext?: any
  ): string {
    const sourcesSection = sources.map((s, i) => 
      `[Source ${i + 1}] ${s.title}\nURL: ${s.url}\n${s.snippet}`
    ).join('\n\n---\n\n');

    return `You are a grounded lead intelligence analyst. Analyze property data with SOURCE CITATIONS.

Property Address: ${address}

Available Sources:
${sourcesSection}

${additionalContext ? `Additional Context:\n${JSON.stringify(additionalContext, null, 2)}` : ''}

CRITICAL ANALYSIS REQUIREMENTS:
1. CITE sources for every factual claim using [Source N] format
2. Distinguish between verified facts and inferences
3. Rate confidence based on source quality
4. Flag contradictions between sources
5. Identify missing data gaps

Return comprehensive lead intelligence in this JSON structure:
{
  "leadScore": <0-100>,
  "renovationPotential": "LOW|MEDIUM|HIGH|EXCELLENT",
  "ownerMotivation": "LOW|MEDIUM|HIGH|VERY_HIGH",
  "profitPotential": <estimated profit>,
  "propertyIntel": { /* verified property data with source citations */ },
  "ownerIntel": { /* verified owner data with source citations */ },
  "financialIntel": { /* verified financial data with source citations */ },
  "permitHistory": { /* verified permit data with source citations */ },
  "renovationOpps": [ /* opportunities with confidence levels */ ],
  "salesApproach": { /* strategy based on verified insights */ },
  "sources": [ /* all sources used with claims they support */ ],
  "confidence": "low|medium|high",
  "groundingMetadata": {
    "totalSources": <number>,
    "verifiedClaims": <number>,
    "unverifiedClaims": <number>,
    "dataQuality": "poor|fair|good|excellent",
    "notes": "Quality assessment and caveats"
  }
}`;
  }

  /**
   * Build insights prompt for business intelligence
   */
  private buildInsightsPrompt(
    topic: string,
    data: any,
    requiredInsights: string[]
  ): string {
    return `Generate grounded business insights with source citations.

Topic: ${topic}

Data:
${JSON.stringify(data, null, 2)}

Required Insights:
${requiredInsights.map((r, i) => `${i + 1}. ${r}`).join('\n')}

REQUIREMENTS:
1. All insights must be grounded in the provided data
2. Cite specific data points that support each insight
3. Distinguish between facts, inferences, and recommendations
4. Provide confidence levels for predictions

Return JSON response with:
{
  "insights": [
    {
      "insight": "<the insight>",
      "supporting_data": ["<data point 1>", "<data point 2>"],
      "confidence": "low|medium|high",
      "actionable": true/false,
      "recommendation": "<if applicable>"
    }
  ],
  "sources": [ /* data sources used */ ],
  "confidence": "low|medium|high",
  "groundingMetadata": {
    "totalSources": <number>,
    "verifiedClaims": <number>,
    "notes": "Any caveats"
  }
}`;
  }

  /**
   * Parse grounded response and extract sources
   */
  private parseGroundedResponse(
    text: string,
    providedSources: GroundingSource[]
  ): GroundedResponse<any> {
    try {
      // Clean and parse JSON
      let cleanText = text.trim();
      
      // Remove markdown code blocks if present (use more specific pattern)
      // Only match the first code block to avoid multiple matches
      const jsonMatch = cleanText.match(/^```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        cleanText = jsonMatch[1].trim();
      } else {
        // Try to find JSON object directly if no code blocks
        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
        }
      }

      const parsed = JSON.parse(cleanText);

      // Extract grounding metadata
      const sources: GroundingSource[] = (parsed.sources || []).map((s: any, i: number) => ({
        title: s.title || `Source ${i + 1}`,
        url: s.url || providedSources[i]?.url || '',
        snippet: s.snippet || s.content || providedSources[i]?.snippet || '',
        relevanceScore: s.relevanceScore || providedSources[i]?.relevanceScore,
      }));

      const groundingMetadata = parsed.groundingMetadata || {
        totalSources: sources.length,
        verifiedClaims: 0,
        unverifiedClaims: 0,
      };

      // Determine confidence
      let confidence: 'low' | 'medium' | 'high' = 'medium';
      if (parsed.confidence) {
        confidence = parsed.confidence as 'low' | 'medium' | 'high';
      } else if (groundingMetadata.totalSources >= 5 && groundingMetadata.verifiedClaims > groundingMetadata.unverifiedClaims * 2) {
        confidence = 'high';
      } else if (groundingMetadata.totalSources < 2 || groundingMetadata.unverifiedClaims > groundingMetadata.verifiedClaims) {
        confidence = 'low';
      }

      return {
        data: parsed,
        sources,
        confidence,
        groundingMetadata,
        modelUsed: this.modelName,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to parse grounded response:', error);
      throw new Error(`Grounded response parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verify grounding quality
   * Checks if response meets grounding standards
   */
  verifyGrounding(response: GroundedResponse<any>): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!this.groundingConfig.requireCitations) {
      return { isValid: true, issues: [] };
    }

    // Check if sources are present
    if (!response.sources || response.sources.length === 0) {
      issues.push('No sources provided');
    }

    // Check if confidence is appropriate
    if (response.confidence === 'low' && response.sources.length < 2) {
      issues.push('Low confidence with insufficient sources');
    }

    // Check grounding metadata
    if (response.groundingMetadata.unverifiedClaims > response.groundingMetadata.verifiedClaims) {
      issues.push('More unverified claims than verified claims');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return this.model !== null;
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return this.modelName;
  }
}

// Export singleton instance
export const geminiGroundedProvider = new GeminiGroundedProvider();
