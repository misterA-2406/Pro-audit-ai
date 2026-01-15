
export const SERVER_CODE = `
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); 
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY; 
const PAGESPEED_KEY = process.env.PAGESPEED_KEY;

if (!API_KEY) {
  console.error("Error: API_KEY is missing in .env");
  process.exit(1);
}

// Fix: Initializing GoogleGenAI with named parameter as required.
const ai = new GoogleGenAI({ apiKey: API_KEY });

const fetchRealAuditData = async (url) => {
    const buildUrl = (key) => {
        const u = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
        u.searchParams.append('url', url);
        u.searchParams.append('category', 'PERFORMANCE');
        u.searchParams.append('category', 'SEO');
        u.searchParams.append('category', 'ACCESSIBILITY');
        u.searchParams.append('category', 'BEST_PRACTICES');
        u.searchParams.append('strategy', 'DESKTOP');
        if(key) u.searchParams.append('key', key);
        return u.toString();
    };

    try {
        const endpoint = buildUrl(PAGESPEED_KEY || API_KEY);
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(\`PageSpeed API Error: \${res.statusText}\`);
        const data = await res.json();
        
        const audits = data.lighthouseResult.audits;
        const categories = data.lighthouseResult.categories;
        const loadingExperience = data.loadingExperience || {};

        const getFieldMetric = (metricName) => {
            const metric = loadingExperience.metrics?.[metricName];
            if (!metric) return null;
            return { score: metric.category, value: metric.percentile };
        };

        const opportunities = Object.values(audits)
            .filter((audit) => audit.details?.type === 'opportunity' && (audit.score !== null && audit.score < 0.9))
            .sort((a, b) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0))
            .slice(0, 5)
            .map((audit) => ({
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
            fieldLcp: getFieldMetric('LARGEST_CONTENTFUL_PAINT_MS'),
            fieldInp: getFieldMetric('INTERACTION_TO_NEXT_PAINT'),
            fieldCls: getFieldMetric('CUMULATIVE_LAYOUT_SHIFT_SCORE'),
            screenshot: audits['final-screenshot']?.details?.data || null,
            opportunities: opportunities,
            metaDescription: audits['meta-description']?.score === 1 ? "Present" : "Missing/Invalid",
            documentTitle: audits['document-title']?.score === 1 ? audits['document-title'].displayValue : "Missing",
            imageAltMissing: audits['image-alt']?.details?.items?.length || 0,
            https: audits['is-on-https']?.score === 1
        };
    } catch (e) {
        return { performanceScore: 0, seoScore: 0, accessibilityScore: 0, bestPracticesScore: 0, lcp: 0, metaDescription: "Error", documentTitle: "Error", imageAltMissing: 0, https: false };
    }
};

// Fix: Using simplified contents string and directly accessing .text property as per SDK requirements.
const performDeepCrawl = async (url, model = 'gemini-3-pro-preview') => {
    const domain = new URL(url).hostname;
    const structureRes = await ai.models.generateContent({
        model: model,
        contents: \`Find site structure for \${domain}\`,
        config: { tools: [{ googleSearch: {} }] }
    });
    const bizRes = await ai.models.generateContent({
        model: model,
        contents: \`Find business info for \${domain}\`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return { structureContext: structureRes.text, businessContext: bizRes.text };
};

app.post('/api/audit', async (req, res) => {
    const { url, model } = req.body;
    try {
        const [crawlData, realAuditData] = await Promise.all([performDeepCrawl(url, model), fetchRealAuditData(url)]);
        
        const masterPrompt = \`
          Generate JSON audit report for \${url}.
          FACTS: 
          - Performance: \${realAuditData.performanceScore}
          - Real User LCP: \${realAuditData.fieldLcp?.value}
          - Tech Issues: \${JSON.stringify(realAuditData.opportunities)}
          - Business: \${crawlData.businessContext}
          
          RULES:
          - Use the Real User LCP data in the summary.
          - List the Tech Issues in the Technical Audit.
          - Return valid JSON matching AuditReport schema.
        \`;
        
        // Fix: simplified contents parameter and direct access to response.text.
        const response = await ai.models.generateContent({ 
            model: model || 'gemini-3-pro-preview', 
            contents: masterPrompt 
        });
        
        let text = response.text.trim().replace(/\\\`\\\`\\\`json\\s*/g, "").replace(/\\\`\\\`\\\`\\s*$/g, "").replace(/\\\`\\\`/g, "");
        const report = JSON.parse(text);
        
        // Inject Binary/Complex data manually
        if (realAuditData.screenshot) report.titlePage.screenshot = realAuditData.screenshot;
        if (realAuditData.opportunities) {
             if(!report.technicalAudit) report.technicalAudit = {};
             report.technicalAudit.opportunities = realAuditData.opportunities.map(op => ({ issue: op.title, savings: op.savings }));
        }

        res.json(report);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`;

export const PACKAGE_JSON_CODE = `
{
  "name": "pro-audit-backend",
  "version": "1.0.0",
  "description": "Local backend for Website Audit Pro",
  "main": "server.js",
  "scripts": { "start": "node server.js", "dev": "nodemon server.js" },
  "dependencies": { "express": "^4.18.2", "cors": "^2.8.5", "dotenv": "^16.3.1", "node-fetch": "^2.7.0", "@google/genai": "^0.1.0" },
  "devDependencies": { "nodemon": "^3.0.1" }
}
`;

export const GUIDE_CODE = `
# Website Audit Pro - Local Backend Guide
1. Install Node.js.
2. Create folder 'backend'.
3. Save 'server.js' and 'package.json'.
4. Run 'npm install'.
5. Create .env with API_KEY and PAGESPEED_KEY.
6. Run 'npm start'.
7. In App Settings, set Local Server URL to 'http://localhost:3001'.
`;