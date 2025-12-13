/**
 * System Reliability Auditor
 * Validates that the system behaves deterministically and consistently
 */

export interface AuditResult {
  testName: string;
  passed: boolean;
  runsCompleted: number;
  identicalOutputs: number;
  issues: AuditIssue[];
  metrics: AuditMetrics;
  timestamp: Date;
}

export interface AuditIssue {
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  category: string;
  description: string;
  runNumber?: number;
  expectedValue?: any;
  actualValue?: any;
}

export interface AuditMetrics {
  executionTimes: number[];
  avgExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  scoreVariance?: number;
  fieldCompleteness: Record<string, number>;
  missingFields: string[];
}

export interface ReliabilityTest {
  name: string;
  runs: number;
  execute: () => Promise<any>;
  validate: (results: any[]) => AuditIssue[];
}

export class ReliabilityAuditor {
  private results: AuditResult[] = [];

  /**
   * Run a reliability test multiple times and validate consistency
   */
  async runTest(test: ReliabilityTest): Promise<AuditResult> {
    console.log(`\n🔍 Starting reliability test: ${test.name}`);
    console.log(`📊 Running ${test.runs} iterations...\n`);

    const executionTimes: number[] = [];
    const outputs: any[] = [];

    // Execute test multiple times
    for (let i = 0; i < test.runs; i++) {
      const startTime = Date.now();
      try {
        const result = await test.execute();
        const executionTime = Date.now() - startTime;
        
        executionTimes.push(executionTime);
        outputs.push(result);
        
        console.log(`  ✓ Run ${i + 1}/${test.runs} completed in ${executionTime}ms`);
      } catch (error) {
        console.error(`  ✗ Run ${i + 1}/${test.runs} failed:`, error);
        const executionTime = Date.now() - startTime;
        executionTimes.push(executionTime);
        outputs.push({ error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Validate outputs for consistency
    const issues = test.validate(outputs);
    
    // Calculate metrics
    const metrics = this.calculateMetrics(outputs, executionTimes);
    
    // Check if all outputs are identical (deep equality)
    const identicalOutputs = this.countIdenticalOutputs(outputs);
    const passed = identicalOutputs === outputs.length && issues.length === 0;

    const result: AuditResult = {
      testName: test.name,
      passed,
      runsCompleted: outputs.length,
      identicalOutputs,
      issues,
      metrics,
      timestamp: new Date(),
    };

    this.results.push(result);
    this.printTestResult(result);
    
    return result;
  }

  /**
   * Calculate performance and consistency metrics
   */
  private calculateMetrics(outputs: any[], executionTimes: number[]): AuditMetrics {
    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const minExecutionTime = Math.min(...executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);

    // Calculate field completeness
    const fieldCompleteness: Record<string, number> = {};
    const allFields = new Set<string>();
    
    outputs.forEach(output => {
      if (output && typeof output === 'object') {
        this.collectFields(output, '', allFields);
      }
    });

    allFields.forEach(field => {
      let presentCount = 0;
      outputs.forEach(output => {
        if (this.hasField(output, field)) {
          presentCount++;
        }
      });
      fieldCompleteness[field] = (presentCount / outputs.length) * 100;
    });

    // Find missing fields (present in <100% of runs)
    const missingFields = Array.from(allFields).filter(
      field => fieldCompleteness[field] < 100
    );

    // Calculate score variance if scores are present
    const scores = outputs
      .map(o => o?.scores?.overall)
      .filter(s => typeof s === 'number');
    
    const scoreVariance = scores.length > 0 ? this.calculateVariance(scores) : undefined;

    return {
      executionTimes,
      avgExecutionTime,
      minExecutionTime,
      maxExecutionTime,
      scoreVariance,
      fieldCompleteness,
      missingFields,
    };
  }

  /**
   * Collect all fields from nested object
   */
  private collectFields(obj: any, prefix: string, fields: Set<string>): void {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      fields.add(fieldPath);
      
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        this.collectFields(obj[key], fieldPath, fields);
      }
    });
  }

  /**
   * Check if object has field at path
   */
  private hasField(obj: any, path: string): boolean {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    
    return current !== undefined && current !== null;
  }

  /**
   * Calculate variance of numeric array
   */
  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Count how many outputs are identical to the first one
   */
  private countIdenticalOutputs(outputs: any[]): number {
    if (outputs.length === 0) return 0;
    
    const firstOutput = JSON.stringify(this.normalizeForComparison(outputs[0]));
    let identicalCount = 0;

    for (const output of outputs) {
      if (JSON.stringify(this.normalizeForComparison(output)) === firstOutput) {
        identicalCount++;
      }
    }

    return identicalCount;
  }

  /**
   * Normalize output for comparison (remove timestamps, etc.)
   */
  private normalizeForComparison(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.normalizeForComparison(item));
    }

    const normalized: any = {};
    Object.keys(obj).forEach(key => {
      // Skip timestamp fields that naturally vary
      if (['timestamp', 'analyzedAt', 'searchedAt', 'retrievedAt', 'createdAt', 'updatedAt'].includes(key)) {
        return;
      }
      // Skip ID fields that naturally vary
      if (key === 'id' || key.endsWith('Id')) {
        return;
      }
      normalized[key] = this.normalizeForComparison(obj[key]);
    });

    return normalized;
  }

  /**
   * Print test result summary
   */
  private printTestResult(result: AuditResult): void {
    console.log('\n' + '='.repeat(80));
    console.log(`📋 Test: ${result.testName}`);
    console.log('='.repeat(80));
    
    if (result.passed) {
      console.log('✅ PASSED - All outputs identical and consistent');
    } else {
      console.log('❌ FAILED - Inconsistencies detected');
    }

    console.log(`\n📊 Metrics:`);
    console.log(`  Runs completed: ${result.runsCompleted}`);
    console.log(`  Identical outputs: ${result.identicalOutputs}/${result.runsCompleted}`);
    console.log(`  Avg execution time: ${result.metrics.avgExecutionTime.toFixed(2)}ms`);
    console.log(`  Min/Max time: ${result.metrics.minExecutionTime}ms / ${result.metrics.maxExecutionTime}ms`);
    
    if (result.metrics.scoreVariance !== undefined) {
      console.log(`  Score variance: ${result.metrics.scoreVariance.toFixed(4)}`);
    }

    if (result.metrics.missingFields.length > 0) {
      console.log(`\n⚠️  Inconsistent fields (not present in all runs):`);
      result.metrics.missingFields.forEach(field => {
        console.log(`    - ${field}: ${result.metrics.fieldCompleteness[field].toFixed(1)}% present`);
      });
    }

    if (result.issues.length > 0) {
      console.log(`\n🐛 Issues found (${result.issues.length}):`);
      result.issues.forEach((issue, idx) => {
        const icon = issue.severity === 'CRITICAL' ? '🔴' : issue.severity === 'MAJOR' ? '��' : '🟡';
        console.log(`  ${icon} [${issue.severity}] ${issue.category}: ${issue.description}`);
      });
    }

    console.log('='.repeat(80) + '\n');
  }

  /**
   * Generate comprehensive audit report
   */
  generateReport(): {
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      overallReliability: number;
    };
    criticalIssues: AuditIssue[];
    majorIssues: AuditIssue[];
    minorIssues: AuditIssue[];
    results: AuditResult[];
  } {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const overallReliability = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const allIssues = this.results.flatMap(r => r.issues);
    const criticalIssues = allIssues.filter(i => i.severity === 'CRITICAL');
    const majorIssues = allIssues.filter(i => i.severity === 'MAJOR');
    const minorIssues = allIssues.filter(i => i.severity === 'MINOR');

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        overallReliability,
      },
      criticalIssues,
      majorIssues,
      minorIssues,
      results: this.results,
    };
  }

  /**
   * Print comprehensive report
   */
  printReport(): void {
    const report = this.generateReport();

    console.log('\n' + '█'.repeat(80));
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█' + ' '.repeat(20) + 'SYSTEM RELIABILITY AUDIT REPORT' + ' '.repeat(27) + '█');
    console.log('█' + ' '.repeat(78) + '█');
    console.log('█'.repeat(80) + '\n');

    console.log('📊 SUMMARY');
    console.log('─'.repeat(80));
    console.log(`Total Tests:          ${report.summary.totalTests}`);
    console.log(`Passed Tests:         ${report.summary.passedTests} ✅`);
    console.log(`Failed Tests:         ${report.summary.failedTests} ❌`);
    console.log(`Overall Reliability:  ${report.summary.overallReliability.toFixed(2)}%`);

    if (report.criticalIssues.length > 0) {
      console.log(`\n🔴 CRITICAL ISSUES (${report.criticalIssues.length})`);
      console.log('─'.repeat(80));
      report.criticalIssues.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.category}] ${issue.description}`);
      });
    }

    if (report.majorIssues.length > 0) {
      console.log(`\n🟠 MAJOR ISSUES (${report.majorIssues.length})`);
      console.log('─'.repeat(80));
      report.majorIssues.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.category}] ${issue.description}`);
      });
    }

    if (report.minorIssues.length > 0) {
      console.log(`\n🟡 MINOR ISSUES (${report.minorIssues.length})`);
      console.log('─'.repeat(80));
      report.minorIssues.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.category}] ${issue.description}`);
      });
    }

    console.log('\n' + '█'.repeat(80) + '\n');

    if (report.summary.overallReliability === 100) {
      console.log('🎉 PERFECT SCORE - System is 100% reliable!\n');
    } else if (report.summary.overallReliability >= 90) {
      console.log('✅ EXCELLENT - System is highly reliable\n');
    } else if (report.summary.overallReliability >= 70) {
      console.log('⚠️  GOOD - System is mostly reliable but needs improvement\n');
    } else {
      console.log('❌ NEEDS IMPROVEMENT - System has significant reliability issues\n');
    }
  }

  /**
   * Get all results
   */
  getResults(): AuditResult[] {
    return this.results;
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results = [];
  }
}
