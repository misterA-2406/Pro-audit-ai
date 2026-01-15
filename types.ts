
export interface MetricData {
  score: string;
  value: number | string;
  unit?: string;
}

export interface CrawlData {
    performanceScore: number;
    seoScore: number;
    accessibilityScore: number;
    bestPracticesScore: number;
    lcp: number;
    cls: number;
    fcp: number;
    totalSize: number;
    fieldLcp: MetricData | null;
    fieldInp: MetricData | null;
    fieldCls: MetricData | null;
    screenshot: string | null;
    metaDescription: string | null;
    documentTitle: string | null;
    imageAltMissing: number;
    https: boolean;
    viewport: boolean;
    opportunities: {
        title: string;
        description: string;
        savings: string;
    }[];
    errors: string[];
}

export interface AuditReport {
  titlePage: {
    reportTitle: string;
    subTitle: string;
    websiteName: string;
    url: string;
    date: string;
    preparedBy: string;
    preparedFor: string;
    clientCompany: string;
    businessType: string;
    screenshot?: string;
  };
  roiAnalysis: {
    estimatedLostRevenue: string;
    potentialConversionIncrease: string;
    customerLifetimeValueImpact: string;
    summary: string;
  };
  executiveSummary: {
    overallScore: number;
    grade: string;
    categoryScores: { category: string; score: string }[];
    keyFindings: string[];
    immediateActions: string[];
  };
  businessIntelligence: {
    companyProfile: { item: string; details: string }[];
    businessModel: { element: string; information: string }[];
    valueProposition: string;
    differentiationClaims: string[];
    gapAnalysis: string[];
    onlinePresence: {
        websiteTech: string;
        socialMedia: { platform: string; status: string }[];
    }
  };
  technicalAudit: {
    performance: string[];
    siteStructure: {
        navigationClarity: string;
        menuItems: string;
        contactAccessibility: string;
    };
    seoTechnical: { element: string; status: string }[];
  };
  contentAudit: {
    homepageAnalysis: {
        firstImpression: string;
        valueCommunication: string;
        heroSection: string;
        primaryCTA: string;
    };
    pageInventory: {
        page: string;
        status: string;
        quality: string;
        notes: string;
    }[];
    contentQuality: { aspect: string; rating: string }[];
    visualDesign: { aspect: string; details: string }[];
  };
  conversionInsights: {
    ctaVisibility: string;
    primaryCtas: string[];
    leadGeneration: { element: string; status: string }[];
    frictionPoints: string[];
    trustSignals: { type: string; status: string }[];
  };
  seoMarketing: {
    keywords: string[];
    localSeo: string;
    contentMarketing: { aspect: string; status: string }[];
    contentTypes: string[];
  };
  competitivePositioning: {
    positioningStatement: string;
    differentiation: string;
    industryComparison: { metric: string; rating: string }[];
    marketGaps: string[];
  };
  mobileExperience: {
    analysis: { aspect: string; rating: string }[];
    issues: string[];
  };
  criticalIssues: {
    high: { title: string; desc: string }[];
    medium: { title: string; desc: string }[];
    low: { title: string; desc: string }[];
  };
  recommendations: {
    title: string;
    priority: string;
    impact: string;
    effort: string;
    why: string;
    how: string[];
    expectedOutcome: string;
    projectedRevenue: string;
    projectedCustomers: string;
  }[];
  growthOpportunities: {
    quickWins: { title: string; metric: string }[];
    strategic: { title: string; metric: string }[];
    longTerm: { title: string; metric: string }[];
  };
  competitiveIntelligence: {
    competitorAnalysis: { name: string; known: string; description: string }[];
    advantages: string[];
  };
  finalSummary: {
    overallScore: number;
    breakdown: { category: string; score: string }[];
    summaryText: string;
  };
  actionPlan: {
    step: number;
    action: string;
    owner: string;
    timeline: string;
  }[];
}
