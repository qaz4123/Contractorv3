# System Reliability Audit - Execution Guide

## Quick Start

```bash
# 1. Navigate to server directory
cd server

# 2. Ensure dependencies are installed
npm install

# 3. Set up environment variables (API keys required)
cp .env.example .env
# Edit .env with your TAVILY_API_KEY and GEMINI_API_KEY

# 4. Run the audit
npm run audit:reliability
```

## Prerequisites

### Required Environment Variables

```bash
# .env file must contain:
TAVILY_API_KEY=tvly-xxxxx...     # Required for search tests
GEMINI_API_KEY=AIzaSy...         # Required for AI tests
```

### System Requirements

- Node.js >= 18.x
- npm >= 9.x
- TypeScript >= 5.x
- Internet connection (for API calls)

## Running the Audit

### Method 1: NPM Script (Recommended)

```bash
cd server
npm run audit:reliability
```

### Method 2: Direct TypeScript Execution

```bash
cd server
npx tsx src/reliability-audit/run-audit.ts
```

### Method 3: Node.js Runner

```bash
cd server
node run-reliability-audit.js
```

## Understanding the Output

### 1. Test Execution Phase

```
🔍 SYSTEM RELIABILITY AUDIT
═══════════════════════════════════════════════════════════════
Test Address: 123 Main St, San Francisco, CA 94102
Runs per test: 10
═══════════════════════════════════════════════════════════════

🔍 Starting reliability test: Property Search Reliability
📊 Running 10 iterations...

  ✓ Run 1/10 completed in 2453ms
  ✓ Run 2/10 completed in 2401ms
  ✓ Run 3/10 completed in 2389ms
  ...
```

**What This Means**:
- Each run executes the same test with identical inputs
- Execution times are tracked for performance analysis
- All runs should complete successfully

### 2. Test Result Summary

```
═══════════════════════════════════════════════════════════════
📋 Test: Property Search Reliability
═══════════════════════════════════════════════════════════════
✅ PASSED - All outputs identical and consistent

📊 Metrics:
  Runs completed: 10
  Identical outputs: 10/10
  Avg execution time: 2420.50ms
  Min/Max time: 2389ms / 2453ms
  Score variance: 0.0000
═══════════════════════════════════════════════════════════════
```

**What to Look For**:

✅ **PASSED** - Test is reliable
- `Identical outputs: 10/10` - Perfect consistency
- `Score variance: 0.0000` - No variation

❌ **FAILED** - Test has issues
- `Identical outputs: 7/10` - 3 runs differ
- `Score variance: 15.234` - High variation

### 3. Issue Detection

```
🐛 Issues found (2):
  🔴 [CRITICAL] Score Variance: Score "investment" varies between runs: 75 vs 82
  🟠 [MAJOR] Array Length Variance: "pros" array length varies: 3 vs 5
```

**Severity Levels**:

🔴 **CRITICAL** - Breaks reliability guarantees
- Immediate action required
- System is unreliable until fixed

🟠 **MAJOR** - Data inconsistency
- Should be fixed soon
- May impact user experience

🟡 **MINOR** - Normalization issue
- Low priority
- Usually cosmetic

### 4. Final Report

```
████████████████████████████████████████████████████████████████████████████████
█                                                                              █
█                     SYSTEM RELIABILITY AUDIT REPORT                          █
█                                                                              █
████████████████████████████████████████████████████████████████████████████████

📊 SUMMARY
────────────────────────────────────────────────────────────────────────────────
Total Tests:          4
Passed Tests:         4 ✅
Failed Tests:         0 ❌
Overall Reliability:  100.00%
```

**Interpreting Reliability Score**:

- **100%** - 🎉 Perfect! System is fully reliable
- **90-99%** - ✅ Excellent, minor issues only
- **70-89%** - ⚠️ Good, but needs improvement
- **<70%** - ❌ Needs significant work

## Test Descriptions

### Test 1: Property Search Reliability

**What It Tests**:
- Property analysis with web search
- AI scoring consistency
- Data enrichment stability

**Expected Behavior**:
- Same address → Same normalized components
- Same property details (beds, baths, sqft)
- Same scores (investment, location, condition, timing)
- Same pros/cons/recommendations
- Same valuation and market data

**Common Failures**:
- AI temperature > 0 (non-deterministic)
- Missing API keys
- Network timeout issues

### Test 2: Lead Intelligence Reliability

**What It Tests**:
- Lead scoring consistency
- Business intelligence stability
- Renovation opportunity analysis

**Expected Behavior**:
- Same address → Same lead score
- Same renovation potential rating
- Same owner motivation assessment
- Same financial indicators

**Common Failures**:
- Non-deterministic AI responses
- Variable search results
- Incomplete data extraction

### Test 3: Search Provider Reliability

**What It Tests**:
- Tavily search API consistency
- Result ordering and content
- Error handling

**Expected Behavior**:
- Same query → Same number of results
- Same sources returned
- No intermittent failures

**Common Failures**:
- API rate limiting
- Network issues
- Search result ranking changes

### Test 4: AI Provider Reliability

**What It Tests**:
- Gemini AI determinism
- Response parsing stability
- Field completeness

**Expected Behavior**:
- Same input → Identical scores
- All required fields present
- No fallback values

**Common Failures**:
- Temperature > 0
- Fallback score usage
- Parsing errors

## Interpreting Results

### ✅ Perfect Pass

```
Overall Reliability:  100.00%
Identical outputs: 10/10
Score variance: 0.0000
Issues: 0
```

**Action**: None needed! System is reliable.

### ⚠️ Minor Issues

```
Overall Reliability:  90.00%
Identical outputs: 9/10
Score variance: 0.0000
Issues: 1 MINOR
```

**Action**: 
1. Review minor issue
2. Fix if time permits
3. Monitor for pattern

### ❌ Major Issues

```
Overall Reliability:  70.00%
Identical outputs: 7/10
Score variance: 12.5
Issues: 2 CRITICAL, 3 MAJOR
```

**Action**:
1. ⚠️ DO NOT DEPLOY
2. Review all critical issues
3. Fix determinism problems
4. Re-run audit
5. Achieve 90%+ before deploying

## Common Issues and Fixes

### Issue: "Invalid score value: undefined"

**Cause**: AI response missing required score field

**Fix**:
1. Check AI prompt in `GeminiProvider.buildAnalysisPrompt()`
2. Verify response format
3. Update parsing logic if needed

```typescript
// Ensure all scores are requested in prompt
"scores": {
  "investment": <number 0-100>,
  "location": <number 0-100>,
  "condition": <number 0-100>,
  "marketTiming": <number 0-100>,
  "overall": <number 0-100>
}
```

### Issue: Score variance > 0

**Cause**: AI temperature not set to 0

**Fix**:
1. Verify `GeminiProvider` constructor:
```typescript
generationConfig: {
  temperature: 0,  // Must be 0
  topP: 1,
  topK: 1
}
```

2. Rebuild and re-run:
```bash
npm run build
npm run audit:reliability
```

### Issue: "Tavily API key not configured"

**Cause**: Missing environment variable

**Fix**:
1. Add to `.env` file:
```bash
TAVILY_API_KEY=tvly-xxxxx...
```

2. Restart audit

### Issue: "Gemini API error: 429 - Rate limit exceeded"

**Cause**: Too many API calls

**Fix**:
1. Wait 60 seconds
2. Re-run audit
3. Consider reducing TEST_RUNS in `run-audit.ts`

### Issue: Network timeout

**Cause**: Slow internet or API issues

**Fix**:
1. Check internet connection
2. Try again in a few minutes
3. Check API status pages

## Advanced Usage

### Custom Test Configuration

Edit `src/reliability-audit/run-audit.ts`:

```typescript
// Change number of runs (default: 10)
const TEST_RUNS = 5;  // Faster testing

// Change test address
const TEST_ADDRESS = 'Your Custom Address';
```

### Running Specific Tests

Modify `run-audit.ts` to comment out tests:

```typescript
// await auditor.runTest({ /* Test 1 */ });  // Skip this test
await auditor.runTest({ /* Test 2 */ });     // Run only this
```

### Analyzing JSON Report

The audit exports detailed JSON to `/tmp/reliability-audit-report.json`:

```bash
# View entire report
cat /tmp/reliability-audit-report.json | jq

# View only critical issues
cat /tmp/reliability-audit-report.json | jq '.criticalIssues'

# View metrics for specific test
cat /tmp/reliability-audit-report.json | jq '.results[0].metrics'
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Reliability Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd server && npm install
      
      - name: Run reliability audit
        env:
          TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: cd server && npm run audit:reliability
      
      - name: Upload audit report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: reliability-report
          path: /tmp/reliability-audit-report.json
```

### GitLab CI

```yaml
reliability_audit:
  stage: test
  script:
    - cd server
    - npm install
    - npm run audit:reliability
  artifacts:
    paths:
      - /tmp/reliability-audit-report.json
    when: always
  only:
    - merge_requests
    - main
```

## Troubleshooting

### Audit Hangs or Freezes

**Possible Causes**:
- Network timeout
- API rate limit
- Infinite loop in code

**Fix**:
1. Press `Ctrl+C` to stop
2. Check logs for error messages
3. Verify API keys are valid
4. Check network connection

### Inconsistent Results Between Runs

**Possible Causes**:
- Cache not cleared between runs
- External API changes
- Non-deterministic code

**Fix**:
1. Clear cache manually
2. Review code for random behaviors
3. Check AI temperature setting

### Out of Memory Error

**Possible Causes**:
- Too many test runs
- Memory leak in code

**Fix**:
1. Reduce TEST_RUNS to 5
2. Run with more memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run audit:reliability`

## Best Practices

### Before Running Audit

1. ✅ Ensure all code is committed
2. ✅ Review recent changes
3. ✅ Check API keys are valid
4. ✅ Clear any caches

### After Running Audit

1. ✅ Review all issues found
2. ✅ Fix critical issues immediately
3. ✅ Document any known issues
4. ✅ Re-run after fixes

### Regular Maintenance

- **Daily**: Quick smoke test (5 runs)
- **Weekly**: Full audit (10 runs)
- **Pre-deployment**: Always run full audit
- **Post-hotfix**: Run immediately

## Support

### Getting Help

1. Review this guide thoroughly
2. Check `RELIABILITY_AUDIT.md` for technical details
3. Check `RELIABILITY_SUMMARY.md` for implementation overview
4. Review recent commits for changes
5. Contact development team

### Reporting Issues

When reporting audit failures, include:

1. Full console output
2. `/tmp/reliability-audit-report.json` file
3. Environment details (Node version, OS)
4. Steps to reproduce
5. Recent code changes

---

**Last Updated**: December 7, 2024
**Version**: 1.0.0
**Maintained by**: Development Team
