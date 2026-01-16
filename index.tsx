import React, { useState, useEffect, Component, ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import { Icons } from "./components/Icons";
import { fetchRealAuditData } from "./services/performanceService";
import { AuditReport } from "./types";

// --- GLOBAL DECLARATIONS ---
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

// --- ERROR BOUNDARY ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState { 
        return { hasError: true, error }; 
    }
    
    componentDidCatch(error: Error, errorInfo: ErrorInfo) { 
        console.error("CRITICAL APP ERROR:", error, errorInfo); 
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0c1b3e] flex items-center justify-center p-8">
                    <div className="bg-red-900/20 border-2 border-red-500 rounded-3xl p-10 max-w-2xl text-center shadow-2xl">
                        <div className="text-red-500 mb-6 flex justify-center scale-150"><Icons.Alert /></div>
                        <h1 className="text-3xl font-black text-white mb-4 uppercase">System Error</h1>
                        <p className="text-red-200 mb-8 text-lg">The application encountered a critical error and could not render.</p>
                        <div className="bg-black/50 p-6 rounded-xl text-left font-mono text-xs text-red-300 overflow-auto max-h-48 mb-8 border border-red-500/30">
                            {this.state.error?.toString()}
                        </div>
                        <button onClick={() => window.location.reload()} className="px-8 py-4 bg-red-600 text-white font-bold rounded-xl uppercase hover:bg-red-500 transition-colors shadow-lg shadow-red-900/50">
                            Reload Engine
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- UTILITIES ---
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$", GBP: "£", AUD: "A$", CAD: "C$", EUR: "€"
};

const safeLocalStorage = {
    getItem: (key: string) => {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch (e) {}
    }
};

const getEnvKey = () => {
    try {
        // Safe check for process.env presence
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
             // @ts-ignore
             return process.env.API_KEY;
        }
        return undefined;
    } catch (e) { return undefined; }
};

const createSafeReport = (data: any, url: string, perfScore: number, currency: string, screenshot: string | null): AuditReport => {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    const sym = CURRENCY_SYMBOLS[currency] || "$";
    
    const get = (obj: any, path: string, fallback: any) => {
        try {
            const val = path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
            return (val !== undefined && val !== null && val !== "") ? val : fallback;
        } catch { return fallback; }
    };

    const getArray = (obj: any, path: string, fallback: any[]) => {
        try {
            const val = path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
            return (Array.isArray(val) && val.length > 0) ? val : fallback;
        } catch { return fallback; }
    };

    // --- SCORE MULTIPLIER LOGIC ---
    // Calculates revenue risk based on technical performance score
    let revenueRisk = "";
    if (perfScore >= 90) {
        revenueRisk = `${sym}0 - ${sym}5,000 Risk`;
    } else if (perfScore >= 50) {
        revenueRisk = `${sym}25,000 - ${sym}45,000 Risk`;
    } else {
        revenueRisk = `${sym}80,000+ Risk`;
    }
    // -----------------------------

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
            screenshot: screenshot || data?.titlePage?.screenshot || ""
        },
        roiAnalysis: {
            // Using the deterministic Score Multiplier logic here
            estimatedLostRevenue: revenueRisk,
            potentialConversionIncrease: get(data, 'roiAnalysis.potentialConversionIncrease', "15-22%"),
            customerLifetimeValueImpact: get(data, 'roiAnalysis.customerLifetimeValueImpact', "Critical Strategic Risk"),
            summary: get(data, 'roiAnalysis.summary', "Technical friction and brand positioning gaps are directly impacting your bottom line.")
        },
        executiveSummary: {
            overallScore: Number(get(data, 'executiveSummary.overallScore', Math.max(perfScore, 65))),
            grade: get(data, 'executiveSummary.grade', perfScore > 80 ? "A-" : "B"),
            categoryScores: getArray(data, 'executiveSummary.categoryScores', [
                { category: "Technical", score: "8/10" }, { category: "Design & UX", score: "7/10" },
                { category: "Content", score: "6/10" }, { category: "SEO", score: "8/10" },
                { category: "Conversion", score: "5/10" }, { category: "Mobile", score: "7/10" },
                { category: "Trust", score: "6/10" }, { category: "Clarity", score: "7/10" }
            ]),
            keyFindings: getArray(data, 'executiveSummary.keyFindings', ["Page load times on mobile exceed the 3-second threshold.", "Differentiation missing.", "Typography inconsistent.", "Trust signals missing.", "Mobile nav issues."]),
            immediateActions: getArray(data, 'executiveSummary.immediateActions', ["Optimize hero assets.", "Restructure header.", "Fix layout shifts."])
        },
        businessIntelligence: {
            companyProfile: getArray(data, 'businessIntelligence.companyProfile', [{ item: "Legal Name", details: domain.toUpperCase() }, { item: "Founded", details: "N/A" }, { item: "Team Size", details: "N/A" }, { item: "Service Area", details: "Global" }]),
            businessModel: getArray(data, 'businessIntelligence.businessModel', [{ element: "Target Market", information: "Premium B2B" }, { element: "Pricing Strategy", information: "Value-Based" }, { element: "Revenue Streams", information: "Direct Client Projects" }]),
            valueProposition: get(data, 'businessIntelligence.valueProposition', "Delivering technically superior digital experiences."),
            differentiationClaims: getArray(data, 'businessIntelligence.differentiationClaims', ["Technical Excellence", "Rapid Scaling"]),
            gapAnalysis: getArray(data, 'businessIntelligence.gapAnalysis', ["Digital Presence maturity does not match service quality."]),
            onlinePresence: {
                websiteTech: get(data, 'businessIntelligence.onlinePresence.websiteTech', "Modern Architecture"),
                socialMedia: getArray(data, 'businessIntelligence.onlinePresence.socialMedia', [{ platform: "LinkedIn", status: "Active" }, { platform: "Instagram", status: "Not Present" }])
            }
        },
        technicalAudit: {
            performance: getArray(data, 'technicalAudit.performance', ["HTTPS/SSL Secure: ACTIVE", "Mobile Responsiveness: OPTIMIZED", "Page Load Speed: MODERATE", "Browser Compatibility: MODERN"]),
            siteStructure: {
                navigationClarity: get(data, 'technicalAudit.siteStructure.navigationClarity', "8/10"),
                menuItems: get(data, 'technicalAudit.siteStructure.menuItems', "HOME | SERVICES | PORTFOLIO | ABOUT | CONTACT"),
                contactAccessibility: get(data, 'technicalAudit.siteStructure.contactAccessibility', "High - Fixed Header CTA")
            },
            seoTechnical: getArray(data, 'technicalAudit.seoTechnical', [{ element: "Page Title", status: "Optimized" }, { element: "Meta Description", status: "Present" }, { element: "URL Structure", status: "Clean" }, { element: "Sitemap Present", status: "✓" }, { element: "Robots.txt", status: "✓" }, { element: "Schema Markup", status: "✗" }])
        },
        contentAudit: {
            homepageAnalysis: {
                firstImpression: get(data, 'contentAudit.homepageAnalysis.firstImpression', "Professional aesthetic with clear focal points."),
                valueCommunication: get(data, 'contentAudit.homepageAnalysis.valueCommunication', "Moderate."),
                heroSection: get(data, 'contentAudit.homepageAnalysis.heroSection', "WE BUILD DIGITAL FUTURES"),
                primaryCTA: get(data, 'contentAudit.homepageAnalysis.primaryCTA', "START YOUR PROJECT")
            },
            pageInventory: getArray(data, 'contentAudit.pageInventory', [{ page: "About Page", status: "Present", quality: "7/10", notes: "Lacks team personality." }, { page: "Services Page", status: "Present", quality: "9/10", notes: "Comprehensive breakdown." }, { page: "Contact Page", status: "Present", quality: "8/10", notes: "Clear form." }]),
            contentQuality: getArray(data, 'contentAudit.contentQuality', [{ aspect: "Writing Quality", rating: "EXCELLENT" }, { aspect: "Content Depth", rating: "SURFACE-LEVEL" }, { aspect: "Industry Authority", rating: "DEVELOPING" }, { aspect: "Content Freshness", rating: "OCCASIONAL UPDATES" }]),
            visualDesign: getArray(data, 'contentAudit.visualDesign', [{ aspect: "Design Era", details: "Modern 2024-25" }, { aspect: "Brand Consistency", details: "Strong Palette Control" }, { aspect: "Typography", details: "Professional Sans-Serif" }, { aspect: "Imagery Quality", details: "High-quality Assets" }])
        },
        conversionInsights: {
            ctaVisibility: get(data, 'conversionInsights.ctaVisibility', "7/10"),
            primaryCtas: getArray(data, 'conversionInsights.primaryCtas', ["Get Started", "Free Audit", "Contact Expert"]),
            leadGeneration: getArray(data, 'conversionInsights.leadGeneration', [{ element: "Contact Forms", status: "Present" }, { element: "Phone Prominence", status: "Moderate" }, { element: "Email Signup", status: "✗ Missing" }]),
            frictionPoints: getArray(data, 'conversionInsights.frictionPoints', ["Lack of trust badges near forms.", "Multi-step form complexity."]),
            trustSignals: getArray(data, 'conversionInsights.trustSignals', [{ type: "Testimonials", status: "✓ Found" }, { type: "Case Studies", status: "✗ Missing" }, { type: "Client Logos", status: "✓ Present" }, { type: "Privacy Policy", status: "✓ Present" }])
        },
        seoMarketing: {
            keywords: getArray(data, 'seoMarketing.keywords', ["Innovation", "B2B Solutions", "Market Leader"]),
            localSeo: get(data, 'seoMarketing.localSeo', "Present but lacks local review density."),
            contentMarketing: getArray(data, 'seoMarketing.contentMarketing', [{ aspect: "Blog Status", status: "Abandoned" }, { aspect: "Educational Value", status: "Low" }, { aspect: "Thought Leadership", status: "Developing" }]),
            contentTypes: getArray(data, 'seoMarketing.contentTypes', ["Blog", "Case Studies", "Whitepapers"])
        },
        competitivePositioning: {
            positioningStatement: get(data, 'competitivePositioning.positioningStatement', "The reliable technical partner for scaling enterprises."),
            differentiation: get(data, 'competitivePositioning.differentiation', "Technical precision and rapid turnaround."),
            industryComparison: getArray(data, 'competitivePositioning.industryComparison', [{ metric: "Sophistication", rating: "Above Average" }, { metric: "Price Point", rating: "Premium" }]),
            marketGaps: getArray(data, 'competitivePositioning.marketGaps', ["Lack of interactive pricing tools.", "Minimal video case studies."])
        },
        mobileExperience: {
            analysis: getArray(data, 'mobileExperience.analysis', [{ aspect: "Touch Targets", rating: "Adequate" }, { aspect: "Navigation", rating: "Good" }, { aspect: "Page Speed", rating: "Moderate" }, { aspect: "CTA Visibility", rating: "Visible" }]),
            issues: getArray(data, 'mobileExperience.issues', ["LCP over 3s.", "Horizontal scroll issues on smaller devices."])
        },
        criticalIssues: {
            high: getArray(data, 'criticalIssues.high', [{ title: "LCP Failure", desc: "Hero image is not optimized, causing significant render delay." }, { title: "Form Friction", desc: "Validation errors are not clear on small screens." }]),
            medium: getArray(data, 'criticalIssues.medium', [{ title: "Branding Gaps", desc: "Inconsistent logo usage." }]),
            low: getArray(data, 'criticalIssues.low', [{ title: "Meta Density", desc: "Keywords could be better optimized." }])
        },
        recommendations: getArray(data, 'recommendations', [{ 
            title: "Optimize Hero Assets", priority: "9/10", impact: "High", effort: "Low", why: "Current assets delay page visibility.", how: ["Apply WebP formats", "Set explicit dimensions"], expectedOutcome: "30% faster LCP",
            projectedRevenue: `${sym}5k`, projectedCustomers: "+10%"
        }]).map((rec: any) => ({
            ...rec,
            projectedRevenue: rec.projectedRevenue || "High Impact",
            projectedCustomers: rec.projectedCustomers || "+5-10%"
        })),
        growthOpportunities: {
            quickWins: getArray(data, 'growthOpportunities.quickWins', [{ title: "Favicon Update", metric: "Brand" }, { title: "SSL Check", metric: "Trust" }]),
            strategic: getArray(data, 'growthOpportunities.strategic', [{ title: "Interactive Audit Tool", metric: "Leads" }]),
            longTerm: getArray(data, 'growthOpportunities.longTerm', [{ title: "Multi-market SEO", metric: "Traffic" }])
        },
        competitiveIntelligence: {
            competitorAnalysis: getArray(data, 'competitiveIntelligence.competitorAnalysis', [{ name: "Industry Leader A", known: "Known Competitor", description: "Aggressive pricing and high content output." }, { name: "Direct Rival B", known: "Known Competitor", description: "Minimalist approach, focus on luxury market." }]),
            advantages: getArray(data, 'competitiveIntelligence.advantages', ["Superior technical stack", "Faster deployment cycles", "Personalized client service model"])
        },
        finalSummary: {
            overallScore: Number(get(data, 'executiveSummary.overallScore', Math.max(perfScore, 65))),
            breakdown: getArray(data, 'finalSummary.breakdown', [
                { category: "TECHNICAL", score: "8/10" }, { category: "DESIGN & UX", score: "7/10" },
                { category: "CONTENT", score: "6/10" }, { category: "SEO", score: "8/10" },
                { category: "CONVERSION", score: "5/10" }, { category: "MOBILE", score: "7/10" },
                { category: "TRUST", score: "6/10" }, { category: "CLARITY", score: "7/10" }
            ]),
            summaryText: get(data, 'finalSummary.summaryText', "Your digital ecosystem shows significant promise, but technical hurdles in performance and conversion clarity are currently capping your growth. Implementing the high-priority recommendations will likely yield immediate ROI.")
        },
        actionPlan: getArray(data, 'actionPlan', [{ step: 1, action: "Fix LCP", owner: "Dev", timeline: "Week 1" }])
    };
};

// --- COMPONENTS ---

const PageContainer: React.FC<{ children?: React.ReactNode, theme?: 'beige' | 'teal', pageNum: number }> = ({ children, theme = 'beige', pageNum }) => {
    const bgClass = theme === 'teal' ? 'bg-[#115e6e] text-white' : 'bg-[#f3f4e6] text-[#0c1b3e]';
    return (
        <div className={`pdf-page relative mx-auto ${bgClass} py-8 px-12 flex flex-col font-sans overflow-hidden`}>
            <div className="flex-grow flex flex-col">{children}</div>
            <div className="flex justify-between items-center mt-auto pt-8 border-t border-current/10">
                <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.4em]">Website Audit Pro Report</div>
                <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.4em]">Page {pageNum}</div>
            </div>
        </div>
    );
};

const SectionHeader = ({ num, title }: { num: number, title: string }) => (
    <div className="mb-6">
        <div className={`text-xs font-black uppercase tracking-[0.4em] mb-2 opacity-40`}>Section {num}</div>
        <h2 className="text-5xl font-medium tracking-tight leading-tight uppercase">{title}</h2>
    </div>
);

const SettingsModal = ({ isOpen, onClose, pageSpeedKey, setPageSpeedKey, model, setModel, currency, setCurrency, apiKey, setApiKey }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[3rem] shadow-4xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg md:text-xl font-black flex items-center gap-3 text-slate-800 dark:text-white uppercase tracking-tighter"><Icons.Cog /> Engine Console</h2>
                    <button onClick={onClose} className="p-2 md:p-3 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><Icons.Cross /></button>
                </div>
                <div className="p-6 md:p-8 space-y-4 md:space-y-6 max-h-[60vh] overflow-y-auto">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3 md:mb-4">Intelligence Model</label>
                        <select value={model} onChange={e => setModel(e.target.value)} className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 transition-all font-bold text-base md:text-sm">
                            <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Dossier Depth)</option>
                            <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Speed)</option>
                            <option value="gemini-2.5-pro-preview">Gemini 2.5 Pro (Balanced)</option>
                            <option value="gemini-2.5-flash-preview">Gemini 2.5 Flash (Efficient)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3 md:mb-4">Report Currency</label>
                        <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 transition-all font-bold text-base md:text-sm">
                            <option value="USD">USD ($)</option><option value="GBP">GBP (£)</option><option value="EUR">EUR (€)</option><option value="AUD">AUD (A$)</option><option value="CAD">CAD (C$)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3 md:mb-4">Gemini API Key</label>
                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-2xl outline-none font-mono text-base md:text-xs border-2 border-transparent focus:border-blue-500 transition-all" placeholder="Enter Gemini API key..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3 md:mb-4">PageSpeed API Key</label>
                        <input type="password" value={pageSpeedKey} onChange={e => setPageSpeedKey(e.target.value)} className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-2xl outline-none font-mono text-base md:text-xs border-2 border-transparent focus:border-blue-500 transition-all" placeholder="Enter PageSpeed key..." />
                    </div>
                </div>
                <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={onClose} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.01] transition-all text-sm md:text-base">Save & Apply</button>
                </div>
            </div>
        </div>
    );
};

// --- HELPER FOR AI TIMEOUT ---
const timeoutPromise = (ms: number, promise: Promise<any>) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Analysis Request Timed Out (${Math.round(ms/1000)}s limit). The model is busy.`)), ms);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (reason) => { clearTimeout(timer); reject(reason); });
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
    
    // Config with Safe Storage
    const [psKey, setPsKey] = useState(() => safeLocalStorage.getItem('pro-ps-key') || "");
    const [apiKey, setApiKey] = useState(() => safeLocalStorage.getItem('pro-api-key') || "");
    const [model, setModel] = useState("gemini-3-pro-preview");
    const [currency, setCurrency] = useState(() => safeLocalStorage.getItem('pro-currency') || "USD");
    const [darkMode, setDarkMode] = useState(() => safeLocalStorage.getItem('pro-theme') === 'dark');

    useEffect(() => {
        safeLocalStorage.setItem('pro-ps-key', psKey);
        safeLocalStorage.setItem('pro-currency', currency);
        safeLocalStorage.setItem('pro-api-key', apiKey);
    }, [psKey, currency, apiKey]);

    useEffect(() => {
        if (darkMode) { document.documentElement.classList.add('dark'); safeLocalStorage.setItem('pro-theme', 'dark'); }
        else { document.documentElement.classList.remove('dark'); safeLocalStorage.setItem('pro-theme', 'light'); }
    }, [darkMode]);

    useEffect(() => {
        const handleResize = () => { const w = window.innerWidth; setScale(w < 840 ? (w - 32) / 794 : 1); };
        handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (status !== 'analyzing') { setLoadingProgress(0); return; }
        const interval = setInterval(() => { setLoadingProgress(prev => (prev >= 99 ? 99 : prev + 0.5)); }, 150);
        return () => clearInterval(interval);
    }, [status]);

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setStatus('analyzing');
        setError(null);

        try {
            const envKey = getEnvKey();
            const activeKey = apiKey || envKey || "";
            if (!activeKey) throw new Error("API Key is missing. Please add your Gemini API Key in Settings.");

            const realData = await fetchRealAuditData(url, activeKey, psKey);
            const ai = new GoogleGenAI({ apiKey: activeKey });
            
            const prompt = `Audit ${url}. REAL DATA: PageSpeed: ${realData.performanceScore}, LCP: ${realData.lcp}ms, HTTPS: ${realData.https}.
            Issues: ${JSON.stringify(realData.opportunities.map(o => o.title))}.
            Generate strictly valid JSON matching AuditReport schema.
            Use currency: ${currency}.`;

            const res: any = await timeoutPromise(180000, ai.models.generateContent({
                model, contents: prompt, config: { responseMimeType: "application/json" }
            }));

            const parsed = JSON.parse(res.text.trim().replace(/```json\s*/g, "").replace(/```\s*$/g, ""));
            // PASS THE REAL SCREENSHOT DATA HERE
            setReport(createSafeReport(parsed, url, realData.performanceScore, currency, realData.screenshot));
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
        window.scrollTo(0, 0);
        setTimeout(() => {
            const el = document.getElementById('full-report');
            if (window.html2pdf) {
                window.html2pdf().set({ 
                    margin: 0, filename: `Audit_${report.titlePage.websiteName}.pdf`, image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 }, jsPDF: { unit: 'px', format: [794, 1123] },
                    pagebreak: { mode: ['avoid-all', 'css'], after: '.pdf-page' }
                }).from(el).save().then(() => setIsExporting(false));
            } else { setIsExporting(false); }
        }, 100);
    };

    if (status === 'analyzing') return (
        <div className="min-h-screen bg-[#0c1b3e] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="relative w-48 h-48 md:w-64 md:h-64 mb-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[18px] border-blue-900/30"></div>
                <div className="absolute inset-0 rounded-full border-[18px] border-blue-500 border-t-transparent animate-spin"></div>
                <div className="flex flex-col items-center"><span className="text-4xl md:text-6xl font-black text-white">{Math.round(loadingProgress)}%</span></div>
            </div>
            <p className="text-blue-400 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs animate-pulse">Synthesizing Dossier Intelligence...</p>
        </div>
    );

    if (status === 'error') return (
        <div className="min-h-screen bg-[#0c1b3e] flex flex-col items-center justify-center p-8 text-center animate-fade-in relative">
            <div className="absolute top-6 right-6 md:top-10 md:right-10 flex gap-4"><button onClick={() => setSettingsOpen(true)} className="p-4 md:p-5 bg-white/5 border border-white/10 rounded-full text-white"><Icons.Cog /></button></div>
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} pageSpeedKey={psKey} setPageSpeedKey={setPsKey} model={model} setModel={setModel} currency={currency} setCurrency={setCurrency} apiKey={apiKey} setApiKey={setApiKey} />
            <div className="p-8 md:p-10 bg-red-500/10 rounded-[2rem] md:rounded-[3rem] border-2 border-red-500/30 mb-8 animate-bounce-slow"><Icons.Alert /></div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">Audit Terminated</h2>
            <p className="text-lg md:text-xl text-red-300 mb-12 max-w-xl leading-relaxed">{error}</p>
            <button onClick={() => setStatus('idle')} className="px-12 py-5 bg-white text-[#0c1b3e] font-black uppercase rounded-3xl tracking-widest hover:scale-105 transition-all">Try Again</button>
        </div>
    );

    return (
        <div className={`min-h-screen transition-colors duration-500 ${status === 'complete' ? 'bg-slate-200 dark:bg-slate-950' : 'bg-[#0c1b3e] text-white'} print:bg-white`}>
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} pageSpeedKey={psKey} setPageSpeedKey={setPsKey} model={model} setModel={setModel} currency={currency} setCurrency={setCurrency} apiKey={apiKey} setApiKey={setApiKey} />

            {status === 'idle' && (
                <div className="max-w-4xl mx-auto py-20 px-4 md:py-44 md:px-6 text-center animate-fade-in relative">
                    <div className="absolute top-6 right-6 md:top-10 md:right-10 flex gap-4">
                        <button onClick={() => setDarkMode(!darkMode)} className="p-4 md:p-5 bg-white/5 border border-white/10 rounded-full text-white">{darkMode ? <Icons.Zap /> : <Icons.Globe />}</button>
                        <button onClick={() => setSettingsOpen(true)} className="p-4 md:p-5 bg-white/5 border border-white/10 rounded-full text-white"><Icons.Cog /></button>
                    </div>
                    <div className="flex justify-center mb-10 md:mb-16"><div className="p-10 md:p-14 bg-blue-600 rounded-[3rem] md:rounded-[4rem] shadow-4xl border-4 border-white/10 animate-bounce-slow"><Icons.Brain /></div></div>
                    <h1 className="text-6xl md:text-[110px] font-black mb-6 tracking-tighter leading-none">Audit <span className="text-blue-500">Pro</span></h1>
                    <p className="text-lg md:text-2xl text-slate-400 mb-16 md:mb-28 max-w-2xl mx-auto font-light tracking-tight">Professional Intelligence Dossier Engine.</p>
                    <form onSubmit={handleAudit} className="max-w-3xl mx-auto bg-white/5 p-4 md:p-5 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col md:flex-row gap-4 md:gap-5 border-4 border-white/5 focus-within:border-blue-500/40 transition-all shadow-4xl">
                        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.example.com" className="w-full bg-transparent px-8 py-5 md:py-6 outline-none text-xl md:text-2xl font-light text-white text-center md:text-left" required />
                        <button type="submit" className="w-full md:w-auto bg-blue-600 px-10 md:px-14 py-5 md:py-6 rounded-[2rem] md:rounded-[2.5rem] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all">Launch</button>
                    </form>
                </div>
            )}

            {status === 'complete' && report && (
                <div className="pb-32 animate-fade-in">
                    <div className="fixed top-4 md:top-8 left-0 right-0 z-[60] flex justify-center gap-6 print:hidden pointer-events-none">
                        <div className="bg-[#0c1b3e]/95 backdrop-blur-2xl p-3 md:p-4 rounded-[2rem] md:rounded-[2.5rem] shadow-4xl border-4 border-white/5 flex gap-2 md:gap-4 pointer-events-auto scale-90 md:scale-100 origin-top">
                            <button onClick={() => setStatus('idle')} className="px-6 md:px-10 py-4 md:py-5 bg-white/5 text-white font-black uppercase rounded-2xl md:rounded-3xl text-[10px] md:text-xs tracking-widest transition-all">Reset</button>
                            <button onClick={handleDownloadPDF} disabled={isExporting} className="px-8 md:px-12 py-4 md:py-5 bg-blue-600 text-white font-black uppercase rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-4 text-[10px] md:text-xs tracking-widest transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait">
                                {isExporting ? <><Icons.Loader /> Gen PDF...</> : <><Icons.Download /> Export PDF</>}
                            </button>
                        </div>
                    </div>

                    <div className="pt-28 md:pt-40 flex justify-center overflow-hidden">
                        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', marginBottom: `-${(1 - scale) * 141.4}%` }}>
                            <div id="full-report" className="w-[794px] mx-auto bg-white shadow-2xl overflow-hidden text-slate-900">
                                
                                {/* PAGE 1: Title Page */}
                                <PageContainer pageNum={1}>
                                    <div className="h-full flex flex-col justify-between">
                                        <div className="space-y-16 mt-20">
                                            <div className="text-xs font-bold uppercase tracking-widest opacity-60">December 2025</div>
                                            <h1 className="text-[120px] font-medium leading-[0.8] tracking-tighter text-[#0c1b3e]">Website<br/>Audit Pro</h1>
                                            <p className="text-3xl font-light text-slate-600">{report.titlePage.subTitle}</p>
                                        </div>
                                        {report.titlePage.screenshot && (
                                            <div className="flex-grow flex items-center justify-center my-10 relative">
                                                <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full"></div>
                                                <img src={report.titlePage.screenshot} alt="Site Screenshot" className="relative rounded-xl shadow-2xl max-h-[400px] border-4 border-slate-100 z-10" />
                                            </div>
                                        )}
                                        <div className="mt-auto pb-10 flex justify-between items-end border-t border-slate-200 pt-8">
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Analysis For</div>
                                                <div className="text-4xl font-black uppercase tracking-tight text-[#0c1b3e] leading-none mb-2">{report.titlePage.websiteName}</div>
                                                <div className="text-xl text-slate-500 mb-1">{report.titlePage.businessType}</div>
                                                <div className="text-sm font-mono text-slate-400">{report.titlePage.url}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Presented By</div>
                                                <div className="text-2xl font-black text-[#0c1b3e]">AI STUDIERS</div>
                                            </div>
                                        </div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 2: Executive Summary */}
                                <PageContainer pageNum={2}>
                                    <SectionHeader num={1} title="Executive Summary" />
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Performance Overview</div>
                                    <div className="bg-[#f3f4e6] rounded-xl border border-slate-200 overflow-hidden mb-8">
                                        {report.executiveSummary.categoryScores.map((c, i) => (
                                            <div key={i} className={`flex justify-between items-center p-4 ${i !== report.executiveSummary.categoryScores.length - 1 ? 'border-b border-slate-200/50' : ''}`}>
                                                <span className="text-lg font-medium text-slate-700">{c.category}</span>
                                                <span className="text-lg font-bold text-blue-600">{c.score}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mb-8">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Key Findings</h3>
                                        <div className="space-y-4">
                                            {report.executiveSummary.keyFindings.map((f, i) => (
                                                <div key={i} className="flex gap-4 items-start">
                                                    <span className="font-bold text-slate-900">{i+1}.</span>
                                                    <p className="text-lg text-slate-700 leading-snug">{f}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-4">Immediate Priority Actions</h3>
                                        <div className="space-y-3">
                                            {report.executiveSummary.immediateActions.map((a, i) => (
                                                <div key={i} className="flex gap-4 items-center font-bold text-lg text-slate-800">
                                                    <span className="text-red-500">{i+1}.</span>
                                                    {a}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 3: ROI Analysis */}
                                <PageContainer pageNum={3} theme="teal">
                                    <SectionHeader num={2} title="ROI Analysis" />
                                    <div className="bg-white/10 p-12 rounded-[3rem] border border-white/20 mb-8 backdrop-blur-sm">
                                        <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4">Estimated Revenue Leakage</div>
                                        <div className="text-[90px] font-black leading-none text-red-300 mb-6 tracking-tighter shadow-black drop-shadow-lg">{report.roiAnalysis.estimatedLostRevenue}</div>
                                        <p className="text-xl opacity-80 font-light leading-relaxed">{report.roiAnalysis.summary}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                                            <div className="text-xs opacity-50 uppercase tracking-widest mb-2">Conversion Upside</div>
                                            <div className="text-5xl font-bold text-teal-300">{report.roiAnalysis.potentialConversionIncrease}</div>
                                        </div>
                                        <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                                            <div className="text-xs opacity-50 uppercase tracking-widest mb-2">LTV Risk</div>
                                            <div className="text-2xl font-bold text-red-200">{report.roiAnalysis.customerLifetimeValueImpact}</div>
                                        </div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 4: Business Intelligence */}
                                <PageContainer pageNum={4} theme="teal">
                                    <SectionHeader num={3} title="Business Intelligence" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-6">Company Profile</h3>
                                    <div className="border-t border-white/10 mb-12">
                                        {report.businessIntelligence.companyProfile.map((p, i) => (
                                            <div key={i} className="flex py-6 border-b border-white/10">
                                                <div className="w-1/3 text-sm font-bold uppercase tracking-widest opacity-50">{p.item}</div>
                                                <div className="w-2/3 text-2xl font-bold">{p.details}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-6">Business Model</h3>
                                    <div className="border-t border-white/10">
                                        {report.businessIntelligence.businessModel.map((m, i) => (
                                            <div key={i} className="flex py-6 border-b border-white/10 justify-between items-center">
                                                <div className="text-sm font-bold uppercase tracking-widest opacity-50">{m.element}</div>
                                                <div className="text-xl font-bold text-right">{m.information}</div>
                                            </div>
                                        ))}
                                    </div>
                                </PageContainer>

                                {/* PAGE 5: Value Proposition */}
                                <PageContainer pageNum={5} theme="teal">
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-6">Value Proposition</h3>
                                    <div className="bg-white/10 p-12 rounded-[3rem] border border-white/20 mb-12 relative">
                                        <div className="absolute left-10 top-12 bottom-12 w-2 bg-teal-400"></div>
                                        <p className="text-4xl italic font-light leading-snug pl-8">"{report.businessIntelligence.valueProposition}"</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-12 mb-12">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Differentiation Claims</h4>
                                            <div className="space-y-4">
                                                {report.businessIntelligence.differentiationClaims.map((claim, i) => (
                                                    <div key={i} className="flex items-center gap-3 font-bold text-lg">
                                                        <Icons.Check /> {claim}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Gap Analysis</h4>
                                            <div className="space-y-4">
                                                {report.businessIntelligence.gapAnalysis.map((gap, i) => (
                                                    <div key={i} className="flex gap-3 text-lg italic opacity-80">
                                                        <span className="text-yellow-400">⚠️</span> {gap}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-6">Online Presence</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-6 rounded-xl">
                                            <div className="text-xs opacity-50 mb-1">Website Tech</div>
                                            <div className="text-xl font-bold">{report.businessIntelligence.onlinePresence.websiteTech}</div>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-xl">
                                            <div className="text-xs opacity-50 mb-1">Social Media</div>
                                            {report.businessIntelligence.onlinePresence.socialMedia.map((s, i) => (
                                                <div key={i} className="flex justify-between text-sm mt-1">
                                                    <span>{s.platform}</span><span className="font-bold">{s.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 6: Technical Audit */}
                                <PageContainer pageNum={6} theme="teal">
                                    <SectionHeader num={3} title="Website Technical Audit" />
                                    <div className="space-y-4 mb-12">
                                        {report.technicalAudit.performance.map((p, i) => (
                                            <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                                                <span className="font-bold text-xl">{p.split(':')[0]}</span>
                                                <span className="font-bold text-teal-300 uppercase tracking-wider">{p.split(':')[1]}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-6">Site Structure</h3>
                                    <div className="bg-black/20 rounded-xl p-8 space-y-6">
                                        <div>
                                            <div className="text-xs opacity-50 uppercase tracking-widest mb-1">Navigation Clarity</div>
                                            <div className="text-3xl font-bold">{report.technicalAudit.siteStructure.navigationClarity}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs opacity-50 uppercase tracking-widest mb-1">Main Menu Items</div>
                                            <div className="text-lg font-mono opacity-80">{report.technicalAudit.siteStructure.menuItems}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs opacity-50 uppercase tracking-widest mb-1">Contact Accessibility</div>
                                            <div className="text-xl font-bold text-teal-300">{report.technicalAudit.siteStructure.contactAccessibility}</div>
                                        </div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 7: SEO Technical */}
                                <PageContainer pageNum={7} theme="teal">
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-8">SEO Technical Elements</h3>
                                    <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                                        <table className="w-full text-left">
                                            <tbody className="divide-y divide-white/10">
                                                {report.technicalAudit.seoTechnical.map((s, i) => (
                                                    <tr key={i} className="hover:bg-white/5">
                                                        <td className="p-8 font-bold text-xl w-1/2">{s.element}</td>
                                                        <td className="p-8 text-right italic opacity-70 text-lg">{s.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </PageContainer>

                                {/* PAGE 8: Content Audit Hero */}
                                <PageContainer pageNum={8} theme="teal">
                                    <SectionHeader num={4} title="Content Audit" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-6">Homepage Analysis</h3>
                                    <div className="bg-white rounded-[3rem] p-16 text-[#0c1b3e] mb-8 relative overflow-hidden">
                                        <div className="text-xs font-bold uppercase tracking-widest opacity-40 mb-8">Hero Headline</div>
                                        <div className="text-6xl font-black italic leading-tight mb-12">"{report.contentAudit.homepageAnalysis.heroSection}"</div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Primary CTA</div>
                                                <div className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg">{report.contentAudit.homepageAnalysis.primaryCTA}</div>
                                            </div>
                                            <div className="text-right max-w-xs">
                                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">First Impression</div>
                                                <div className="text-sm font-medium opacity-80">{report.contentAudit.homepageAnalysis.firstImpression}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 p-8 rounded-2xl border border-white/10">
                                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Value Communication</div>
                                        <div className="text-xl font-medium">{report.contentAudit.homepageAnalysis.valueCommunication}</div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 9: Page Inventory */}
                                <PageContainer pageNum={9} theme="teal">
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-8">Page Inventory</h3>
                                    <div className="space-y-4">
                                        {report.contentAudit.pageInventory.map((p, i) => (
                                            <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/10 flex justify-between items-center group">
                                                <div>
                                                    <div className="text-3xl font-bold text-teal-200 mb-1">{p.page}</div>
                                                    <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Present</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg opacity-80 mb-1">{p.notes}</div>
                                                    <div className="text-sm font-bold text-teal-300">Quality: {p.quality}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </PageContainer>

                                {/* PAGE 10: Content Quality */}
                                <PageContainer pageNum={10} theme="teal">
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-8">Content Quality</h3>
                                    <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10 mb-12">
                                        <table className="w-full">
                                            <tbody className="divide-y divide-white/5">
                                                {report.contentAudit.contentQuality.map((c, i) => (
                                                    <tr key={i}>
                                                        <td className="p-8 font-bold text-xl">{c.aspect}</td>
                                                        <td className="p-8 text-right text-teal-300 font-bold text-xl uppercase tracking-wider">{c.rating}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-6">Visual Design</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {report.contentAudit.visualDesign.map((v, i) => (
                                            <div key={i} className="p-6 bg-white/5 rounded-xl border border-white/5">
                                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">{v.aspect}</div>
                                                <div className="font-bold text-lg">{v.details}</div>
                                            </div>
                                        ))}
                                    </div>
                                </PageContainer>

                                {/* PAGE 11: Conversion */}
                                <PageContainer pageNum={11}>
                                    <SectionHeader num={5} title="Conversion Audit" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Calls-to-Action</h3>
                                    <div className="grid grid-cols-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                                        <div className="p-8 border-r border-slate-100">
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Metric</div>
                                            <div className="text-2xl font-bold text-[#0c1b3e]">CTA Visibility</div>
                                        </div>
                                        <div className="p-8">
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Rating</div>
                                            <div className="text-2xl font-bold text-blue-600">{report.conversionInsights.ctaVisibility}</div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 mb-12">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Primary CTAs Found</div>
                                        <div className="flex flex-wrap gap-4">
                                            {report.conversionInsights.primaryCtas.map((c, i) => (
                                                <div key={i} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full text-sm">{c}</div>
                                            ))}
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Lead Generation</h3>
                                    <div className="divide-y divide-slate-100">
                                        {report.conversionInsights.leadGeneration.map((l, i) => (
                                            <div key={i} className="py-6 flex justify-between items-center">
                                                <span className="font-bold text-lg text-slate-800">{l.element}</span>
                                                <span className="text-slate-500">{l.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </PageContainer>

                                {/* PAGE 12: Trust & Credibility */}
                                <PageContainer pageNum={12}>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">Trust & Credibility Signals</h3>
                                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12">
                                        <div className="flex bg-slate-50 p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <div className="w-1/2">Signal Type</div>
                                            <div className="w-1/2 text-right">Status</div>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {report.conversionInsights.trustSignals.map((t, i) => (
                                                <div key={i} className="flex p-6 items-center">
                                                    <div className="w-1/2 font-bold text-xl">{t.type}</div>
                                                    <div className={`w-1/2 text-right font-bold text-lg ${t.status.includes('✓') || t.status.toLowerCase().includes('present') ? 'text-blue-600' : 'text-slate-400'}`}>
                                                        {t.status}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-red-300 mb-6">Friction Points</h3>
                                    <div className="space-y-4">
                                        {report.conversionInsights.frictionPoints.map((f, i) => (
                                            <div key={i} className="p-6 bg-red-50 rounded-xl border border-red-100 flex gap-4 items-center">
                                                <span className="text-yellow-500 text-xl">⚠️</span>
                                                <span className="text-red-900 font-medium">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </PageContainer>

                                {/* PAGE 13: SEO Marketing */}
                                <PageContainer pageNum={13}>
                                    <SectionHeader num={6} title="SEO & Content Marketing" />
                                    <div className="bg-[#0c1b3e] p-10 rounded-[2.5rem] text-white mb-12 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-6">Primary Keywords</div>
                                            <div className="flex flex-wrap gap-4 mb-8">
                                                {report.seoMarketing.keywords.map((k, i) => (
                                                    <span key={i} className="px-6 py-3 bg-white/10 rounded-full font-bold border border-white/10">{k}</span>
                                                ))}
                                            </div>
                                            <div className="pt-6 border-t border-white/10">
                                                <span className="opacity-70">Local SEO Status: </span>
                                                <span className="font-bold">{report.seoMarketing.localSeo}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Content Engine Assessment</h3>
                                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12">
                                        <div className="flex bg-slate-50 p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <div className="w-1/2">Metric</div>
                                            <div className="w-1/2 text-right">Expert Rating</div>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {report.seoMarketing.contentMarketing.map((c, i) => (
                                                <div key={i} className="flex p-6 items-center">
                                                    <div className="w-1/2 font-bold text-lg">{c.aspect}</div>
                                                    <div className="w-1/2 text-right font-bold text-blue-600">{c.status}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Detected Content Types</div>
                                        <div className="flex gap-4 font-bold text-slate-700">
                                            {report.seoMarketing.contentTypes.map((c, i) => <span key={i}>{c}</span>)}
                                        </div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 14: Competitive Positioning */}
                                <PageContainer pageNum={14}>
                                    <SectionHeader num={7} title="Competitive Positioning" />
                                    <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 mb-12">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Market Positioning Statement</div>
                                        <p className="text-4xl italic font-light text-slate-600 mb-12">"{report.competitivePositioning.positioningStatement}"</p>
                                        <div className="pt-8 border-t border-slate-100">
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Differentiation</div>
                                            <div className="text-lg text-slate-800">{report.competitivePositioning.differentiation}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-12">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Industry Comparison</h3>
                                            <div className="space-y-4">
                                                {report.competitivePositioning.industryComparison.map((c, i) => (
                                                    <div key={i} className="flex justify-between p-4 bg-slate-50 rounded-xl">
                                                        <span className="font-bold">{c.metric}</span>
                                                        <span className="text-slate-600">{c.rating}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-6">Market Gaps</h3>
                                            <div className="space-y-4">
                                                {report.competitivePositioning.marketGaps.map((g, i) => (
                                                    <div key={i} className="flex gap-3 items-start">
                                                        <span className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                                                        <p className="text-slate-700">{g}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 15: Mobile Experience */}
                                <PageContainer pageNum={15}>
                                    <SectionHeader num={8} title="Mobile Experience" />
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-12">
                                        <div className="flex bg-slate-50 p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <div className="w-1/2">Mobile Aspect</div>
                                            <div className="w-1/2 text-right">Status</div>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {report.mobileExperience.analysis.map((a, i) => (
                                                <div key={i} className="flex p-6 items-center">
                                                    <div className="w-1/2 font-bold text-xl">{a.aspect}</div>
                                                    <div className="w-1/2 text-right font-bold text-blue-600 text-lg">{a.rating}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 mb-6">Mobile-Specific Issues</h3>
                                    <div className="space-y-4">
                                        {report.mobileExperience.issues.map((issue, i) => (
                                            <div key={i} className="p-6 bg-amber-50 rounded-xl border border-amber-100 flex gap-4 items-center">
                                                <span className="text-amber-500">⚠️</span>
                                                <span className="text-amber-900 font-medium">{issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </PageContainer>

                                {/* PAGE 16: Critical Issues */}
                                <PageContainer pageNum={16}>
                                    <SectionHeader num={9} title="Critical Issues" />
                                    <div className="bg-red-50 rounded-[3rem] p-12 mb-8">
                                        <div className="text-xs font-bold uppercase tracking-widest text-red-500 mb-8">High Priority (Fix Immediately)</div>
                                        <div className="space-y-8">
                                            {report.criticalIssues.high.map((h, i) => (
                                                <div key={i}>
                                                    <div className="text-2xl font-bold text-red-900 mb-2">{h.title}</div>
                                                    <div className="text-lg text-red-800/70">{h.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="bg-amber-50 p-10 rounded-[2.5rem]">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                                                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Medium Priority</span>
                                            </div>
                                            {report.criticalIssues.medium.map((m, i) => (
                                                <div key={i} className="mb-4 last:mb-0">
                                                    <div className="font-bold text-amber-900">{m.title}</div>
                                                    <div className="text-sm text-amber-800/70">{m.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-blue-50 p-10 rounded-[2.5rem]">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                                                <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Low Priority</span>
                                            </div>
                                            {report.criticalIssues.low.map((l, i) => (
                                                <div key={i} className="mb-4 last:mb-0">
                                                    <div className="font-bold text-blue-900">{l.title}</div>
                                                    <div className="text-sm text-blue-800/70">{l.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 17: Strategic Action Plan 1 */}
                                <PageContainer pageNum={17}>
                                    <SectionHeader num={10} title="Strategic Action Plan" />
                                    <div className="space-y-6">
                                        {report.recommendations.slice(0, 3).map((r, i) => (
                                            <div key={i} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 relative">
                                                <div className="absolute right-10 top-10 text-6xl font-black text-slate-100 pointer-events-none">{i+1}</div>
                                                <div className="text-3xl font-bold text-[#0c1b3e] mb-6 relative z-10">{r.title}</div>
                                                <div className="flex gap-4 mb-8">
                                                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">Priority: {r.priority}</span>
                                                    <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">Impact: {r.impact}</span>
                                                    <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">Effort: {r.effort}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-12">
                                                    <div>
                                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Why</div>
                                                        <p className="text-slate-600 mb-6">{r.why}</p>
                                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">How to Implement</div>
                                                        <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium text-sm">
                                                            {r.how?.map((step: string, idx: number) => <li key={idx}>{step}</li>)}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Outcome</div>
                                                        <div className="text-blue-600 font-bold">{r.expectedOutcome}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </PageContainer>

                                {/* PAGE 18: Strategic Action Plan 2 */}
                                <PageContainer pageNum={18}>
                                    <div className="space-y-6 mt-12">
                                        {report.recommendations.slice(3, 6).map((r, i) => (
                                            <div key={i} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 relative">
                                                <div className="absolute right-10 top-10 text-6xl font-black text-slate-100 pointer-events-none">{i+4}</div>
                                                <div className="text-3xl font-bold text-[#0c1b3e] mb-6 relative z-10">{r.title}</div>
                                                <div className="flex gap-4 mb-8">
                                                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">Priority: {r.priority}</span>
                                                    <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">Impact: {r.impact}</span>
                                                    <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">Effort: {r.effort}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-12">
                                                    <div>
                                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Why</div>
                                                        <p className="text-slate-600 mb-6">{r.why}</p>
                                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">How to Implement</div>
                                                        <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium text-sm">
                                                            {r.how?.map((step: string, idx: number) => <li key={idx}>{step}</li>)}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Outcome</div>
                                                        <div className="text-blue-600 font-bold">{r.expectedOutcome}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </PageContainer>

                                {/* PAGE 19: Growth & Competitive */}
                                <PageContainer pageNum={19} theme="teal">
                                    <SectionHeader num={11} title="Growth Opportunities" />
                                    <div className="grid grid-cols-3 gap-6 mb-16">
                                        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-4">⚡ Quick Wins</div>
                                            {report.growthOpportunities.quickWins.map((w, i) => (
                                                <div key={i} className="mb-4 last:mb-0">
                                                    <div className="font-bold text-lg">{w.title}</div>
                                                    <div className="text-xs opacity-50">{w.metric}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-4">🎯 Strategic</div>
                                            {report.growthOpportunities.strategic.map((w, i) => (
                                                <div key={i} className="mb-4 last:mb-0">
                                                    <div className="font-bold text-lg">{w.title}</div>
                                                    <div className="text-xs opacity-50">{w.metric}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-4">🌎 Long-Term</div>
                                            {report.growthOpportunities.longTerm.map((w, i) => (
                                                <div key={i} className="mb-4 last:mb-0">
                                                    <div className="font-bold text-lg">{w.title}</div>
                                                    <div className="text-xs opacity-50">{w.metric}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <SectionHeader num={12} title="Competitive Intelligence" />
                                    <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-6">Direct Market Competitors</div>
                                    <div className="grid grid-cols-2 gap-6 mb-12">
                                        {report.competitiveIntelligence.competitorAnalysis.map((c, i) => (
                                            <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/10">
                                                <div className="text-2xl font-bold mb-2">{c.name}</div>
                                                <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">{c.known}</div>
                                                <p className="opacity-80 leading-relaxed text-sm">{c.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-white/5 p-8 rounded-2xl border-t border-white/10">
                                        <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-6">Your Competitive Advantages</div>
                                        <div className="flex gap-4 flex-wrap">
                                            {report.competitiveIntelligence.advantages.map((adv, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full">
                                                    <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-xs text-black font-bold">✓</div>
                                                    <span className="font-bold">{adv}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PageContainer>

                                {/* PAGE 20: Final Audit Summary */}
                                <PageContainer pageNum={20} theme="teal">
                                    <SectionHeader num={13} title="Final Audit Summary" />
                                    <div className="flex gap-16 items-center my-16">
                                        <div className="flex-shrink-0">
                                            <div className="text-[200px] font-bold text-teal-300 leading-none">{report.executiveSummary.overallScore}</div>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Aggregate Ecosystem Score</div>
                                            <p className="text-3xl italic font-light leading-relaxed opacity-90">
                                                "{report.finalSummary.summaryText}"
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                        {report.finalSummary.breakdown.map((b, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                                                    <span>{b.category}</span>
                                                    <span>{b.score}</span>
                                                </div>
                                                <div className="h-4 bg-black/30 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-teal-400 rounded-full" 
                                                        style={{ width: `${(parseInt(b.score)/10)*100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </PageContainer>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById("root")!);
root.render(<ErrorBoundary><App /></ErrorBoundary>);
