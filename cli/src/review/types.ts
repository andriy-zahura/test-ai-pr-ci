export interface CategoryScores {
  architecture: number;
  maintainability: number;
  typeSafety: number;
  documentation: number;
  testing: number;
  performance: number;
  security: number;
}

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export interface ReviewIssue {
  severity: IssueSeverity;
  file?: string;
  message: string;
}

export interface PreviousReviewResolution {
  resolved: string[];
  unresolved: string[];
  partiallyResolved: string[];
}

export interface ReviewResult {
  overallScore: number;
  categories: CategoryScores;
  issues: ReviewIssue[];
  improvements: string[];
  previousReviewResolved?: PreviousReviewResolution;
}

export interface ReviewContext {
  generatedAt: string;
  changedFiles: string[];
  diff: string;
  projectRules: Record<string, string>;
  featureDocs: Record<string, string>;
  metadata: Record<string, unknown>;
  previousReview: string | null;
}

export interface ReviewProvider {
  name: string;
  review(context: ReviewContext): Promise<ReviewResult>;
}
