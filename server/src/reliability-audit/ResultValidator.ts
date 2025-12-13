/**
 * Result Validator
 * Validates that analysis results contain all required fields
 */

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  invalidFields: Array<{ field: string; reason: string }>;
  warnings: string[];
}

export class ResultValidator {
  /**
   * Validate property analysis result
   */
  static validatePropertyAnalysis(result: any): ValidationResult {
    const missingFields: string[] = [];
    const invalidFields: Array<{ field: string; reason: string }> = [];
    const warnings: string[] = [];

    // Required top-level fields
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
      if (!(field in result) || result[field] === undefined) {
        missingFields.push(field);
      }
    });

    // Validate address
    if (result.address) {
      const addressFields = ['street', 'city', 'state', 'fullAddress'];
      addressFields.forEach(field => {
        if (!result.address[field]) {
          missingFields.push(`address.${field}`);
        }
      });
    }

    // Validate scores
    if (result.scores) {
      const requiredScores = ['investment', 'location', 'condition', 'marketTiming', 'overall'];
      requiredScores.forEach(score => {
        if (!(score in result.scores)) {
          missingFields.push(`scores.${score}`);
        } else {
          const value = result.scores[score];
          if (typeof value !== 'number' || isNaN(value)) {
            invalidFields.push({
              field: `scores.${score}`,
              reason: `Invalid score value: ${value}. Expected number 0-100.`,
            });
          } else if (value < 0 || value > 100) {
            invalidFields.push({
              field: `scores.${score}`,
              reason: `Score out of range: ${value}. Expected 0-100.`,
            });
          }
          
          // Warn about potential fallback values
          if (value === 50) {
            warnings.push(`Score "${score}" is 50 - might be a fallback value`);
          }
        }
      });

      // Check if all scores are the same (suspicious pattern)
      const scoreValues = requiredScores
        .map(s => result.scores[s])
        .filter(v => typeof v === 'number');
      
      if (scoreValues.length > 0) {
        const allSame = scoreValues.every(v => v === scoreValues[0]);
        if (allSame) {
          warnings.push(`All scores are identical (${scoreValues[0]}) - may indicate fallback behavior`);
        }
      }
    }

    // Validate arrays
    ['pros', 'cons', 'recommendations'].forEach(field => {
      if (result[field] !== undefined && !Array.isArray(result[field])) {
        invalidFields.push({
          field,
          reason: `Expected array, got ${typeof result[field]}`,
        });
      }
    });

    // Validate sources array
    if (result.sources !== undefined) {
      if (!Array.isArray(result.sources)) {
        invalidFields.push({
          field: 'sources',
          reason: 'Expected array',
        });
      } else if (result.sources.length === 0) {
        warnings.push('No sources provided - data may be unreliable');
      }
    }

    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields,
      warnings,
    };
  }

  /**
   * Validate lead intelligence result
   */
  static validateLeadIntelligence(result: any): ValidationResult {
    const missingFields: string[] = [];
    const invalidFields: Array<{ field: string; reason: string }> = [];
    const warnings: string[] = [];

    // Required fields
    const requiredFields = [
      'leadScore',
      'renovationPotential',
      'ownerMotivation',
      'profitPotential',
      'propertyIntel',
      'ownerIntel',
      'financialIntel',
      'permitHistory',
      'renovationOpps',
      'salesApproach',
    ];

    requiredFields.forEach(field => {
      if (!(field in result) || result[field] === undefined) {
        missingFields.push(field);
      }
    });

    // Validate leadScore
    if (typeof result.leadScore === 'number') {
      if (result.leadScore < 0 || result.leadScore > 100) {
        invalidFields.push({
          field: 'leadScore',
          reason: `Score out of range: ${result.leadScore}`,
        });
      }
      if (result.leadScore === 50) {
        warnings.push('Lead score is 50 - might be a fallback value');
      }
    } else if (result.leadScore !== undefined) {
      invalidFields.push({
        field: 'leadScore',
        reason: 'Expected number',
      });
    }

    // Validate enum fields
    const validRenovationPotential = ['LOW', 'MEDIUM', 'HIGH', 'EXCELLENT'];
    if (result.renovationPotential && !validRenovationPotential.includes(result.renovationPotential)) {
      invalidFields.push({
        field: 'renovationPotential',
        reason: `Invalid value: ${result.renovationPotential}`,
      });
    }

    const validOwnerMotivation = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
    if (result.ownerMotivation && !validOwnerMotivation.includes(result.ownerMotivation)) {
      invalidFields.push({
        field: 'ownerMotivation',
        reason: `Invalid value: ${result.ownerMotivation}`,
      });
    }

    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields,
      warnings,
    };
  }

  /**
   * Print validation result
   */
  static printValidationResult(validation: ValidationResult, resultType: string): void {
    if (validation.isValid && validation.warnings.length === 0) {
      console.log(`✅ ${resultType} validation passed`);
      return;
    }

    console.log(`\n🔍 Validating ${resultType}:`);

    if (validation.missingFields.length > 0) {
      console.log('  ❌ Missing fields:');
      validation.missingFields.forEach(field => {
        console.log(`     - ${field}`);
      });
    }

    if (validation.invalidFields.length > 0) {
      console.log('  ❌ Invalid fields:');
      validation.invalidFields.forEach(({ field, reason }) => {
        console.log(`     - ${field}: ${reason}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log('  ⚠️  Warnings:');
      validation.warnings.forEach(warning => {
        console.log(`     - ${warning}`);
      });
    }
  }
}
