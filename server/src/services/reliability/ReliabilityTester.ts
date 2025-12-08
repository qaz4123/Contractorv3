/**
 * Reliability Testing Service
 * Tests consistency and reliability of contractor search and AI operations
 */

interface TestResult {
  iteration: number;
  timestamp: Date;
  data: any;
  responseTime: number;
  success: boolean;
  error?: string;
}

interface ComparisonResult {
  field: string;
  values: any[];
  isConsistent: boolean;
  variance: number;
  variancePercentage: number;
}

interface Anomaly {
  type: 'inconsistency' | 'performance' | 'error' | 'data_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedIterations: number[];
  details: any;
}

interface ReliabilityReport {
  testName: string;
  query: any;
  totalIterations: number;
  successfulIterations: number;
  failedIterations: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  consistencyScore: number; // 0-100
  anomalies: Anomaly[];
  comparisonResults: ComparisonResult[];
  timestamp: Date;
  recommendation: string;
}

/**
 * Reliability Tester
 * Runs repeated tests and analyzes consistency
 */
export class ReliabilityTester {
  private results: Map<string, TestResult[]> = new Map();
  private anomalyLog: Anomaly[] = [];

  /**
   * Run reliability test
   * Executes the same operation multiple times and compares results
   */
  async runReliabilityTest(
    testName: string,
    operation: () => Promise<any>,
    iterations: number = 10,
    delayMs: number = 1000
  ): Promise<ReliabilityReport> {
    console.log(`🧪 Starting reliability test: ${testName} (${iterations} iterations)`);
    
    const results: TestResult[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        const data = await operation();
        const responseTime = Date.now() - startTime;

        results.push({
          iteration: i + 1,
          timestamp: new Date(),
          data,
          responseTime,
          success: true,
        });

        console.log(`✓ Iteration ${i + 1}/${iterations} completed in ${responseTime}ms`);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        results.push({
          iteration: i + 1,
          timestamp: new Date(),
          data: null,
          responseTime,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });

        console.log(`✗ Iteration ${i + 1}/${iterations} failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Delay between iterations
      if (i < iterations - 1) {
        await this.delay(delayMs);
      }
    }

    // Store results
    this.results.set(testName, results);

    // Analyze results
    return this.analyzeResults(testName, results);
  }

  /**
   * Compare signals across multiple test runs
   * Identifies variations in repeated operations
   */
  compareSignals(testName: string, fieldsToCompare: string[]): ComparisonResult[] {
    const results = this.results.get(testName);
    
    if (!results || results.length === 0) {
      throw new Error(`No results found for test: ${testName}`);
    }

    const successfulResults = results.filter(r => r.success);
    const comparisonResults: ComparisonResult[] = [];

    for (const field of fieldsToCompare) {
      const values = successfulResults.map(r => this.getNestedValue(r.data, field));
      const comparison = this.analyzeFieldConsistency(field, values);
      comparisonResults.push(comparison);
    }

    return comparisonResults;
  }

  /**
   * Log anomalies detected during testing
   */
  logAnomalies(
    testName: string,
    type: Anomaly['type'],
    severity: Anomaly['severity'],
    description: string,
    affectedIterations: number[],
    details?: any
  ): void {
    const anomaly: Anomaly = {
      type,
      severity,
      description,
      affectedIterations,
      details: details || {},
    };

    this.anomalyLog.push(anomaly);

    const emoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🔵';
    console.log(`${emoji} Anomaly detected in ${testName}: ${description}`);
  }

  /**
   * Get all logged anomalies
   */
  getAnomalies(): Anomaly[] {
    return [...this.anomalyLog];
  }

  /**
   * Clear anomaly log
   */
  clearAnomalies(): void {
    this.anomalyLog = [];
  }

  /**
   * Analyze test results and generate report
   */
  private analyzeResults(testName: string, results: TestResult[]): ReliabilityReport {
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    // Calculate response time statistics
    const responseTimes = successfulResults.map(r => r.responseTime);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    // Detect performance anomalies
    if (maxResponseTime > avgResponseTime * 2) {
      this.logAnomalies(
        testName,
        'performance',
        'high',
        `Response time spike detected: ${maxResponseTime}ms (avg: ${avgResponseTime.toFixed(0)}ms)`,
        results.filter(r => r.responseTime > avgResponseTime * 2).map(r => r.iteration)
      );
    }

    // Compare key fields for consistency
    const fieldsToCompare = this.identifyCommonFields(successfulResults);
    const comparisonResults = fieldsToCompare.length > 0
      ? this.compareSignals(testName, fieldsToCompare)
      : [];

    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(comparisonResults, successfulResults.length, results.length);

    // Flag inconsistent fields
    comparisonResults
      .filter(cr => !cr.isConsistent && cr.variancePercentage > 10)
      .forEach(cr => {
        this.logAnomalies(
          testName,
          'inconsistency',
          cr.variancePercentage > 30 ? 'high' : 'medium',
          `Field "${cr.field}" shows ${cr.variancePercentage.toFixed(1)}% variance`,
          [],
          { field: cr.field, values: cr.values }
        );
      });

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      consistencyScore,
      successfulResults.length,
      results.length,
      comparisonResults
    );

    return {
      testName,
      query: successfulResults[0]?.data || {},
      totalIterations: results.length,
      successfulIterations: successfulResults.length,
      failedIterations: failedResults.length,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime,
      maxResponseTime,
      consistencyScore,
      anomalies: this.getAnomalies(),
      comparisonResults,
      timestamp: new Date(),
      recommendation,
    };
  }

  /**
   * Analyze consistency of a field across results
   */
  private analyzeFieldConsistency(field: string, values: any[]): ComparisonResult {
    // Guard clause for empty arrays
    if (values.length === 0) {
      return {
        field,
        values: [],
        isConsistent: true,
        variance: 0,
        variancePercentage: 0,
      };
    }

    // For numeric values, calculate statistical variance
    // Additional safety check even though we already validated length > 0
    if (values.length > 0 && typeof values[0] === 'number') {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const variancePercentage = mean !== 0 ? (stdDev / mean) * 100 : 0;

      return {
        field,
        values,
        isConsistent: variancePercentage < 5, // Less than 5% variance is consistent
        variance: Math.round(variance * 100) / 100,
        variancePercentage: Math.round(variancePercentage * 100) / 100,
      };
    }

    // For non-numeric values, check if all are identical
    const uniqueValues = [...new Set(values.map(v => JSON.stringify(v)))];
    const isConsistent = uniqueValues.length === 1;
    const variancePercentage = ((uniqueValues.length - 1) / values.length) * 100;

    return {
      field,
      values,
      isConsistent,
      variance: uniqueValues.length,
      variancePercentage: Math.round(variancePercentage * 100) / 100,
    };
  }

  /**
   * Calculate overall consistency score
   */
  private calculateConsistencyScore(
    comparisonResults: ComparisonResult[],
    successfulCount: number,
    totalCount: number
  ): number {
    if (successfulCount === 0) return 0;

    // Base score on success rate
    const successRate = (successfulCount / totalCount) * 100;
    
    if (comparisonResults.length === 0) {
      return Math.round(successRate);
    }

    // Factor in field consistency
    const consistentFields = comparisonResults.filter(cr => cr.isConsistent).length;
    const fieldConsistencyRate = (consistentFields / comparisonResults.length) * 100;

    // Average of success rate and field consistency
    const score = (successRate + fieldConsistencyRate) / 2;

    return Math.round(score);
  }

  /**
   * Identify common fields across all results
   */
  private identifyCommonFields(results: TestResult[]): string[] {
    if (results.length === 0) return [];

    const firstData = results[0].data;
    if (!firstData || typeof firstData !== 'object') return [];

    // Get top-level keys that are present in all results
    const commonKeys = Object.keys(firstData).filter(key => {
      return results.every(r => r.data && key in r.data);
    });

    // Focus on numeric and string fields for comparison
    return commonKeys.filter(key => {
      const value = firstData[key];
      return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean';
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate recommendation based on test results
   */
  private generateRecommendation(
    consistencyScore: number,
    successfulCount: number,
    totalCount: number,
    comparisonResults: ComparisonResult[]
  ): string {
    if (successfulCount === 0) {
      return '🔴 CRITICAL: All operations failed. System is not functional.';
    }

    if (successfulCount < totalCount * 0.9) {
      return `🔴 HIGH PRIORITY: Only ${successfulCount}/${totalCount} operations succeeded. Investigate failures immediately.`;
    }

    if (consistencyScore < 70) {
      const inconsistentFields = comparisonResults.filter(cr => !cr.isConsistent);
      return `🟠 ATTENTION: Consistency score is ${consistencyScore}/100. Inconsistent fields: ${inconsistentFields.map(f => f.field).join(', ')}. Review algorithm determinism.`;
    }

    if (consistencyScore < 85) {
      return `🟡 MONITOR: Consistency score is ${consistencyScore}/100. Some variations detected. Continue monitoring.`;
    }

    return `✅ EXCELLENT: Consistency score is ${consistencyScore}/100. System is performing reliably.`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export results as JSON
   */
  exportResults(testName: string): string {
    const results = this.results.get(testName);
    if (!results) {
      throw new Error(`No results found for test: ${testName}`);
    }

    return JSON.stringify(results, null, 2);
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results.clear();
    this.clearAnomalies();
  }
}

// Export singleton instance
export const reliabilityTester = new ReliabilityTester();

// Export types
export type { TestResult, ComparisonResult, Anomaly, ReliabilityReport };
