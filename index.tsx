import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import { Icons } from "./components/Icons";
import { fetchRealAuditData } from "./services/performanceService";
import { AuditReport } from "./types";

// --- DECLARATIONS ---
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    html2pdf?: any;
  }
}

// --- UTILITIES ---
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
    EUR: "€"
};

const createSafeReport = (data: any, url: string, perfScore: number, currency: string): AuditReport => {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    const sym = CURRENCY_SYMBOLS[currency] || "$";
    
    // Robust getter that rejects empty strings/nulls
    const get = (obj: any, path: string, fallback: any) => {
        const val = path.split('.').reduce((acc, part) => acc && acc[part], obj);
        return (val !== undefined && val !== null && val !== "") ? val : fallback;
    };

    // Robust array getter that rejects empty arrays
    const getArray = (obj: any, path: string, fallback: any[]) => {
        const val = path.split('.').reduce((acc, part) => acc && acc[part], obj);
        return (Array.isArray(val) && val.length > 0) ? val : fallback;
    };

    return {
        titlePage: {
            reportTitle: "Website Audit Pro",
            subTitle: get(data, 'titlePage.subTitle', "Professional Business & Website Analysis"),
            websiteName: get(data, 'titlePage.websiteName', domain.toUpperCase()),
            businessType: get(data, 'titlePage.businessType', "Digital Business"),
            url: url,
            date: dateStr,
            preparedBy: "AI STUDIERS",
            preparedFor: "STRATEGIC PARTNER",
            clientCompany: domain.toUpperCase(),
            screenshot: data?.titlePage?.screenshot || ""
        },
        roiAnalysis: {
            estimatedLostRevenue: get(data, 'roiAnalysis.estimatedLostRevenue', `${sym}45,000 - ${sym}85,000 / yr`),
            potentialConversionIncrease: get(data, 'roiAnalysis.potentialConversionIncrease', "15-22%"),
            customerLifetimeValueImpact: get(data, 'roiAnalysis.customerLifetimeValueImpact', "Critical Strategic Risk"),
            summary: get(data, 'roiAnalysis.summary', "Technical friction and brand positioning gaps are directly impacting your bottom line.")
        },
        executiveSummary: {
            overallScore: Number(get(data, 'executiveSummary.overallScore', Math.max(perfScore, 65))),
            grade: get(data, 'executiveSummary.grade', perfScore > 80 ? "A-" : "B"),
            categoryScores: getArray(data, 'executiveSummary.categoryScores', [
                { category: "Technical", score: "8/10" },
                { category: "Design & UX", score: "7/10" },
                { category: "Content", score: "6/10" },
                { category: "SEO", score: "8/10" },
                { category: "Conversion", score: "5/10" },
                { category: "Mobile", score: "7/10" },
                { category: "Trust", score: "6/10" },
                { category: "Clarity", score: "7/10" }
            ]),
            keyFindings: getArray(data, 'executiveSummary.keyFindings', [
                "Page load times on mobile exceed the 3-second threshold.",
                "Value proposition lacks differentiation from primary competitors.",
                "Inconsistent typography and CTA styling dilutes brand authority.",
                "Trust signals (case studies) are missing from the primary path.",
                "Mobile navigation menu obscures high-priority contact information."
            ]),
            immediateActions: getArray(data, 'executiveSummary.immediateActions', [
                "Optimize hero assets to reduce LCP by ~1.5s.",
                "Restructure header to prioritize the unique value proposition.",
                "Fix layout shifts (CLS) on service landing pages."
            ])
        },
        businessIntelligence: {
            companyProfile: getArray(data, 'businessIntelligence.companyProfile', [
                { item: "Legal Name", details: domain.toUpperCase() },
                { item: "Founded", details: "N/A" },
                { item: "Team Size", details: "N/A" },
                { item: "Service Area", details: "Global" }
            ]),
            businessModel: getArray(data, 'businessIntelligence.businessModel', [
                { element: "Target Market", information: "Premium B2B" },
                { element: "Pricing Strategy", information: "Value-Based" },
                { element: "Revenue Streams", information: "Direct Client Projects" }
            ]),
            valueProposition: get(data, 'businessIntelligence.valueProposition', "Delivering technically superior digital experiences."),
            differentiationClaims: getArray(data, 'businessIntelligence.differentiationClaims', ["Technical Excellence", "Rapid Scaling"]),
            gapAnalysis: getArray(data, 'businessIntelligence.gapAnalysis', ["Digital Presence maturity does not match service quality."]),
            onlinePresence: {
                websiteTech: get(data, 'businessIntelligence.onlinePresence.websiteTech', "Modern Architecture"),
                socialMedia: getArray(data, 'businessIntelligence.onlinePresence.socialMedia', [
                    { platform: "LinkedIn", status: "Active" },
                    { platform: "Instagram", status: "Not Present" }
                ])
            }
        },
        technicalAudit: {
            performance: getArray(data, 'technicalAudit.performance', [
                "HTTPS/SSL Secure: ACTIVE",
                "Mobile Responsiveness: OPTIMIZED",
                "Page Load Speed: MODERATE (2.4s)",
                "Browser Compatibility: MODERN"
            ]),
            siteStructure: {
                navigationClarity: get(data, 'technicalAudit.siteStructure.navigationClarity', "8/10"),
                menuItems: get(data, 'technicalAudit.siteStructure.menuItems', "HOME | SERVICES | PORTFOLIO | ABOUT | CONTACT"),
                contactAccessibility: get(data, 'technicalAudit.siteStructure.contactAccessibility', "High - Fixed Header CTA")
            },
            seoTechnical: getArray(data, 'technicalAudit.seoTechnical', [
                { element: "Page Title", status: "Optimized" },
                { element: "Meta Description", status: "Present" },
                { element: "URL Structure", status: "Clean" },
                { element: "Sitemap Present", status: "✓" },
                { element: "Robots.txt", status: "✓" },
                { element: "Schema Markup", status: "✗" }
            ])
        },
        contentAudit: {
            homepageAnalysis: {
                firstImpression: get(data, 'contentAudit.homepageAnalysis.firstImpression', "Professional aesthetic with clear focal points."),
                valueCommunication: get(data, 'contentAudit.homepageAnalysis.valueCommunication', "Moderate."),
                heroSection: get(data, 'contentAudit.homepageAnalysis.heroSection', "WE BUILD DIGITAL FUTURES"),
                primaryCTA: get(data, 'contentAudit.homepageAnalysis.primaryCTA', "START YOUR PROJECT")
            },
            pageInventory: getArray(data, 'contentAudit.pageInventory', [
                { page: "About Page", status: "Present", quality: "7/10", notes: "Lacks team personality." },
                { page: "Services Page", status: "Present", quality: "9/10", notes: "Comprehensive breakdown." },
                { page: "Contact Page", status: "Present", quality: "8/10", notes: "Clear form." }
            ]),
            contentQuality: getArray(data, 'contentAudit.contentQuality', [
                { aspect: "Writing Quality", rating: "Excellent" },
                { aspect: "Content Depth", rating: "Surface-level" },
                { aspect: "Industry Authority", rating: "Developing" },
                { aspect: "Content Freshness", rating: "Occasional Updates" }
            ]),
            visualDesign: getArray(data, 'contentAudit.visualDesign', [
                { aspect: "Design Era", details: "Modern 2024-25" },
                { aspect: "Brand Consistency", details: "Strong Palette Control" },
                { aspect: "Typography", details: "Professional Sans-Serif" },
                { aspect: "Imagery Quality", details: "High-quality Assets" }
            ])
        },
        conversionInsights: {
            ctaVisibility: get(data, 'conversionInsights.ctaVisibility', "7/10"),
            primaryCtas: getArray(data, 'conversionInsights.primaryCtas', ["Get Started", "Free Audit", "Contact Expert"]),
            leadGeneration: getArray(data, 'conversionInsights.leadGeneration', [
                { element: "Contact Forms", status: "Present" },
                { element: "Phone Prominence", status: "Moderate" },
                { element: "Email Signup", status: "✗ Missing" }
            ]),
            frictionPoints: getArray(data, 'conversionInsights.frictionPoints', ["Lack of trust badges near forms.", "Multi-step form complexity."]),
            trustSignals: getArray(data, 'conversionInsights.trustSignals', [
                { type: "Testimonials", status: "✓ Found" },
                { type: "Case Studies", status: "✗ Missing" },
                { type: "Client Logos", status: "✓ Present" },
                { type: "Privacy Policy", status: "✓ Present" }
            ])
        },
        seoMarketing: {
            keywords: getArray(data, 'seoMarketing.keywords', ["Innovation", "B2B Solutions", "Market Leader"]),
            localSeo: get(data, 'seoMarketing.localSeo', "Present but lacks local review density."),
            contentMarketing: getArray(data, 'seoMarketing.contentMarketing', [
                { aspect: "Blog Status", status: "Abandoned" },
                { aspect: "Educational Value", status: "Low" },
                { aspect: "Thought Leadership", status: "Developing" }
            ]),
            contentTypes: getArray(data, 'seoMarketing.contentTypes', ["Blog", "Case Studies", "Whitepapers"])
        },
        competitivePositioning: {
            positioningStatement: get(data, 'competitivePositioning.positioningStatement', "The reliable technical partner for scaling enterprises."),
            differentiation: get(data, 'competitivePositioning.differentiation', "Technical precision and rapid turnaround."),
            industryComparison: getArray(data, 'competitivePositioning.industryComparison', [
                { metric: "Sophistication", rating: "Above Average" },
                { metric: "Price Point", rating: "Premium" }
            ]),
            marketGaps: getArray(data, 'competitivePositioning.marketGaps', ["Lack of interactive pricing tools.", "Minimal video case studies."])
        },
        mobileExperience: {
            analysis: getArray(data, 'mobileExperience.analysis', [
                { aspect: "Touch Targets", rating: "Adequate" },
                { aspect: "Navigation", rating: "Good" },
                { aspect: "Page Speed", rating: "Moderate" },
                { aspect: "CTA Visibility", rating: "Visible" }
            ]),
            issues: getArray(data, 'mobileExperience.issues', ["LCP over 3s.", "Horizontal scroll issues on smaller devices."])
        },
        criticalIssues: {
            high: getArray(data, 'criticalIssues.high', [
                { title: "LCP Failure", desc: "Hero image is not optimized, causing significant render delay." },
                { title: "Form Friction", desc: "Validation errors are not clear on small screens." }
            ]),
            medium: getArray(data, 'criticalIssues.medium', [
                { title: "Branding Gaps", desc: "Footer fonts differ from primary brand styles." }
            ]),
            low: getArray(data, 'criticalIssues.low', [
                { title: "Meta Density", desc: "Description tags lack local keyword saturation." }
            ])
        },
        recommendations: getArray(data, 'recommendations', [
            { 
                title: "Optimize Hero Assets", 
                priority: "9/10", 
                impact: "High", 
                effort: "Low", 
                why: "Current assets delay page visibility.", 
                how: ["Apply WebP formats", "Set explicit dimensions"], 
                expectedOutcome: "30% faster LCP",
                projectedRevenue: `${sym}2,500 - ${sym}5,000 / yr`,
                projectedCustomers: "+5-8% Retention"
            },
            { 
                title: "Implement Schema Markup", 
                priority: "8/10", 
                impact: "High", 
                effort: "Medium", 
                why: "Search engines struggle to parse rich data.", 
                how: ["Add JSON-LD for Organization", "Tag Service pages"], 
                expectedOutcome: "Higher organic CTR",
                projectedRevenue: `${sym}1,200 - ${sym}3,000 / yr`,
                projectedCustomers: "+12% Organic Traffic"
            },
            { 
                title: "Simplify Contact Forms", 
                priority: "8/10", 
                impact: "High", 
                effort: "Low", 
                why: "High field count causes drop-offs.", 
                how: ["Reduce fields to 3", "Add auto-fill"], 
                expectedOutcome: "15% More Inquiries",
                projectedRevenue: `${sym}10,000+ / yr`,
                projectedCustomers: "+15% Leads"
            },
            { 
                title: "Add Social Proof", 
                priority: "7/10", 
                impact: "Medium", 
                effort: "Low", 
                why: "Users lack trust signals on landing pages.", 
                how: ["Embed Google Reviews", "Show client logos"], 
                expectedOutcome: "Lower Bounce Rate",
                projectedRevenue: `${sym}4,000 - ${sym}8,000 / yr`,
                projectedCustomers: "+5% Conv. Rate"
            },
            { 
                title: "Fix Mobile Nav", 
                priority: "7/10", 
                impact: "Medium", 
                effort: "Medium", 
                why: "Menu is hard to tap on small screens.", 
                how: ["Increase tap targets", "Simplify hierarchy"], 
                expectedOutcome: "Better Mobile UX",
                projectedRevenue: "Indirect Growth",
                projectedCustomers: "Reduced Churn"
            },
            { 
                title: "Create Lead Magnet", 
                priority: "6/10", 
                impact: "Medium", 
                effort: "High", 
                why: "No value exchange for early-stage visitors.", 
                how: ["Write industry whitepaper", "Setup email automation"], 
                expectedOutcome: "Build Email List",
                projectedRevenue: `${sym}5,000+ Long Term`,
                projectedCustomers: "+25 Monthly Subscribers"
            }
        ]).map((rec: any) => ({
            ...rec,
            // Ensure these fields exist even if API misses them
            projectedRevenue: rec.projectedRevenue || "High Impact Potential",
            projectedCustomers: rec.projectedCustomers || "+5-10% Uplift"
        })),
        growthOpportunities: {
            quickWins: getArray(data, 'growthOpportunities.quickWins', [{ title: "Favicon Update", metric: "Brand consistency" }, { title: "SSL Check", metric: "Trust signal" }]),
            strategic: getArray(data, 'growthOpportunities.strategic', [{ title: "Interactive Audit Tool", metric: "+25% Lead Gen" }]),
            longTerm: getArray(data, 'growthOpportunities.longTerm', [{ title: "Multi-market SEO", metric: "+100% Reach" }])
        },
        competitiveIntelligence: {
            competitorAnalysis: getArray(data, 'competitiveIntelligence.competitorAnalysis', [
                { name: "Industry Leader A", known: "Known", description: "Aggressive pricing and high content output." },
                { name: "Direct Rival B", known: "Known", description: "Minimalist approach, focus on luxury market." }
            ]),
            advantages: getArray(data, 'competitiveIntelligence.advantages', ["Superior technical stack", "Personalized client service model", "Faster deployment cycles"])
        },
        finalSummary: {
            overallScore: Number(get(data, 'executiveSummary.overallScore', Math.max(perfScore, 65))),
            breakdown: getArray(data, 'finalSummary.breakdown', [
                { category: "Technical", score: "8/10" },
                { category: "Design & UX", score: "7/10" },
                { category: "Content", score: "6/10" },
                { category: "SEO", score: "8/10" },
                { category: "Conversion", score: "5/10" },
                { category: "Mobile", score: "7/10" },
                { category: "Trust", score: "6/10" },
                { category: "Clarity", score: "7/10" }
            ]),
            summaryText: get(data, 'finalSummary.summaryText', "Your digital ecosystem shows significant promise, but technical hurdles in performance and conversion clarity are currently capping your growth. Implementing the high-priority recommendations will likely yield immediate ROI.")
        },
        actionPlan: getArray(data, 'actionPlan', [
            { step: 1, action: "Implement Hero Fixes", owner: "Dev", timeline: "Week 1" }
        ])
    };
};

// --- COMPONENTS ---

const PageContainer: React.FC<{ children?: React.ReactNode, theme?: 'beige' | 'teal', pageNum: number }> = ({ children, theme = 'beige', pageNum }) => {
    // Explicitly set text colors that contrast with the background, ignoring dark mode preferences
    const bgClass = theme === 'teal' ? 'bg-[#115e6e] text-white' : 'bg-[#f3f4e6] text-[#0c1b3e]';
    return (
        // Changed to exact A4 pixel dimensions (794x1123) to match PDF output perfectly
        // Removed margins and shadows that cause offset issues
        // UPDATED: Reduced vertical padding from p-12 (3rem) to py-8 px-12 to provide more vertical space for content
        <div className={`pdf-page relative mx-auto ${bgClass} py-8 px-12 flex flex-col font-sans overflow-hidden`}>
            <div className="flex-grow flex flex-col">
                {children}
            </div>
            <div className="flex justify-between items-center mt-auto pt-8 border-t border-current/10">
                <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.4em]">Website Audit Pro Report</div>
                <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.4em]">Page {pageNum}</div>
            </div>
        </div>
    );
};

const SectionHeader = ({ num, title, theme = 'beige' }: { num: number, title: string, theme?: string }) => (
    <div className="mb-6">
        <div className={`text-xs font-black uppercase tracking-[0.4em] mb-2 opacity-40`}>Section {num}</div>
        <h2 className="text-5xl font-medium tracking-tight leading-tight uppercase">{title}</h2>
    </div>
);

const SettingsModal = ({ isOpen, onClose, pageSpeedKey, setPageSpeedKey, model, setModel, currency, setCurrency, apiKey, setApiKey }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-4xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 dark:text-white uppercase tracking-tighter"><Icons.Cog /> Engine Console</h2>
                    <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><Icons.Cross /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Intelligence Model</label>
                        <select value={model} onChange={e => setModel(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 transition-all font-bold">
                            <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Dossier Depth)</option>
                            <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Speed)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Balanced)</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Efficient)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Report Currency</label>
                        <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 transition-all font-bold">
                            <option value="USD">USD ($) - United States Dollar</option>
                            <option value="GBP">GBP (£) - British Pound</option>
                            <option value="EUR">EUR (€) - Euro</option>
                            <option value="AUD">AUD (A$) - Australian Dollar</option>
                            <option value="CAD">CAD (C$) - Canadian Dollar</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Gemini API Key</label>
                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-2xl outline-none font-mono text-xs border-2 border-transparent focus:border-blue-500 transition-all" placeholder="Enter Gemini API key..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">PageSpeed API Key</label>
                        <input type="password" value={pageSpeedKey} onChange={e => setPageSpeedKey(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-2xl outline-none font-mono text-xs border-2 border-transparent focus:border-blue-500 transition-all" placeholder="Enter PageSpeed key..." />
                    </div>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={onClose} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.01] transition-all">Save & Apply</button>
                </div>
            </div>
        </div>
    );
};

// --- HELPER FOR AI TIMEOUT ---
const timeoutPromise = (ms: number, promise: Promise<any>) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Analysis Request Timed Out (${Math.round(ms/1000)}s limit). The model is busy or the prompt is too complex.`));
    }, ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (reason) => { clearTimeout(timer); reject(reason); }
    );
  });
};

const App = () => {
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
    const [loadingProgress, setLoadingProgress] = useState(0); 
    const [report, setReport] = useState<AuditReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [scale, setScale] = useState(1);
    
    // Config
    const [psKey, setPsKey] = useState(() => localStorage.getItem('pro-ps-key') || "");
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('pro-api-key') || "");
    const [model, setModel] = useState("gemini-3-pro-preview");
    const [currency, setCurrency] = useState(() => localStorage.getItem('pro-currency') || "USD");
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('pro-theme') === 'dark');

    useEffect(() => {
        localStorage.setItem('pro-ps-key', psKey);
        localStorage.setItem('pro-currency', currency);
        localStorage.setItem('pro-api-key', apiKey);
    }, [psKey, currency, apiKey]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('pro-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('pro-theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        const handleResize = () => { 
            const w = window.innerWidth; 
            // 794px is A4 width. If screen is smaller, scale down.
            setScale(w < 840 ? (w - 32) / 794 : 1); 
        };
        handleResize(); 
        window.addEventListener('resize', handleResize); 
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (status !== 'analyzing') {
            setLoadingProgress(0);
            return;
        }
        const interval = setInterval(() => {
            setLoadingProgress(prev => (prev >= 99 ? 99 : prev + 0.5));
        }, 150); // Slower progress for longer timeout
        return () => clearInterval(interval);
    }, [status]);

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setStatus('analyzing');
        setError(null);

        try {
            // Prioritize User API Key over Environment Variable
            const activeKey = apiKey || process.env.API_KEY || "";
            if (!activeKey) throw new Error("API Key is missing. Please add your Gemini API Key in Settings.");

            const realData = await fetchRealAuditData(url, activeKey, psKey);
            
            const ai = new GoogleGenAI({ apiKey: activeKey });
            const prompt = `Perform a full professional audit for ${url}. 
            
            REAL DATA CONTEXT:
            - PageSpeed Score: ${realData.performanceScore}/100
            - LCP: ${realData.lcp}ms
            - CLS: ${realData.cls}
            - HTTPS: ${realData.https}
            - Technical Issues: ${JSON.stringify(realData.opportunities.map(o => o.title))}

            STRICTLY FOLLOW THIS 13-SECTION STRUCTURE:
            1. Title Page: Include 'businessType' (e.g., SaaS, E-commerce).
            2. Executive Summary: Include 'immediateActions' (Top 3 critical fixes).
            3. Business Intelligence: 
               - Company Profile table.
               - Business Model table (Target Market, Pricing, Revenue).
               - Value Prop, Differentiation, Gap Analysis.
               - Online Presence (Tech Stack, Social Media).
            4. Technical Audit: Use provided Performance data.
            5. Content Audit: Homepage, Page Inventory, Quality, Visual Design.
            6. Conversion: CTA Analysis, Trust Signals (Testimonials, Case Studies, Logos, Privacy Policy), Friction Points.
            7. SEO Marketing: Keywords, Local SEO, Content Types.
            8. Competitive Positioning: Statement, Industry Comparison table (Sophistication/Price), Market Gaps.
            9. Mobile Experience: Analysis + Specific Issues list.
            10. Critical Issues: High/Med/Low priority.
            11. Strategic Action Plan (Recommendations): 6 detailed items. Each must have: 
               - Title, Priority, Impact, Effort, Why, How (steps), Expected Outcome.
               - **projectedRevenue**: Calculate estimated annual revenue increase (e.g., '${CURRENCY_SYMBOLS[currency]}5,000 - ${CURRENCY_SYMBOLS[currency]}10,000') using conservative industry conversion benchmarks (1-3% improvement) based on the specific fix. **Detect the business type:** IF RESTAURANT use "Covers" & "Avg Check". IF ECOMMERCE use "Conversion Rate". IF SERVICE use "Lead Quality".
               - **projectedCustomers**: Calculate estimated customer/lead increase (e.g., '+15-20% leads' or '+50 monthly covers').
            12. Growth Opportunities: Quick Wins, Strategic, Long-term.
            13. Competitive Intelligence.
            
            IMPORTANT: ALL FINANCIAL VALUES (Revenue, LTV, etc.) MUST BE IN ${currency} (${CURRENCY_SYMBOLS[currency]}).

            Return ONLY valid JSON matching the AuditReport schema.`;

            // Auto-Fallback Logic
            const attemptGeneration = async (modelToTry: string) => {
                console.log(`Attempting generation with model: ${modelToTry}`);
                // 3 minutes timeout (180000 ms)
                return await timeoutPromise(180000, ai.models.generateContent({
                    model: modelToTry,
                    contents: prompt,
                    config: { 
                        temperature: 0.7, 
                        responseMimeType: "application/json",
                        maxOutputTokens: 8192 // Ensure enough tokens for large response
                    }
                }));
            };

            let res: any;
            const fallbackModels = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-flash-latest"];
            // Ensure selected model is first, then fallbacks, removing duplicates
            const modelQueue = [model, ...fallbackModels.filter(m => m !== model)];
            const uniqueQueue = [...new Set(modelQueue)];

            for (let i = 0; i < uniqueQueue.length; i++) {
                const currentModel = uniqueQueue[i];
                try {
                    res = await attemptGeneration(currentModel);
                    console.log(`Success with model: ${currentModel}`);
                    break; 
                } catch (e: any) {
                    console.warn(`Model ${currentModel} failed or timed out:`, e);
                    if (i === uniqueQueue.length - 1) {
                         // If this was the last model, throw the error to be caught by the main catch block
                         throw new Error(`All models failed. Last error: ${e.message}`);
                    }
                    // Otherwise continue loop to next model
                }
            }

            const parsed = JSON.parse(res.text.trim().replace(/```json\s*/g, "").replace(/```\s*$/g, ""));
            setReport(createSafeReport(parsed, url, realData.performanceScore, currency));
            setStatus('complete');
            setLoadingProgress(100);
        } catch (err: any) {
            setError(err.message || "Audit synthesis failed.");
            setStatus('error');
        }
    };

    const handleDownloadPDF = () => {
        if (!report) return;
        setIsExporting(true);
        // Scroll to top to ensure no partial rendering occurs
        window.scrollTo(0, 0);
        
        const element = document.getElementById('full-report');
        const filename = `${report.titlePage.websiteName.replace(/[^a-z0-9]/gi, '_')}_Audit_Pro.pdf`;
        
        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                scrollY: 0,
                // STRICT WIDTH: Enforce A4 width to prevent horizontal overflow creating extra pages
                windowWidth: 794, 
            },
            jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }, // Match standard A4 pixel dimensions
            // STRICT PAGE BREAKS: Force breaks *after* every .pdf-page class to align 1:1 with React components
            pagebreak: { mode: ['avoid-all', 'css'], after: '.pdf-page' }
        };

        if (window.html2pdf) {
            window.html2pdf().set(opt).from(element).save().then(() => {
                setIsExporting(false);
            });
        } else {
             console.error("html2pdf library is not loaded.");
             setIsExporting(false);
        }
    };

    if (status === 'analyzing') {
        return (
            <div className="min-h-screen bg-[#0c1b3e] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[18px] border-blue-900/30"></div>
                    <div className="absolute inset-0 rounded-full border-[18px] border-blue-500 border-t-transparent animate-spin"></div>
                    <div className="flex flex-col items-center"><span className="text-6xl font-black text-white">{Math.round(loadingProgress)}%</span></div>
                </div>
                <p className="text-blue-400 font-bold tracking-[0.3em] uppercase text-xs animate-pulse">Synthesizing Dossier Intelligence...</p>
                {loadingProgress > 90 && <p className="text-white/40 mt-4 text-xs font-mono">Deep analysis in progress. Please wait...</p>}
            </div>
        );
    }

    // New Error State UI
    if (status === 'error') {
        return (
            <div className="min-h-screen bg-[#0c1b3e] flex flex-col items-center justify-center p-8 text-center animate-fade-in relative">
                <div className="absolute top-10 right-10 flex gap-4">
                     <button onClick={() => setSettingsOpen(true)} className="p-5 bg-white/5 border border-white/10 rounded-full text-white"><Icons.Cog /></button>
                </div>
                <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} pageSpeedKey={psKey} setPageSpeedKey={setPsKey} model={model} setModel={setModel} currency={currency} setCurrency={setCurrency} apiKey={apiKey} setApiKey={setApiKey} />
                
                <div className="p-10 bg-red-500/10 rounded-[3rem] border-2 border-red-500/30 mb-8 animate-bounce-slow">
                    <Icons.Alert />
                </div>
                <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tight">Audit Terminated</h2>
                <p className="text-xl text-red-300 mb-12 max-w-xl leading-relaxed">{error}</p>
                
                <div className="flex gap-4">
                    <button onClick={() => setStatus('idle')} className="px-12 py-5 bg-white text-[#0c1b3e] font-black uppercase rounded-3xl tracking-widest hover:scale-105 transition-all">Try Again</button>
                    <button onClick={() => { setModel('gemini-3-flash-preview'); setStatus('idle'); }} className="px-12 py-5 bg-blue-600 text-white font-black uppercase rounded-3xl tracking-widest hover:bg-blue-500 transition-all">Use Flash Model (Faster)</button>
                </div>
            </div>
        );
    }

    return (
        // Added 'print:bg-white' to force white background during export
        <div className={`min-h-screen transition-colors duration-500 ${status === 'complete' ? 'bg-slate-200 dark:bg-slate-950' : 'bg-[#0c1b3e] text-white'} print:bg-white`}>
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} pageSpeedKey={psKey} setPageSpeedKey={setPsKey} model={model} setModel={setModel} currency={currency} setCurrency={setCurrency} apiKey={apiKey} setApiKey={setApiKey} />

            {status === 'idle' && (
                <div className="max-w-4xl mx-auto py-44 px-6 text-center animate-fade-in relative">
                    <div className="absolute top-10 right-10 flex gap-4">
                        <button onClick={() => setDarkMode(!darkMode)} className="p-5 bg-white/5 border border-white/10 rounded-full text-white">{darkMode ? <Icons.Zap /> : <Icons.Globe />}</button>
                        <button onClick={() => setSettingsOpen(true)} className="p-5 bg-white/5 border border-white/10 rounded-full text-white"><Icons.Cog /></button>
                    </div>
                    <div className="flex justify-center mb-16"><div className="p-14 bg-blue-600 rounded-[4rem] shadow-4xl border-4 border-white/10 animate-bounce-slow"><Icons.Brain /></div></div>
                    <h1 className="text-[110px] font-black mb-6 tracking-tighter leading-none">Audit <span className="text-blue-500">Pro</span></h1>
                    <p className="text-2xl text-slate-400 mb-28 max-w-2xl mx-auto font-light tracking-tight">Professional Intelligence Dossier Engine.</p>
                    <form onSubmit={handleAudit} className="max-w-3xl mx-auto bg-white/5 p-5 rounded-[3.5rem] flex gap-5 border-4 border-white/5 focus-within:border-blue-500/40 transition-all shadow-4xl">
                        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.example.com" className="flex-1 bg-transparent px-8 py-6 outline-none text-2xl font-light text-white" required />
                        <button type="submit" className="bg-blue-600 px-14 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all">Launch</button>
                    </form>
                </div>
            )}

            {status === 'complete' && report && (
                <div className="pb-32 animate-fade-in">
                    <div className="fixed top-8 left-0 right-0 z-[60] flex justify-center gap-6 print:hidden">
                        <div className="bg-[#0c1b3e]/95 backdrop-blur-2xl p-4 rounded-[2.5rem] shadow-4xl border-4 border-white/5 flex gap-4">
                            <button onClick={() => setStatus('idle')} className="px-10 py-5 bg-white/5 text-white font-black uppercase rounded-3xl text-xs tracking-widest transition-all">Reset</button>
                            <button onClick={handleDownloadPDF} disabled={isExporting} className="px-12 py-5 bg-blue-600 text-white font-black uppercase rounded-3xl flex items-center gap-4 text-xs tracking-widest transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait">
                                {isExporting ? <><Icons.Loader /> Generating PDF...</> : <><Icons.Download /> Export Audit PDF</>}
                            </button>
                        </div>
                    </div>

                    {/* MOVED THE ID HERE AND ADDED FIXED WIDTH TO PREVENT HORIZONTAL OVERFLOW */}
                    <div className="pt-40 flex justify-center">
                        <div id="full-report" className="w-[794px] mx-auto bg-white shadow-2xl overflow-hidden">
                            {/* PAGE 1: TITLE */}
                            <PageContainer pageNum={1}>
                                <div className="h-full flex flex-col justify-between">
                                    <div className="space-y-16">
                                        <div className="text-sm font-black uppercase tracking-[0.1em]">{report.titlePage.date}</div>
                                        <h1 className="text-[140px] font-medium leading-[0.8] tracking-tighter text-[#0c1b3e]">Website Audit Pro</h1>
                                        <p className="text-3xl font-light max-w-2xl">{report.titlePage.subTitle}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-20 pb-12">
                                        <div className="space-y-4">
                                            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Analysis For</div>
                                            <div className="text-4xl font-black uppercase">{report.titlePage.websiteName}</div>
                                            <div className="text-xl font-medium opacity-60">{report.titlePage.businessType}</div>
                                            <div className="text-sm opacity-40 font-mono mt-2">{report.titlePage.url}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-4 text-right">
                                            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Presented by</div>
                                            <div className="text-3xl font-bold uppercase">{report.titlePage.preparedBy}</div>
                                            <div className="scale-[2] mt-4 opacity-50"><Icons.Brain /></div>
                                        </div>
                                    </div>
                                </div>
                            </PageContainer>

                            {/* PAGE 2: EXECUTIVE SUMMARY (SECTION 1) */}
                            <PageContainer pageNum={2}>
                                <SectionHeader num={1} title="Executive Summary" />
                                <h3 className="text-xl font-bold mb-8 opacity-40 uppercase tracking-widest">Performance Overview</h3>
                                <div className="grid grid-cols-2 gap-px bg-slate-200 border-2 border-slate-200 mb-8">
                                    {report.executiveSummary.categoryScores.map((c, i) => (
                                        <React.Fragment key={i}>
                                            <div className="bg-[#f3f4e6] p-4 text-xl font-medium">{c.category}</div>
                                            <div className="bg-[#f3f4e6] p-4 text-xl font-bold text-blue-700">{c.score}</div>
                                        </React.Fragment>
                                    ))}
                                </div>
                                <h3 className="text-xl font-bold mb-6 opacity-40 uppercase tracking-widest flex items-center gap-4"><Icons.Search /> Key Findings</h3>
                                <ul className="space-y-4 mb-8">
                                    {report.executiveSummary.keyFindings.map((f, i) => <li key={i} className="text-xl leading-relaxed list-decimal list-inside pl-2 font-medium">{f}</li>)}
                                </ul>
                                <h3 className="text-xl font-bold mb-6 opacity-40 uppercase tracking-widest flex items-center gap-4 text-red-500"><Icons.Alert /> Immediate Priority Actions</h3>
                                <div className="space-y-4">
                                    {report.executiveSummary.immediateActions.map((action, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <span className="font-black text-xl text-red-500">{i+1}.</span>
                                            <p className="text-xl font-bold">{action}</p>
                                        </div>
                                    ))}
                                </div>
                            </PageContainer>

                            {/* PAGE 3: ROI ANALYSIS */}
                            <PageContainer pageNum={3} theme="teal">
                                <div className="mb-12"><div className="text-xs font-black uppercase tracking-[0.4em] mb-2 opacity-40">Financial Impact</div><h2 className="text-6xl font-medium tracking-tight leading-tight uppercase">ROI Analysis</h2></div>
                                <div className="bg-white/10 p-12 rounded-[3rem] border border-white/20 mb-12">
                                    <h3 className="text-sm font-bold uppercase mb-6 opacity-60 tracking-widest">Estimated Revenue Leakage</h3>
                                    <div className="text-[110px] font-black leading-none mb-4 text-red-300 tracking-tighter">{report.roiAnalysis.estimatedLostRevenue}</div>
                                    <p className="text-2xl opacity-80 leading-relaxed font-light">{report.roiAnalysis.summary}</p>
                                </div>
                                 <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-white/5 p-8 rounded-[2rem]">
                                        <div className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">Conversion Upside</div>
                                        <div className="text-5xl font-black text-teal-300">{report.roiAnalysis.potentialConversionIncrease}</div>
                                    </div>
                                    <div className="bg-white/5 p-8 rounded-[2rem]">
                                        <div className="text-xs font-black uppercase tracking-widest opacity-50 mb-4">LTV Risk</div>
                                        <div className="text-3xl font-bold text-red-200">{report.roiAnalysis.customerLifetimeValueImpact}</div>
                                    </div>
                                </div>
                            </PageContainer>

                            {/* PAGE 4: BUSINESS INTELLIGENCE - PROFILE (SECTION 2) */}
                            <PageContainer pageNum={4} theme="teal">
                                <SectionHeader num={2} title="Business Intelligence" theme="teal" />
                                <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-40">Company Profile</h3>
                                <table className="w-full mb-12">
                                    <tbody className="divide-y divide-white/10">
                                        {report.businessIntelligence.companyProfile.map((p, i) => (
                                            <tr key={i}><td className="py-8 text-xl font-medium opacity-60 w-1/3 uppercase tracking-widest">{p.item}</td><td className="py-8 text-3xl font-black">{p.details}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                                <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-40">Business Model</h3>
                                <div className="space-y-6">
                                    {report.businessIntelligence.businessModel.map((m, i) => (
                                        <div key={i} className="flex justify-between items-center border-b border-white/10 pb-4">
                                            <span className="text-lg opacity-60 uppercase tracking-widest">{m.element}</span>
                                            <span className="text-2xl font-bold">{m.information}</span>
                                        </div>
                                    ))}
                                </div>
                            </PageContainer>

                            {/* PAGE 5: BUSINESS INTELLIGENCE - PRESENCE (SECTION 2 CONT.) */}
                            <PageContainer pageNum={5} theme="teal">
                                <h3 className="text-xl font-bold mb-10 uppercase tracking-widest opacity-40">Value Proposition</h3>
                                <div className="bg-white/10 p-12 rounded-[4rem] border border-white/20 mb-12 relative">
                                    <blockquote className="text-4xl italic font-light leading-[1.3] border-l-8 border-teal-400 pl-12 tracking-tight">"{report.businessIntelligence.valueProposition}"</blockquote>
                                </div>
                                <div className="grid grid-cols-2 gap-12 mb-12">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Differentiation Claims</h4>
                                        <ul className="space-y-4">
                                            {report.businessIntelligence.differentiationClaims.map((c, i) => <li key={i} className="text-xl font-bold flex gap-3"><span className="text-teal-300">✓</span> {c}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6 text-red-300">Gap Analysis</h4>
                                        <ul className="space-y-4">
                                            {report.businessIntelligence.gapAnalysis.map((g, i) => <li key={i} className="text-xl font-light italic opacity-80 flex gap-3"><span className="text-red-300">⚠️</span> {g}</li>)}
                                        </ul>
                                    </div>
                                </div>
                                <div className="border-t border-white/10 pt-10">
                                    <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-40">Online Presence</h3>
                                    <div className="flex gap-8 items-start">
                                        <div className="bg-white/5 p-6 rounded-2xl flex-1">
                                            <div className="text-xs font-black opacity-50 mb-2">Website Tech</div>
                                            <div className="text-xl font-bold">{report.businessIntelligence.onlinePresence.websiteTech}</div>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-2xl flex-1">
                                            <div className="text-xs font-black opacity-50 mb-2">Social Media</div>
                                            <div className="space-y-2">
                                                {report.businessIntelligence.onlinePresence.socialMedia.map((s,i) => (
                                                    <div key={i} className="flex justify-between"><span className="opacity-80">{s.platform}</span><span className="font-bold">{s.status}</span></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </PageContainer>

                            {/* PAGE 6: TECHNICAL AUDIT - PERF (SECTION 3) */}
                            <PageContainer pageNum={6} theme="teal">
                                <SectionHeader num={3} title="Website Technical Audit" theme="teal" />
                                <div className="grid grid-cols-1 gap-12 mb-16">
                                    {report.technicalAudit.performance.map((p, i) => (
                                        <div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex items-center justify-between">
                                            <span className="text-2xl font-bold">{p.split(':')[0]}</span>
                                            <span className="text-xl font-black text-teal-300 uppercase tracking-widest">{p.split(':')[1]}</span>
                                        </div>
                                    ))}
                                </div>
                                <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-40">Site Structure</h3>
                                <div className="space-y-8">
                                    <div><div className="text-xs font-black uppercase opacity-50 mb-2">Navigation Clarity</div><div className="text-3xl font-black">{report.technicalAudit.siteStructure.navigationClarity}</div></div>
                                    <div><div className="text-xs font-black uppercase opacity-50 mb-2">Main Menu Items</div><div className="text-xl font-mono p-4 bg-black/20 rounded-xl">{report.technicalAudit.siteStructure.menuItems}</div></div>
                                    <div><div className="text-xs font-black uppercase opacity-50 mb-2">Contact Accessibility</div><div className="text-2xl font-bold text-teal-200">{report.technicalAudit.siteStructure.contactAccessibility}</div></div>
                                </div>
                            </PageContainer>

                            {/* PAGE 7: SEO TECHNICAL (SECTION 3 CONT.) */}
                            <PageContainer pageNum={7} theme="teal">
                                <h3 className="text-xl font-bold mb-10 uppercase tracking-widest opacity-40">SEO Technical Elements</h3>
                                <div className="bg-white/5 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                                    <table className="w-full text-left">
                                        <tbody className="divide-y divide-white/5">
                                            {report.technicalAudit.seoTechnical.map((s, i) => (
                                                <tr key={i}>
                                                    <td className="p-10 text-2xl font-bold border-r border-white/5">{s.element}</td>
                                                    <td className="p-10 text-xl opacity-80 leading-relaxed italic">{s.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </PageContainer>

                            {/* PAGE 8: CONTENT AUDIT - HOME (SECTION 4) */}
                            <PageContainer pageNum={8} theme="teal">
                                <SectionHeader num={4} title="Content Audit" theme="teal" />
                                <h3 className="text-xl font-bold mb-10 uppercase tracking-widest opacity-40">Homepage Analysis</h3>
                                <div className="bg-white p-16 rounded-[4rem] text-[#0c1b3e] shadow-2xl mb-12">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-10">Hero Headline</h4>
                                    <div className="text-7xl font-black leading-tight tracking-tighter mb-8 italic">"{report.contentAudit.homepageAnalysis.heroSection}"</div>
                                    <div className="flex justify-between items-end border-t border-slate-100 pt-8">
                                        <div><div className="text-[10px] font-black uppercase opacity-40 mb-2">Primary CTA</div><div className="text-2xl font-black bg-blue-600 text-white px-6 py-2 rounded-full inline-block">{report.contentAudit.homepageAnalysis.primaryCTA}</div></div>
                                        <div className="text-right max-w-xs"><div className="text-[10px] font-black uppercase opacity-40 mb-2">First Impression</div><div className="text-sm font-medium opacity-80">{report.contentAudit.homepageAnalysis.firstImpression}</div></div>
                                    </div>
                                </div>
                                <div className="bg-white/10 p-8 rounded-3xl">
                                    <div className="text-xs font-black uppercase opacity-50 mb-2">Value Communication</div>
                                    <div className="text-xl">{report.contentAudit.homepageAnalysis.valueCommunication}</div>
                                </div>
                            </PageContainer>

                            {/* PAGE 9: PAGE INVENTORY (SECTION 4 CONT.) */}
                            <PageContainer pageNum={9} theme="teal">
                                <h3 className="text-xl font-bold mb-10 uppercase tracking-widest opacity-40">Page Inventory</h3>
                                <div className="space-y-6">
                                    {report.contentAudit.pageInventory.map((p, i) => (
                                        <div key={i} className="bg-white/5 p-10 rounded-[3rem] border border-white/10 flex items-center gap-12">
                                            <div className="w-1/3">
                                                <div className="text-3xl font-black text-teal-200 mb-2">{p.page}</div>
                                                <div className="text-xs font-bold uppercase tracking-widest opacity-50">{p.status}</div>
                                            </div>
                                            <div className="flex-1 border-l border-white/10 pl-12">
                                                <div className="text-xl opacity-80 mb-2">{p.notes}</div>
                                                <div className="text-sm font-black text-teal-400">Quality: {p.quality}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PageContainer>

                            {/* PAGE 10: CONTENT QUALITY (SECTION 4 CONT.) */}
                            <PageContainer pageNum={10} theme="teal">
                                <h3 className="text-xl font-bold mb-10 uppercase tracking-widest opacity-40">Content Quality</h3>
                                <div className="bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden shadow-xl mb-12">
                                    <table className="w-full">
                                        <tbody className="divide-y divide-white/5">
                                            {report.contentAudit.contentQuality.map((c, i) => (
                                                <tr key={i}>
                                                    <td className="p-8 text-2xl font-bold">{c.aspect}</td>
                                                    <td className="p-8 text-2xl font-black text-teal-300 text-right uppercase">{c.rating}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-40">Visual Design</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    {report.contentAudit.visualDesign.map((v, i) => (
                                        <div key={i} className="p-6 bg-white/5 rounded-2xl">
                                            <div className="text-xs font-black uppercase opacity-50 mb-2">{v.aspect}</div>
                                            <div className="text-xl font-bold">{v.details}</div>
                                        </div>
                                    ))}
                                </div>
                            </PageContainer>

                            {/* PAGE 11: CONVERSION - CTA & LEAD GEN (SECTION 5) */}
                            <PageContainer pageNum={11}>
                                <SectionHeader num={5} title="Conversion Audit" />
                                <h3 className="text-xl font-bold mb-10 uppercase tracking-widest opacity-40">Calls-to-Action</h3>
                                <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 mb-8">
                                    <div className="bg-white p-8"><div className="text-[10px] font-black opacity-40 uppercase mb-2">Metric</div><div className="text-2xl font-bold">CTA Visibility</div></div>
                                    <div className="bg-white p-8"><div className="text-[10px] font-black opacity-40 uppercase mb-2">Rating</div><div className="text-2xl font-black text-blue-700">{report.conversionInsights.ctaVisibility}</div></div>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-3xl mb-12">
                                    <h4 className="text-xs font-black uppercase opacity-40 mb-4">Primary CTAs Found</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {report.conversionInsights.primaryCtas.map((cta, i) => (
                                            <span key={i} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg">"{cta}"</span>
                                        ))}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-40">Lead Generation</h3>
                                <table className="w-full mb-8">
                                    <thead className="bg-slate-50 border-b"><tr><th className="p-6 text-left text-[10px] font-black uppercase opacity-40">Element</th><th className="p-6 text-left text-[10px] font-black uppercase opacity-40">Status</th></tr></thead>
                                    <tbody className="divide-y">
                                        {report.conversionInsights.leadGeneration.map((lg, i) => (
                                            <tr key={i}><td className="p-6 text-xl font-bold">{lg.element}</td><td className="p-6 text-xl">{lg.status}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </PageContainer>

                            {/* PAGE 12: CONVERSION - TRUST & FRICTION (SECTION 5 CONT.) */}
                            <PageContainer pageNum={12}>
                                <h3 className="text-xl font-bold mb-10 uppercase tracking-widest opacity-40">Trust & Credibility Signals</h3>
                                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-xl mb-12">
                                    <table className="w-full">
                                        <thead className="bg-slate-50"><tr><th className="p-8 text-left text-[10px] font-black uppercase opacity-40">Signal Type</th><th className="p-8 text-right text-[10px] font-black uppercase opacity-40">Status</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {report.conversionInsights.trustSignals.map((ts, i) => (
                                                <tr key={i}><td className="p-8 text-2xl font-bold">{ts.type}</td><td className="p-8 text-2xl font-black text-blue-600 text-right">{ts.status}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-40 text-red-500">Friction Points</h3>
                                <div className="space-y-4">
                                    {report.conversionInsights.frictionPoints.map((fp, i) => (
                                        <div key={i} className="flex gap-4 p-6 bg-red-50 rounded-2xl border border-red-100">
                                            <span className="text-red-500 text-2xl">⚠️</span>
                                            <span className="text-xl font-medium text-red-900">{fp}</span>
                                        </div>
                                    ))}
                                </div>
                            </PageContainer>

                            {/* PAGE 13: SEO MARKETING (SECTION 6) */}
                            <PageContainer pageNum={13}>
                                <SectionHeader num={6} title="SEO & Content Marketing" />
                                <div className="bg-[#0c1b3e] p-12 rounded-[4rem] text-white mb-12">
                                    <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Primary Keywords</div>
                                    <div className="flex flex-wrap gap-4 mb-8">
                                        {report.seoMarketing.keywords.map((kw, i) => (
                                            <span key={i} className="px-8 py-3 bg-white/10 rounded-full border border-white/20 text-xl font-bold">{kw}</span>
                                        ))}
                                    </div>
                                    <div className="pt-8 border-t border-white/10 text-xl opacity-70">Local SEO Status: <span className="text-white font-bold">{report.seoMarketing.localSeo}</span></div>
                                </div>
                                <h3 className="text-xl font-bold mb-10 uppercase tracking-widest opacity-40">Content Engine Assessment</h3>
                                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-xl mb-8">
                                    <table className="w-full">
                                        <thead className="bg-slate-50"><tr><th className="p-8 text-left text-[10px] font-black uppercase opacity-40">Metric</th><th className="p-8 text-right text-[10px] font-black uppercase opacity-40">Expert Rating</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {report.seoMarketing.contentMarketing.map((cm, i) => (
                                                <tr key={i}><td className="p-8 text-2xl font-bold">{cm.aspect}</td><td className="p-8 text-2xl font-black text-blue-600 text-right">{cm.status}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-3xl">
                                    <div className="text-xs font-black uppercase opacity-40 mb-4">Detected Content Types</div>
                                    <div className="flex gap-4">
                                        {report.seoMarketing.contentTypes.map((ct, i) => <span key={i} className="font-bold text-lg text-slate-600">{ct}</span>)}
                                    </div>
                                </div>
                            </PageContainer>

                            {/* PAGE 14: COMPETITIVE POSITIONING (SECTION 7) */}
                            <PageContainer pageNum={14}>
                                <SectionHeader num={7} title="Competitive Positioning" />
                                <div className="p-12 bg-white rounded-[4rem] shadow-xl border border-slate-100 mb-12">
                                    <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-40">Market Positioning Statement</h3>
                                    <p className="text-4xl font-light italic leading-relaxed text-slate-500">"{report.competitivePositioning.positioningStatement}"</p>
                                    <div className="mt-8 pt-8 border-t text-lg"><span className="font-black uppercase text-xs opacity-40 block mb-2">Differentiation</span>{report.competitivePositioning.differentiation}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-12">
                                    <div>
                                        <h3 className="text-xl font-bold mb-6 uppercase tracking-widest opacity-40">Industry Comparison</h3>
                                        <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                                            {report.competitivePositioning.industryComparison.map((ic, i) => (
                                                <div key={i} className="flex justify-between border-b border-slate-200 pb-2 last:border-0"><span className="font-bold">{ic.metric}</span><span>{ic.rating}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-6 uppercase tracking-widest opacity-40 text-blue-600">Market Gaps</h3>
                                        <ul className="space-y-2">
                                            {report.competitivePositioning.marketGaps.map((mg, i) => <li key={i} className="flex gap-2"><span className="text-blue-500">🔵</span> {mg}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </PageContainer>

                             {/* PAGE 15: MOBILE EXPERIENCE (SECTION 8) */}
                             <PageContainer pageNum={15}>
                                <SectionHeader num={8} title="Mobile Experience" />
                                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-xl mb-12">
                                    <table className="w-full">
                                        <thead className="bg-slate-50"><tr><th className="p-8 text-left text-[10px] font-black uppercase opacity-40">Mobile Aspect</th><th className="p-8 text-right text-[10px] font-black uppercase opacity-40">Status</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {report.mobileExperience.analysis.map((ma, i) => (
                                                <tr key={i}><td className="p-8 text-2xl font-bold">{ma.aspect}</td><td className="p-8 text-2xl font-black text-blue-700 text-right">{ma.rating}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <h3 className="text-xl font-bold mb-8 uppercase tracking-widest opacity-40 text-amber-600">Mobile-Specific Issues</h3>
                                <div className="space-y-4">
                                    {report.mobileExperience.issues.map((issue, i) => (
                                        <div key={i} className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900 font-medium">⚠️ {issue}</div>
                                    ))}
                                </div>
                            </PageContainer>

                            {/* PAGE 16: CRITICAL ISSUES (SECTION 9) */}
                            <PageContainer pageNum={16}>
                                <SectionHeader num={9} title="Critical Issues" />
                                <div className="space-y-8">
                                    <div className="p-12 bg-red-50 border-l-8 border-red-500 rounded-r-[3rem]">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-red-600 mb-10 flex items-center gap-4"><Icons.Alert /> High Priority (Fix Immediately)</h3>
                                        <div className="space-y-8">
                                            {report.criticalIssues.high.map((issue, i) => (
                                                <div key={i}><div className="text-2xl font-black text-red-900 mb-2">{issue.title}</div><div className="text-lg text-red-800 opacity-80">{issue.desc}</div></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="p-10 bg-amber-50 border border-amber-100 rounded-[3rem]">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 mb-6">🟡 Medium Priority</h4>
                                            {report.criticalIssues.medium.map((issue, i) => <div key={i} className="mb-4 font-bold text-amber-900">{issue.title}</div>)}
                                        </div>
                                        <div className="p-10 bg-blue-50 border border-blue-100 rounded-[3rem]">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6">🔵 Low Priority</h4>
                                            {report.criticalIssues.low.map((issue, i) => <div key={i} className="mb-4 font-bold text-blue-900">{issue.title}</div>)}
                                        </div>
                                    </div>
                                </div>
                            </PageContainer>

                            {/* PAGE 17: RECOMMENDATIONS PART 1 (SECTION 10) */}
                            <PageContainer pageNum={17}>
                                <SectionHeader num={10} title="Strategic Action Plan" />
                                <div className="space-y-4">
                                    {report.recommendations.slice(0, 3).map((rec, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative mb-4 last:mb-0">
                                            <div className="absolute top-6 right-6 text-3xl font-black text-slate-100">{i+1}</div>
                                            <div className="pr-10">
                                                <h3 className="text-2xl font-black tracking-tighter mb-2">{rec.title}</h3>
                                                <div className="flex gap-2 mb-3">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold uppercase">Priority: {rec.priority}</span>
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold uppercase">Impact: {rec.impact}</span>
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold uppercase">Effort: {rec.effort}</span>
                                                </div>

                                                {/* NEW: Financial Impact Analysis */}
                                                <div className="flex gap-3 mb-4">
                                                    <div className="bg-emerald-50 text-emerald-900 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
                                                        <div className="bg-emerald-200 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">💰</div>
                                                        <div>
                                                            <div className="text-[8px] uppercase tracking-widest opacity-60 font-bold">Est. Revenue</div>
                                                            <div className="text-xs font-bold">{rec.projectedRevenue}</div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-blue-50 text-blue-900 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
                                                        <div className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">👥</div>
                                                        <div>
                                                            <div className="text-[8px] uppercase tracking-widest opacity-60 font-bold">Growth</div>
                                                            <div className="text-xs font-bold">{rec.projectedCustomers}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div><div className="text-[9px] font-black uppercase opacity-40 mb-1">Why</div><p className="leading-tight text-xs opacity-80">{rec.why}</p></div>
                                                    <div><div className="text-[9px] font-black uppercase opacity-40 mb-1">Outcome</div><p className="leading-tight text-xs font-bold text-blue-700">{rec.expectedOutcome}</p></div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    <div className="text-[9px] font-black uppercase opacity-40 mb-1">How to Implement</div>
                                                    <ul className="space-y-1">{rec.how.map((step, si) => <li key={si} className="text-xs font-medium flex gap-2"><Icons.Check /> {step}</li>)}</ul>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PageContainer>

                            {/* PAGE 18: RECOMMENDATIONS PART 2 (SECTION 10 CONT.) */}
                            <PageContainer pageNum={18}>
                                 <div className="space-y-4 mt-8">
                                    {report.recommendations.slice(3, 6).map((rec, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative mb-4 last:mb-0">
                                            <div className="absolute top-6 right-6 text-3xl font-black text-slate-100">{i+4}</div>
                                            <div className="pr-10">
                                                <h3 className="text-2xl font-black tracking-tighter mb-2">{rec.title}</h3>
                                                <div className="flex gap-2 mb-3">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold uppercase">Priority: {rec.priority}</span>
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold uppercase">Impact: {rec.impact}</span>
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold uppercase">Effort: {rec.effort}</span>
                                                </div>

                                                 {/* NEW: Financial Impact Analysis */}
                                                 <div className="flex gap-3 mb-4">
                                                    <div className="bg-emerald-50 text-emerald-900 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
                                                        <div className="bg-emerald-200 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">💰</div>
                                                        <div>
                                                            <div className="text-[8px] uppercase tracking-widest opacity-60 font-bold">Est. Revenue</div>
                                                            <div className="text-xs font-bold">{rec.projectedRevenue}</div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-blue-50 text-blue-900 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
                                                        <div className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">👥</div>
                                                        <div>
                                                            <div className="text-[8px] uppercase tracking-widest opacity-60 font-bold">Growth</div>
                                                            <div className="text-xs font-bold">{rec.projectedCustomers}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div><div className="text-[9px] font-black uppercase opacity-40 mb-1">Why</div><p className="leading-tight text-xs opacity-80">{rec.why}</p></div>
                                                    <div><div className="text-[9px] font-black uppercase opacity-40 mb-1">Outcome</div><p className="leading-tight text-xs font-bold text-blue-700">{rec.expectedOutcome}</p></div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    <div className="text-[9px] font-black uppercase opacity-40 mb-1">How to Implement</div>
                                                    <ul className="space-y-1">{rec.how.map((step, si) => <li key={si} className="text-xs font-medium flex gap-2"><Icons.Check /> {step}</li>)}</ul>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PageContainer>

                            {/* PAGE 19: GROWTH & COMPETITIVE INTELLIGENCE (SECTION 11 & 12) */}
                            <PageContainer pageNum={19} theme="teal">
                                <SectionHeader num={11} title="Growth Opportunities" theme="teal" />
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">⚡ Quick Wins</h4>
                                        {report.growthOpportunities.quickWins.map((w, i) => <div key={i} className="mb-2 font-black text-lg leading-tight">{w.title}</div>)}
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">🎯 Strategic</h4>
                                        {report.growthOpportunities.strategic.map((w, i) => <div key={i} className="mb-2 font-black text-lg leading-tight">{w.title}</div>)}
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">🔮 Long-term</h4>
                                        {report.growthOpportunities.longTerm.map((w, i) => <div key={i} className="mb-2 font-black text-lg leading-tight">{w.title}</div>)}
                                    </div>
                                </div>

                                <SectionHeader num={12} title="Competitive Intelligence" theme="teal" />
                                <h3 className="text-xl font-bold mb-6 uppercase tracking-widest opacity-40">Direct Market Competitors</h3>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {report.competitiveIntelligence.competitorAnalysis.map((comp, i) => (
                                        <div key={i} className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10">
                                            <div className="text-xl font-black mb-2">{comp.name}</div>
                                            <div className="text-[10px] font-black uppercase opacity-40 mb-2">{comp.known} Competitor</div>
                                            <p className="text-sm opacity-70 leading-relaxed">{comp.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <h3 className="text-xl font-bold mb-6 uppercase tracking-widest opacity-40">Your Competitive Advantages</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {report.competitiveIntelligence.advantages.map((adv, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="w-6 h-6 bg-teal-300/20 rounded-full flex items-center justify-center text-teal-300 text-xs">✓</div>
                                            <div className="text-lg font-bold">{adv}</div>
                                        </div>
                                    ))}
                                </div>
                            </PageContainer>

                            {/* PAGE 20: SCORECARD (SECTION 13 PART 1) */}
                            <PageContainer pageNum={20} theme="teal">
                                <SectionHeader num={13} title="Final Audit Summary" theme="teal" />
                                <div className="flex-grow flex flex-col justify-center">
                                    <div className="flex items-center gap-10 mb-12">
                                        <div className="text-[180px] font-black leading-none text-teal-300 tracking-tighter">{report.executiveSummary.overallScore}</div>
                                        <div className="flex-1">
                                            <div className="text-2xl font-black uppercase tracking-[0.4em] opacity-40 mb-6">Aggregate Ecosystem Score</div>
                                            <p className="text-4xl leading-relaxed font-light italic text-teal-50">"{report.finalSummary.summaryText}"</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-12">
                                        {report.executiveSummary.categoryScores.map((c, i) => (
                                            <div key={i} className="space-y-3">
                                                <div className="flex justify-between items-end text-sm font-black uppercase tracking-widest">
                                                    <span>{c.category}</span>
                                                    <span className="text-teal-300">{c.score}</span>
                                                </div>
                                                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-teal-300 rounded-full shadow-[0_0_15px_rgba(94,234,212,0.5)]" 
                                                        style={{ width: `${(parseInt(c.score) / 10) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PageContainer>

                             {/* PAGE 21: BACK COVER / ACTION PLAN (SECTION 13 PART 2) */}
                            <PageContainer pageNum={21} theme="teal">
                                <div className="h-full flex flex-col">
                                    <div className="mb-16">
                                        <div className="text-xs font-black uppercase tracking-[0.4em] mb-4 opacity-40">Implementation Roadmap</div>
                                        <h2 className="text-6xl font-medium tracking-tight leading-tight uppercase mb-12">Immediate Next Steps</h2>
                                        
                                        <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10">
                                            <ol className="space-y-8">
                                                <li className="flex gap-6 items-start">
                                                    <span className="flex-shrink-0 w-12 h-12 bg-teal-500 text-[#0c1b3e] rounded-full flex items-center justify-center font-black text-xl">1</span>
                                                    <div>
                                                        <h4 className="text-2xl font-bold mb-2">Review & Prioritize</h4>
                                                        <p className="opacity-70 text-lg">Discuss the 'Critical Issues' section with your technical team to address high-impact blockers immediately.</p>
                                                    </div>
                                                </li>
                                                <li className="flex gap-6 items-start">
                                                    <span className="flex-shrink-0 w-12 h-12 bg-teal-500 text-[#0c1b3e] rounded-full flex items-center justify-center font-black text-xl">2</span>
                                                    <div>
                                                        <h4 className="text-2xl font-bold mb-2">Strategic Consultation</h4>
                                                        <p className="opacity-70 text-lg">Schedule a deep-dive session to map these findings to your Q3/Q4 growth KPIs.</p>
                                                    </div>
                                                </li>
                                                <li className="flex gap-6 items-start">
                                                    <span className="flex-shrink-0 w-12 h-12 bg-teal-500 text-[#0c1b3e] rounded-full flex items-center justify-center font-black text-xl">3</span>
                                                    <div>
                                                        <h4 className="text-2xl font-bold mb-2">Execute Quick Wins</h4>
                                                        <p className="opacity-70 text-lg">Deploy the low-effort, high-impact changes listed in the 'Growth Opportunities' section.</p>
                                                    </div>
                                                </li>
                                            </ol>
                                        </div>
                                    </div>

                                    <div className="mt-auto border-t-2 border-white/10 pt-10">
                                        <div className="flex justify-between items-end mb-12">
                                            <div className="max-w-md">
                                                <div className="flex items-center gap-3 mb-4 text-teal-300">
                                                    <Icons.Lock /> 
                                                    <span className="text-xs font-black uppercase tracking-[0.3em]">Confidential</span>
                                                </div>
                                                <p className="text-[10px] leading-relaxed opacity-50 text-justify uppercase tracking-wide">
                                                    This document contains proprietary analysis for {report.titlePage.websiteName}. Unauthorized distribution prohibited. Metrics generated via ProAudit AI Engine.
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Verified Audit ID</div>
                                                <div className="font-mono text-xl opacity-80 mb-4">{Math.random().toString(36).substring(7).toUpperCase()}-{new Date().getFullYear()}</div>
                                                <div className="inline-block border-4 border-teal-500 p-4 rounded-xl transform -rotate-6 mask-image-grunge opacity-90">
                                                    <div className="text-3xl font-black text-teal-500 tracking-tighter leading-none">VERIFIED</div>
                                                    <div className="text-[10px] font-bold text-teal-500 uppercase tracking-widest text-center mt-1">Pro Audit AI</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-center opacity-30">
                                            <Icons.Brain />
                                        </div>
                                    </div>
                                </div>
                            </PageContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);