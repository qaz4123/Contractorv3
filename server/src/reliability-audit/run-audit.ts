/**
 * Run comprehensive system reliability audit
 * Tests property search, scoring, and API reliability
 */

import { ReliabilityAuditor, AuditIssue } from './ReliabilityAuditor';
import { PropertyAnalyzerService } from '../services/PropertyAnalyzer';
import { LeadIntelligenceService } from '../services/leads/LeadIntelligenceService';
import { TavilyProvider } from '../services/search/TavilyProvider';
import { GeminiProvider } from '../services/ai/GeminiProvider';

// Test configuration
const TEST_RUNS = 10;
const TEST_ADDRESS = '123 Main St, San Francisco, CA 94102';

/**
 * Validate required fields are present
 */
function validateRequiredFields(result: any): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const requiredFields = [
    'address',
    'scores',
    'details',
    'valuation',
    'marketData',
    'neighborhood',
    'pros',
    'cons',
    'recommendations',
    'aiSummary',
    'sources',
  ];

  requiredFields.forEach(field => {
    if (!result || !(field in result)) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Missing Field',
        description: `Required field "${field}" is missing`,
      });
    }
  });

  // Validate scores
  if (result?.scores) {
    const requiredScores = ['investment', 'location', 'condition', 'marketTiming', 'overall'];
    requiredScores.forEach(score => {
      if (!(score in result.scores)) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Missing Score',
          description: `Required score "${score}" is missing`,
        });
      } else {
        const value = result.scores[score];
        if (typeof value !== 'number' || isNaN(value)) {
          issues.push({
            severity: 'CRITICAL',
            category: 'Invalid Score',
            description: `Score "${score}" is not a valid number: ${value}`,
          });
        }
        // Check for fallback scores
        if (value === 50) {
          issues.push({
            severity: 'MAJOR',
            category: 'Fallback Score',
            description: `Score "${score}" appears to be a fallback value (50)`,
          });
        }
      }
    });

    // Check if all scores are 50 (fallback pattern)
    const allScores = requiredScores.map(s => result.scores[s]);
    if (allScores.every((s: number) => s === 50)) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Fallback Scoring',
        description: 'All scores are 50 - indicates fallback scoring pattern',
      });
    }
  }

  return issues;
}

/**
 * Validate consistency between runs
 */
function validateConsistency(results: any[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (results.length < 2) return issues;

  // Compare each result with the first one
  const firstResult = results[0];

  for (let i = 1; i < results.length; i++) {
    const currentResult = results[i];

    // Compare scores
    if (firstResult.scores && currentResult.scores) {
      Object.keys(firstResult.scores).forEach(key => {
        if (firstResult.scores[key] !== currentResult.scores[key]) {
          issues.push({
            severity: 'CRITICAL',
            category: 'Score Variance',
            description: `Score "${key}" varies between runs: ${firstResult.scores[key]} vs ${currentResult.scores[key]}`,
            runNumber: i + 1,
            expectedValue: firstResult.scores[key],
            actualValue: currentResult.scores[key],
          });
        }
      });
    }

    // Compare arrays
    ['pros', 'cons', 'recommendations'].forEach(arrayField => {
      const first = firstResult[arrayField];
      const current = currentResult[arrayField];

      if (Array.isArray(first) && Array.isArray(current)) {
        if (first.length !== current.length) {
          issues.push({
            severity: 'MAJOR',
            category: 'Array Length Variance',
            description: `"${arrayField}" array length varies: ${first.length} vs ${current.length}`,
            runNumber: i + 1,
          });
        }
      }
    });

    // Compare nested objects
    ['details', 'valuation', 'marketData', 'neighborhood'].forEach(objField => {
      const first = firstResult[objField];
      const current = currentResult[objField];

      if (first && current && typeof first === 'object' && typeof current === 'object') {
        Object.keys(first).forEach(key => {
          if (first[key] !== current[key] && first[key] !== null && current[key] !== null) {
            // Allow some tolerance for numeric values
            if (typeof first[key] === 'number' && typeof current[key] === 'number') {
              const diff = Math.abs(first[key] - current[key]);
              const avgValue = (first[key] + current[key]) / 2;
              const percentDiff = avgValue !== 0 ? (diff / avgValue) * 100 : 0;

              if (percentDiff > 0.1) {  // More than 0.1% difference
                issues.push({
                  severity: 'MAJOR',
                  category: 'Numeric Variance',
                  description: `"${objField}.${key}" varies by ${percentDiff.toFixed(2)}%: ${first[key]} vs ${current[key]}`,
                  runNumber: i + 1,
                });
              }
            } else if (first[key] !== current[key]) {
              issues.push({
                severity: 'MAJOR',
                category: 'Data Inconsistency',
                description: `"${objField}.${key}" varies: ${first[key]} vs ${current[key]}`,
                runNumber: i + 1,
              });
            }
          }
        });
      }
    });
  }

  return issues;
}

/**
 * Main audit runner
 */
async function runAudit() {
  console.log('🔍 SYSTEM RELIABILITY AUDIT');
  console.log('═'.repeat(80));
  console.log(`Test Address: ${TEST_ADDRESS}`);
  console.log(`Runs per test: ${TEST_RUNS}`);
  console.log('═'.repeat(80) + '\n');

  const auditor = new ReliabilityAuditor();

  // Test 1: Property Search Reliability
  await auditor.runTest({
    name: 'Property Search Reliability',
    runs: TEST_RUNS,
    execute: async () => {
      const analyzer = new PropertyAnalyzerService(
        process.env.TAVILY_API_KEY,
        process.env.GEMINI_API_KEY,
        { ttlMinutes: 0 }  // Disable cache for testing
      );

      const result = await analyzer.analyzeProperty({
        address: TEST_ADDRESS,
        skipCache: true,
      });

      return result;
    },
    validate: (results) => {
      const issues: AuditIssue[] = [];

      // Validate each result has required fields
      results.forEach((result, idx) => {
        const fieldIssues = validateRequiredFields(result);
        fieldIssues.forEach(issue => {
          issues.push({ ...issue, runNumber: idx + 1 });
        });
      });

      // Validate consistency across runs
      const consistencyIssues = validateConsistency(results);
      issues.push(...consistencyIssues);

      return issues;
    },
  });

  // Test 2: Lead Intelligence Reliability
  await auditor.runTest({
    name: 'Lead Intelligence Reliability',
    runs: TEST_RUNS,
    execute: async () => {
      const leadIntel = new LeadIntelligenceService();
      const result = await leadIntel.generateLeadIntelligence(TEST_ADDRESS);
      return result;
    },
    validate: (results) => {
      const issues: AuditIssue[] = [];

      // Check for consistency
      results.forEach((result, idx) => {
        if (!result || !result.leadScore) {
          issues.push({
            severity: 'CRITICAL',
            category: 'Missing Data',
            description: 'Lead intelligence missing critical fields',
            runNumber: idx + 1,
          });
        }

        // Check for fallback values
        if (result.leadScore === 50 && result.renovationPotential === 'MEDIUM' && result.ownerMotivation === 'MEDIUM') {
          issues.push({
            severity: 'MAJOR',
            category: 'Fallback Pattern',
            description: 'Lead intelligence appears to use fallback values',
            runNumber: idx + 1,
          });
        }
      });

      // Check consistency across runs
      const scores = results.map(r => r?.leadScore).filter(s => s !== undefined);
      const uniqueScores = new Set(scores);
      if (uniqueScores.size > 1) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Score Variance',
          description: `Lead scores vary across runs: ${Array.from(uniqueScores).join(', ')}`,
        });
      }

      return issues;
    },
  });

  // Test 3: Search Provider Reliability
  await auditor.runTest({
    name: 'Search Provider Reliability',
    runs: TEST_RUNS,
    execute: async () => {
      const tavily = new TavilyProvider(process.env.TAVILY_API_KEY);
      const result = await tavily.searchPropertyListings(TEST_ADDRESS);
      return result;
    },
    validate: (results) => {
      const issues: AuditIssue[] = [];

      results.forEach((result, idx) => {
        if (!result || !result.results || result.results.length === 0) {
          issues.push({
            severity: 'CRITICAL',
            category: 'Empty Results',
            description: 'Search returned no results',
            runNumber: idx + 1,
          });
        }
      });

      // Check if result counts are consistent
      const counts = results.map(r => r?.results?.length || 0);
      const uniqueCounts = new Set(counts);
      if (uniqueCounts.size > 1) {
        issues.push({
          severity: 'MINOR',
          category: 'Result Count Variance',
          description: `Search result counts vary: ${Array.from(uniqueCounts).join(', ')}`,
        });
      }

      return issues;
    },
  });

  // Test 4: AI Provider Reliability
  await auditor.runTest({
    name: 'AI Provider Reliability',
    runs: TEST_RUNS,
    execute: async () => {
      const gemini = new GeminiProvider(process.env.GEMINI_API_KEY);
      
      // Use a fixed search result for consistent input
      const mockSearchResults = [
        {
          title: 'Test Property',
          url: 'https://example.com',
          content: 'Test property at 123 Main St',
          source: 'test.com',
        },
      ];

      const result = await gemini.analyzeProperty({
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        searchResults: mockSearchResults,
      });

      return result;
    },
    validate: (results) => {
      const issues: AuditIssue[] = [];

      results.forEach((result, idx) => {
        if (!result || !result.scores) {
          issues.push({
            severity: 'CRITICAL',
            category: 'Missing Scores',
            description: 'AI analysis missing scores',
            runNumber: idx + 1,
          });
          return;
        }

        // Check for fallback scores (all 50s)
        const scores = result.scores;
        const allScores = [scores.investment, scores.location, scores.condition, scores.marketTiming, scores.overall];
        if (allScores.every(s => s === 50)) {
          issues.push({
            severity: 'CRITICAL',
            category: 'Fallback Scores',
            description: 'AI returned all fallback scores (50/50/50/50)',
            runNumber: idx + 1,
          });
        }
      });

      // Check score consistency
      const firstScores = results[0]?.scores;
      if (firstScores) {
        results.slice(1).forEach((result, idx) => {
          const currentScores = result?.scores;
          if (currentScores) {
            Object.keys(firstScores).forEach(key => {
              if (firstScores[key] !== currentScores[key]) {
                issues.push({
                  severity: 'CRITICAL',
                  category: 'AI Non-Determinism',
                  description: `AI scores are not deterministic: ${key} varies from ${firstScores[key]} to ${currentScores[key]}`,
                  runNumber: idx + 2,
                });
              }
            });
          }
        });
      }

      return issues;
    },
  });

  // Generate final report
  console.log('\n');
  auditor.printReport();

  // Export report to file
  const report = auditor.generateReport();
  const reportPath = '/tmp/reliability-audit-report.json';
  const fs = await import('fs/promises');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}\n`);

  // Return exit code based on results
  return report.summary.overallReliability >= 90 ? 0 : 1;
}

// Run audit if executed directly
if (require.main === module) {
  runAudit()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

export { runAudit };
