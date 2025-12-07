import { TavilyProvider } from '../search/TavilyProvider';
import { GeminiProvider } from '../ai/GeminiProvider';
import { UsageTrackingService } from '../usage/UsageTrackingService';

export interface LeadIntelligence {
  leadScore: number;
  renovationPotential: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';
  ownerMotivation: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  profitPotential: number;
  
  propertyIntel: PropertyIntel;
  ownerIntel: OwnerIntel;
  financialIntel: FinancialIntel;
  permitHistory: PermitHistory;
  renovationOpps: RenovationOpportunity[];
  salesApproach: SalesApproach;
}

export interface PropertyIntel {
  yearBuilt: number | null;
  squareFeet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSize: string | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  estimatedValue: number | null;
  propertyType: string | null;
  condition: string | null;
  taxAssessedValue: number | null;
  hoaFees: number | null;
  zoning: string | null;
  floodZone: boolean | null;
  recentRenovations: string[];
  knownIssues: string[];
}

export interface OwnerIntel {
  ownerName: string | null;
  ownerType: 'INDIVIDUAL' | 'LLC' | 'TRUST' | 'BANK' | 'UNKNOWN';
  ownerSince: string | null;
  mailingAddress: string | null;
  phoneNumbers: string[];
  emailAddresses: string[];
  businessRecords: BusinessRecord[];
  estimatedIncome: string | null;
  likelyToSell: boolean | null;
  motivationFactors: string[];
}

export interface BusinessRecord {
  businessName: string;
  status: string;
  type: string;
  registrationDate: string | null;
}

export interface FinancialIntel {
  estimatedEquity: number | null;
  mortgageBalance: number | null;
  lienAmount: number | null;
  liens: Lien[];
  taxDelinquent: boolean;
  taxOwed: number | null;
  foreclosureStatus: string | null;
  bankruptcyHistory: boolean | null;
  financingLikelihood: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Lien {
  type: string;
  amount: number;
  creditor: string;
  filedDate: string;
  status: string;
}

export interface PermitHistory {
  totalPermits: number;
  recentPermits: Permit[];
  activePermits: number;
  lastPermitDate: string | null;
  permitTypes: string[];
  codeViolations: CodeViolation[];
}

export interface Permit {
  type: string;
  description: string;
  issueDate: string;
  status: string;
  estimatedCost: number | null;
  contractor: string | null;
}

export interface CodeViolation {
  type: string;
  description: string;
  date: string;
  status: string;
  fineAmount: number | null;
}

export interface RenovationOpportunity {
  area: string;
  description: string;
  estimatedCost: { min: number; max: number };
  estimatedValueAdd: { min: number; max: number };
  roi: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timelineWeeks: { min: number; max: number };
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  permits_required: boolean;
}

export interface SalesApproach {
  recommendedApproach: string;
  keyTalkingPoints: string[];
  painPoints: string[];
  objectionHandlers: { objection: string; response: string }[];
  bestContactTime: string | null;
  preferredContactMethod: 'PHONE' | 'EMAIL' | 'TEXT' | 'IN_PERSON' | 'UNKNOWN';
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
  followUpCadence: string;
}

export class LeadIntelligenceService {
  private searchProvider: TavilyProvider;
  private aiProvider: GeminiProvider;
  private usageService: UsageTrackingService;

  constructor() {
    this.searchProvider = new TavilyProvider();
    this.aiProvider = new GeminiProvider();
    this.usageService = new UsageTrackingService();
  }

  async generateLeadIntelligence(address: string, userId?: string, leadId?: string): Promise<LeadIntelligence> {
    console.log(`Generating lead intelligence for: ${address}`);
    
    // Parallel searches for different intel categories
    const [
      propertySearch,
      ownerSearch,
      lienSearch,
      permitSearch,
      saleSearch
    ] = await Promise.all([
      this.searchProperty(address),
      this.searchOwner(address),
      this.searchLiens(address),
      this.searchPermits(address),
      this.searchSaleHistory(address)
    ]);

    // Combine all search results
    const combinedContext = `
## Property Information Search Results:
${propertySearch}

## Owner Information Search Results:
${ownerSearch}

## Liens and Financial Records Search Results:
${lienSearch}

## Permit History Search Results:
${permitSearch}

## Sale History and Market Data:
${saleSearch}
`;

    // AI Analysis to structure the data
    const intelligence = await this.analyzeWithAI(address, combinedContext);
    
    // Track AI usage for cost attribution
    if (userId) {
      try {
        await this.usageService.trackAIUsage(userId, 5000, leadId); // Estimate 5000 tokens
      } catch (error) {
        console.error('Failed to track AI usage:', error);
      }
    }
    
    return intelligence;
  }

  private async searchProperty(address: string): Promise<string> {
    try {
      const response = await this.searchProvider.search(
        `"${address}" property details square feet bedrooms bathrooms year built lot size`,
        { maxResults: 5 }
      );
      return this.formatSearchResults(response.results);
    } catch (error) {
      console.error('Property search error:', error);
      return 'No property data found';
    }
  }

  private async searchOwner(address: string): Promise<string> {
    try {
      const response = await this.searchProvider.search(
        `"${address}" property owner name LLC trust records`,
        { maxResults: 5 }
      );
      return this.formatSearchResults(response.results);
    } catch (error) {
      console.error('Owner search error:', error);
      return 'No owner data found';
    }
  }

  private async searchLiens(address: string): Promise<string> {
    try {
      const response = await this.searchProvider.search(
        `"${address}" property liens tax delinquent mortgage foreclosure`,
        { maxResults: 5 }
      );
      return this.formatSearchResults(response.results);
    } catch (error) {
      console.error('Liens search error:', error);
      return 'No lien data found';
    }
  }

  private async searchPermits(address: string): Promise<string> {
    try {
      const response = await this.searchProvider.search(
        `"${address}" building permits renovations construction code violations`,
        { maxResults: 5 }
      );
      return this.formatSearchResults(response.results);
    } catch (error) {
      console.error('Permits search error:', error);
      return 'No permit data found';
    }
  }

  private async searchSaleHistory(address: string): Promise<string> {
    try {
      const response = await this.searchProvider.search(
        `"${address}" sold price sale history real estate listing`,
        { maxResults: 5 }
      );
      return this.formatSearchResults(response.results);
    } catch (error) {
      console.error('Sale history search error:', error);
      return 'No sale history found';
    }
  }

  private async searchHomeBusiness(address: string): Promise<string> {
    try {
      const response = await this.searchProvider.search(
        `"${address}" business registered LLC home office occupation profession industry`,
        { maxResults: 5 }
      );
      return this.formatSearchResults(response.results);
    } catch (error) {
      console.error('Home business search error:', error);
      return 'No home business data found';
    }
  }

  private formatSearchResults(results: any[]): string {
    if (!results || results.length === 0) {
      return 'No results found';
    }
    
    return results.map(r => 
      `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`
    ).join('\n\n');
  }

  private async analyzeWithAI(address: string, context: string): Promise<LeadIntelligence> {
    const prompt = `You are a lead intelligence analyst for a renovation contractor CRM. Analyze the following search results about a property and generate comprehensive lead intelligence.

Address: ${address}

Search Results:
${context}

**CRITICAL ANALYSIS REQUIREMENTS:**

1. **PERMIT HISTORY ANALYSIS**: Carefully review all permits found. Recent permits indicate:
   - Active property improvement (HIGH motivation)
   - Budget availability for contractors
   - Incomplete projects may need finishing
   - Pattern of permits = renovation-focused owner
   
2. **EQUITY EXTRACTION**: Calculate potential free equity:
   - Estimated Value - Mortgage Balance - Liens = Available Equity
   - High equity (>40%) = financing opportunity
   - Low equity (<20%) = may need creative financing
   - Include equity in financial intel and sales approach
   
3. **HOME BUSINESS DETECTION**: Look for business records at property address:
   - LLC/Business registered at property = home office
   - Extract business type, industry, occupation
   - Estimate business income potential
   - Home businesses often need office renovations, accessibility improvements
   - Professional spaces (medical, legal, consulting) have specific renovation needs

Based on this information, provide a detailed JSON analysis. Be realistic - if data is not found, use null or reasonable estimates based on available information. Focus on actionable intelligence for a renovation contractor.

Return ONLY valid JSON matching this structure:
{
  "leadScore": <0-100 score for lead quality>,
  "renovationPotential": "<LOW|MEDIUM|HIGH|EXCELLENT>",
  "ownerMotivation": "<LOW|MEDIUM|HIGH|VERY_HIGH>",
  "profitPotential": <estimated profit in dollars>,
  
  "propertyIntel": {
    "yearBuilt": <number or null>,
    "squareFeet": <number or null>,
    "bedrooms": <number or null>,
    "bathrooms": <number or null>,
    "lotSize": "<string or null>",
    "lastSaleDate": "<string or null>",
    "lastSalePrice": <number or null>,
    "estimatedValue": <number or null>,
    "propertyType": "<string or null>",
    "condition": "<string describing condition or null>",
    "taxAssessedValue": <number or null>,
    "hoaFees": <number or null>,
    "zoning": "<string or null>",
    "floodZone": <boolean or null>,
    "recentRenovations": ["<list of recent renovations if known>"],
    "knownIssues": ["<list of known property issues>"]
  },
  
  "ownerIntel": {
    "ownerName": "<string or null>",
    "ownerType": "<INDIVIDUAL|LLC|TRUST|BANK|UNKNOWN>",
    "ownerSince": "<date string or null>",
    "mailingAddress": "<string or null>",
    "phoneNumbers": ["<list of phone numbers if found>"],
    "emailAddresses": ["<list of emails if found>"],
    "businessRecords": [{"businessName": "", "status": "", "type": "", "registrationDate": null}],
    "estimatedIncome": "<string estimate or null>",
    "likelyToSell": <boolean or null>,
    "motivationFactors": ["<factors that might motivate renovation or sale>"]
  },
  
  "financialIntel": {
    "estimatedEquity": <number or null>,
    "mortgageBalance": <number or null>,
    "lienAmount": <total lien amount or null>,
    "liens": [{"type": "", "amount": 0, "creditor": "", "filedDate": "", "status": ""}],
    "taxDelinquent": <boolean>,
    "taxOwed": <number or null>,
    "foreclosureStatus": "<string or null>",
    "bankruptcyHistory": <boolean or null>,
    "financingLikelihood": "<LOW|MEDIUM|HIGH>"
  },
  
  "permitHistory": {
    "totalPermits": <number>,
    "recentPermits": [{"type": "", "description": "", "issueDate": "", "status": "", "estimatedCost": null, "contractor": null}],
    "activePermits": <number>,
    "lastPermitDate": "<string or null>",
    "permitTypes": ["<list of permit types seen>"],
    "codeViolations": [{"type": "", "description": "", "date": "", "status": "", "fineAmount": null}]
  },
  
  "renovationOpps": [
    {
      "area": "<Kitchen|Bathroom|Roof|HVAC|Windows|Flooring|Exterior|Landscaping|etc>",
      "description": "<specific opportunity description>",
      "estimatedCost": {"min": 0, "max": 0},
      "estimatedValueAdd": {"min": 0, "max": 0},
      "roi": <percentage as number>,
      "priority": "<LOW|MEDIUM|HIGH|CRITICAL>",
      "timelineWeeks": {"min": 0, "max": 0},
      "complexity": "<SIMPLE|MODERATE|COMPLEX>",
      "permits_required": <boolean>
    }
  ],
  
  "salesApproach": {
    "recommendedApproach": "<strategic approach for this lead>",
    "keyTalkingPoints": ["<key points to mention>"],
    "painPoints": ["<likely owner pain points>"],
    "objectionHandlers": [{"objection": "<common objection>", "response": "<recommended response>"}],
    "bestContactTime": "<recommendation or null>",
    "preferredContactMethod": "<PHONE|EMAIL|TEXT|IN_PERSON|UNKNOWN>",
    "urgencyLevel": "<LOW|MEDIUM|HIGH|IMMEDIATE>",
    "followUpCadence": "<recommended follow-up schedule>"
  }
}`;

    try {
      const response = await this.aiProvider.generateLeadIntelligence(prompt);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const intelligence = JSON.parse(jsonMatch[0]) as LeadIntelligence;
      return intelligence;
      
    } catch (error) {
      console.error('AI analysis error:', error);
      // Return default structure if AI fails
      return this.getDefaultIntelligence();
    }
  }

  private getDefaultIntelligence(): LeadIntelligence {
    return {
      leadScore: 50,
      renovationPotential: 'MEDIUM',
      ownerMotivation: 'MEDIUM',
      profitPotential: 0,
      propertyIntel: {
        yearBuilt: null,
        squareFeet: null,
        bedrooms: null,
        bathrooms: null,
        lotSize: null,
        lastSaleDate: null,
        lastSalePrice: null,
        estimatedValue: null,
        propertyType: null,
        condition: null,
        taxAssessedValue: null,
        hoaFees: null,
        zoning: null,
        floodZone: null,
        recentRenovations: [],
        knownIssues: []
      },
      ownerIntel: {
        ownerName: null,
        ownerType: 'UNKNOWN',
        ownerSince: null,
        mailingAddress: null,
        phoneNumbers: [],
        emailAddresses: [],
        businessRecords: [],
        estimatedIncome: null,
        likelyToSell: null,
        motivationFactors: []
      },
      financialIntel: {
        estimatedEquity: null,
        mortgageBalance: null,
        lienAmount: null,
        liens: [],
        taxDelinquent: false,
        taxOwed: null,
        foreclosureStatus: null,
        bankruptcyHistory: null,
        financingLikelihood: 'MEDIUM'
      },
      permitHistory: {
        totalPermits: 0,
        recentPermits: [],
        activePermits: 0,
        lastPermitDate: null,
        permitTypes: [],
        codeViolations: []
      },
      renovationOpps: [],
      salesApproach: {
        recommendedApproach: 'Standard outreach - gather more information',
        keyTalkingPoints: [],
        painPoints: [],
        objectionHandlers: [],
        bestContactTime: null,
        preferredContactMethod: 'UNKNOWN',
        urgencyLevel: 'LOW',
        followUpCadence: 'Weekly follow-up'
      }
    };
  }
}
