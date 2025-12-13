// Shared types between client and server

// ===========================================
// Property Types
// ===========================================

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

export interface PropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'land' | 'commercial';
}

export interface PropertyValuation {
  estimatedValue: number;
  priceRange: {
    low: number;
    high: number;
  };
  pricePerSqFt?: number;
  lastSoldPrice?: number;
  lastSoldDate?: string;
}

export interface MarketData {
  medianHomePrice: number;
  avgDaysOnMarket: number;
  priceChangeYoY: number;
  inventoryLevel: 'low' | 'moderate' | 'high';
  marketTrend: 'buyers' | 'sellers' | 'balanced';
}

export interface NeighborhoodData {
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
  crimeRate?: 'low' | 'moderate' | 'high';
  schoolRating?: number;
  nearbyAmenities: string[];
}

// ===========================================
// Analysis Types
// ===========================================

export interface PropertyScores {
  investment: number;      // 0-100
  location: number;        // 0-100
  condition: number;       // 0-100
  marketTiming: number;    // 0-100
  overall: number;         // 0-100
}

export interface PropertyAnalysis {
  id: string;
  address: PropertyAddress;
  details: PropertyDetails;
  valuation: PropertyValuation;
  marketData: MarketData;
  neighborhood: NeighborhoodData;
  scores: PropertyScores;
  pros: string[];
  cons: string[];
  recommendations: string[];
  aiSummary: string;
  sources: DataSource[];
  analyzedAt: Date;
  cached: boolean;
}

export interface DataSource {
  name: string;
  url?: string;
  dataType: 'listing' | 'valuation' | 'market' | 'neighborhood' | 'general';
  retrievedAt: Date;
}

// ===========================================
// Search Provider Types
// ===========================================

export interface SearchQuery {
  address: string;
  includeComps?: boolean;
  includeMarketData?: boolean;
  includeNeighborhood?: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  source: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  searchedAt: Date;
}

// ===========================================
// API Types
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===========================================
// User Types
// ===========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// ===========================================
// Lead/CRM Types
// ===========================================

export interface Lead {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: PropertyAddress;
  status: LeadStatus;
  source?: string;
  notes?: string;
  propertyInterest?: string;
  budget?: {
    min: number;
    max: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastContactAt?: Date;
}

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed-won'
  | 'closed-lost';

export interface Task {
  id: string;
  userId: string;
  leadId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}

// ===========================================
// Cache Types
// ===========================================

export interface CacheEntry<T> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
  hitCount: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}
