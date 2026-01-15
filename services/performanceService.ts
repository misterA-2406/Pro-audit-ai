import { CrawlData, MetricData } from "../types";

export const fetchRealAuditData = async (url: string, geminiKey: string, pageSpeedKey?: string): Promise<CrawlData> => {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    // Resolve key: Priority Settings Key > Env Key
    const activeKey = (pageSpeedKey?.trim()) || (geminiKey?.trim()) || (process.env.API_KEY?.trim());

    if (!activeKey) {
        throw new Error("No API Key found. Please configure process.env.API_KEY or use Settings.");
    }

    const buildUrl = (key: string) => {
        const u = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
        u.searchParams.append('url', targetUrl);
        u.searchParams.append('category', 'PERFORMANCE');
        u.searchParams.append('category', 'SEO');
        u.searchParams.append('category', 'ACCESSIBILITY');
        u.searchParams.append('category', 'BEST_PRACTICES');
        u.searchParams.append('strategy', 'DESKTOP'); 
        u.searchParams.append('key', key);
        return u.toString();
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
        const res = await fetch(buildUrl(activeKey), { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({}));
            throw new Error(`PageSpeed API Error: ${errorBody.error?.message || res.statusText}`);
        }
        
        const data = await res.json();
        const audits = data.lighthouseResult.audits;
        const categories = data.lighthouseResult.categories;
        const loadingExperience = data.loadingExperience || {}; 

        const getFieldMetric = (metricName: string): MetricData | null => {
            const metric = loadingExperience.metrics?.[metricName];
            if (!metric) return null;
            return { score: metric.category, value: metric.percentile };
        };

        const opportunities = Object.values(audits)
            .filter((audit: any) => audit.details?.type === 'opportunity' && (audit.score !== null && audit.score < 0.9))
            .sort((a: any, b: any) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0))
            .slice(0, 5)
            .map((audit: any) => ({
                title: audit.title,
                description: audit.description,
                savings: audit.displayValue || ''
            }));

        return {
            performanceScore: Math.round((categories.performance?.score || 0) * 100),
            seoScore: Math.round((categories.seo?.score || 0) * 100),
            accessibilityScore: Math.round((categories.accessibility?.score || 0) * 100),
            bestPracticesScore: Math.round((categories['best-practices']?.score || 0) * 100),
            lcp: audits['largest-contentful-paint']?.numericValue || 0,
            cls: audits['cumulative-layout-shift']?.numericValue || 0,
            fcp: audits['first-contentful-paint']?.numericValue || 0,
            totalSize: Math.round((audits['total-byte-weight']?.numericValue || 0) / 1024),
            fieldLcp: getFieldMetric('LARGEST_CONTENTFUL_PAINT_MS'),
            fieldInp: getFieldMetric('INTERACTION_TO_NEXT_PAINT'),
            fieldCls: getFieldMetric('CUMULATIVE_LAYOUT_SHIFT_SCORE'),
            screenshot: audits['final-screenshot']?.details?.data || null,
            metaDescription: audits['meta-description']?.score === 1 ? "Present" : "Missing",
            documentTitle: audits['document-title']?.score === 1 ? audits['document-title'].displayValue : "Missing",
            imageAltMissing: audits['image-alt']?.details?.items?.length || 0,
            https: audits['is-on-https']?.score === 1,
            viewport: audits['viewport']?.score === 1,
            opportunities,
            errors: []
        };
    } catch (e: any) {
        clearTimeout(timeoutId);
        // Return default "failed" data so the app doesn't crash, just shows N/A for speed
        return {
            performanceScore: 0, seoScore: 0, accessibilityScore: 0, bestPracticesScore: 0,
            lcp: 0, cls: 0, fcp: 0, totalSize: 0, fieldLcp: null, fieldInp: null, fieldCls: null, screenshot: null,
            metaDescription: null, documentTitle: null, imageAltMissing: 0, https: false, viewport: false, opportunities: [],
            errors: [e.name === 'AbortError' ? "PageSpeed Analysis Timed Out (Skipped)" : e.message] 
        };
    }
};