# System Reliability Audit

## Overview

This document describes the comprehensive reliability audit system implemented to ensure deterministic, consistent, and reliable behavior across the entire Contractorv3 application.

## Purpose

The reliability audit validates that:

1. **Search operations** return consistent results
2. **API endpoints** behave deterministically
3. **Middleware functions** execute consistently
4. **Data enrichment** produces stable values
5. **Scoring engine** returns predictable scores
6. **All required fields** are present in responses

## Running the Audit

### Quick Start

```bash
cd server
npm run audit:reliability
```

### Manual Execution

```bash
cd server
npx tsx src/reliability-audit/run-audit.ts
```

## Reliability Improvements Implemented

### 1. Deterministic AI Responses

**Problem**: Gemini AI was using default temperature settings, leading to non-deterministic responses.

**Solution**: 
- Set `temperature: 0` for completely deterministic AI responses
- Set `topP: 1` and `topK: 1` for consistent token selection
- Configured in `GeminiProvider` constructor

```typescript
generationConfig: {
  temperature: 0,  // Deterministic responses
  topP: 1,
  topK: 1,
  maxOutputTokens: 8192,
}
```

### 2. Removed Fallback Scores

**Problem**: System returned fallback `50/50/50/50` scores when AI parsing failed, masking errors.

**Solution**:
- Modified `clampScore()` to throw errors instead of returning default `50`
- Modified `getFallbackResponse()` to throw errors instead of returning fallback data
- System now fails fast with clear error messages

**Before**:
```typescript
private clampScore(score: unknown): number {
  if (typeof score !== 'number' || isNaN(score)) {
    return 50; // Default score - UNRELIABLE
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

**After**:
```typescript
private clampScore(score: unknown): number {
  if (typeof score !== 'number' || isNaN(score)) {
    throw new Error(`Invalid score value: ${score}`);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

### 3. Comprehensive Result Validation

**Added**: `ResultValidator` class to validate all response fields

- Validates presence of required fields
- Validates field types and ranges
- Detects suspicious patterns (e.g., all scores = 50)
- Provides detailed validation reports

### 4. Reliability Auditor Framework

**Added**: `ReliabilityAuditor` class for automated testing

Features:
- Runs tests 10 times (configurable)
- Compares outputs for identity
- Calculates variance metrics
- Identifies missing/inconsistent fields
- Generates comprehensive audit reports

## Audit Tests

### Test 1: Property Search Reliability

Validates that property search returns identical results across 10 runs:

- Same address normalization
- Same parcel/APN data
- Same owner information
- Same property details
- Same market valuation
- Same scoring

### Test 2: Lead Intelligence Reliability

Validates lead intelligence consistency:

- Same lead scores
- Same renovation potential ratings
- Same owner motivation assessments
- Same profit potential calculations
- Same renovation opportunities

### Test 3: Search Provider Reliability

Validates Tavily search consistency:

- Same number of results
- Same sources
- Same content quality
- No intermittent failures

### Test 4: AI Provider Reliability

Validates Gemini AI consistency:

- Same scores for identical inputs
- No fallback responses
- No missing fields
- Deterministic behavior

## Success Criteria

The system passes the reliability audit if:

- ✅ **10/10 runs** produce identical outputs (excluding timestamps/IDs)
- ✅ **No missing fields** in any response
- ✅ **No scoring variation** between runs
- ✅ **No fallback values** (50/50/50/50 scores)
- ✅ **No inconsistent enrichment data**
- ✅ **No transient errors**

## Audit Report Format

The audit generates a comprehensive report including:

### Summary
- Total tests run
- Tests passed/failed
- Overall reliability percentage

### Issues by Severity

**CRITICAL** - Breaks reliability guarantees:
- Missing required fields
- Non-deterministic scoring
- Fallback value usage
- API failures

**MAJOR** - Inconsistent data:
- Data variance between runs
- Missing optional fields in some runs
- Numeric value fluctuations

**MINOR** - Normalization issues:
- Minor formatting differences
- Timestamp variations (expected)

## Required Fields Validation

### Property Analysis Response

Required fields:
- `address` (street, city, state, zipCode, fullAddress)
- `scores` (investment, location, condition, marketTiming, overall)
- `details` (bedrooms, bathrooms, squareFeet, yearBuilt, propertyType)
- `valuation` (estimatedValue, priceRange, pricePerSqFt, lastSoldPrice, lastSoldDate)
- `marketData` (medianHomePrice, avgDaysOnMarket, priceChangeYoY, inventoryLevel, marketTrend)
- `neighborhood` (walkScore, transitScore, bikeScore, crimeRate, schoolRating, nearbyAmenities)
- `pros` (array)
- `cons` (array)
- `recommendations` (array)
- `aiSummary` (string)
- `sources` (array)

### Lead Intelligence Response

Required fields:
- `leadScore` (0-100)
- `renovationPotential` (LOW|MEDIUM|HIGH|EXCELLENT)
- `ownerMotivation` (LOW|MEDIUM|HIGH|VERY_HIGH)
- `profitPotential` (number)
- `propertyIntel` (object)
- `ownerIntel` (object)
- `financialIntel` (object)
- `permitHistory` (object)
- `renovationOpps` (array)
- `salesApproach` (object)

## Troubleshooting

### High Variance in Scores

**Cause**: AI temperature > 0 or non-deterministic input

**Fix**: Verify `temperature: 0` in GeminiProvider config

### Missing Fields

**Cause**: AI parsing failure or incomplete API responses

**Fix**: Check AI prompt structure and response parsing logic

### Fallback Scores (50/50/50/50)

**Cause**: Should no longer occur - indicates code regression

**Fix**: Review GeminiProvider changes - fallback should throw error

### Intermittent Failures

**Cause**: API rate limits, network issues, or non-deterministic code

**Fix**: 
- Check API rate limits
- Verify retry logic
- Review async operations for race conditions

## Performance Metrics

The audit tracks:
- **Execution time** per test run
- **Average, min, max** execution times
- **Score variance** across runs
- **Field completeness** percentage
- **Success rate** over time

## Maintenance

### Adding New Tests

1. Create test in `src/reliability-audit/run-audit.ts`
2. Define `execute()` function
3. Define `validate()` function
4. Add to audit runner

### Updating Validation Rules

Edit `src/reliability-audit/ResultValidator.ts` to:
- Add new required fields
- Modify validation logic
- Update warning thresholds

## Best Practices

1. **Run audit before production deployment**
2. **Investigate any failures immediately**
3. **Never merge code that reduces reliability score**
4. **Document any intentional non-deterministic behavior**
5. **Keep audit tests updated with feature changes**

## Integration

### CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Reliability Audit
  run: |
    cd server
    npm run audit:reliability
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
cd server && npm run audit:reliability || exit 1
```

## Architecture

```
reliability-audit/
├── ReliabilityAuditor.ts   # Core audit framework
├── ResultValidator.ts       # Field validation logic
└── run-audit.ts            # Test definitions and runner
```

## Metrics Dashboard

View audit results:

```bash
cat /tmp/reliability-audit-report.json | jq
```

## Support

For issues or questions about the reliability audit system:

1. Review this documentation
2. Check audit report for specific failures
3. Review git history for recent changes
4. Consult development team

---

**Last Updated**: 2024-12-07
**Version**: 1.0.0
**Maintained by**: Development Team
