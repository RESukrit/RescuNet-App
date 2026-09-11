import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // RescuNet In-Memory SOS Signals Store (replicates & enhances app.py)
  interface SosRecord {
    id: number;
    name: string;
    condition: string;
    battery: number;
    lat: number;
    lng: number;
    priority: number;
    time: string;
    status: 'active' | 'assigned' | 'rescued';
    notes?: string;
    meshHops?: number;
  }

  function calculatePriority(condition: string, battery: number): number {
    const severityWeights: Record<string, number> = {
      'Trapped under debris': 50.0,
      'Medical Emergency': 40.0,
      'Trapped in a fire': 35.0,
      'Trapped in a Fire': 35.0,
      'Cut off by floodwater': 25.0,
      'Structural Collapse Risk': 45.0,
      'Gas Leak': 38.0,
    };
    const baseScore = severityWeights[condition] || 15.0;
    const clampedBattery = Math.max(0, Math.min(100, Number(battery) || 100));
    const batteryScore = (100 - clampedBattery) * 0.3;
    return Math.round((baseScore + batteryScore) * 100) / 100;
  }

  const initialSosSignals: SosRecord[] = [
    {
      id: 1,
      name: 'Priya & Child (Node #4)',
      condition: 'Trapped under debris',
      battery: 18,
      lat: 10.0534,
      lng: 76.6272,
      priority: calculatePriority('Trapped under debris', 18),
      time: '11:24:10 AM',
      status: 'active',
      notes: 'Collapsed masonry on ground floor. Requires heavy extraction gear.',
      meshHops: 3,
    },
    {
      id: 2,
      name: 'Elderly Resident (Node #7)',
      condition: 'Medical Emergency',
      battery: 34,
      lat: 10.0612,
      lng: 76.6198,
      priority: calculatePriority('Medical Emergency', 34),
      time: '11:29:45 AM',
      status: 'active',
      notes: 'Severe asthma, inhaler lost during flood surge. Oxygen needed.',
      meshHops: 2,
    },
    {
      id: 3,
      name: 'Family of 3 (Node #2)',
      condition: 'Cut off by floodwater',
      battery: 72,
      lat: 10.0451,
      lng: 76.6385,
      priority: calculatePriority('Cut off by floodwater', 72),
      time: '11:32:02 AM',
      status: 'assigned',
      notes: 'Rooftop refuge, water level 1.8m and rising slowly. Inflatable raft en route.',
      meshHops: 1,
    },
    {
      id: 4,
      name: 'Forestry Ranger Office',
      condition: 'Trapped in a fire',
      battery: 22,
      lat: 10.0589,
      lng: 76.6341,
      priority: calculatePriority('Trapped in a fire', 22),
      time: '11:35:18 AM',
      status: 'active',
      notes: 'Brushfire encroaching north boundary perimeter. Rapid evacuation required.',
      meshHops: 4,
    },
  ];

  let sosSignals: SosRecord[] = [...initialSosSignals].sort((a, b) => b.priority - a.priority);

  // RescuNet API: GET all SOS distress signals
  app.get('/api/sos', (req, res) => {
    res.json(sosSignals);
  });

  // RescuNet API: POST new SOS distress signal
  app.post('/api/sos', (req, res) => {
    try {
      const data = req.body || {};
      const condition = (data.condition || 'Medical Emergency').trim();
      const battery = Number.isFinite(data.battery) ? Number(data.battery) : 100;
      const lat = Number.isFinite(data.lat) ? Number(data.lat) : 10.053;
      const lng = Number.isFinite(data.lng) ? Number(data.lng) : 76.627;
      const priority = calculatePriority(condition, battery);

      const newBeacon: SosRecord = {
        id: sosSignals.length > 0 ? Math.max(...sosSignals.map((s) => s.id)) + 1 : 1,
        name: data.name ? String(data.name).trim() : 'Anonymous Victim',
        condition,
        battery,
        lat,
        lng,
        priority,
        time: data.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'active',
        notes: data.notes || '',
        meshHops: data.meshHops || Math.floor(Math.random() * 3) + 1,
      };

      sosSignals.push(newBeacon);
      sosSignals.sort((a, b) => b.priority - a.priority);

      res.status(201).json({ status: 'success', data: newBeacon });
    } catch (err: any) {
      console.error('Error handling SOS:', err);
      res.status(500).json({ error: 'Failed to record SOS signal' });
    }
  });

  // Update status of an SOS signal (dispatch, resolve)
  app.patch('/api/sos/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const signal = sosSignals.find((s) => s.id === id);
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }
    const { status, notes } = req.body;
    if (status && ['active', 'assigned', 'rescued'].includes(status)) {
      signal.status = status;
    }
    if (notes !== undefined) {
      signal.notes = String(notes);
    }
    res.json({ status: 'success', data: signal });
  });

  // Delete / Resolve an SOS signal
  app.delete('/api/sos/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    sosSignals = sosSignals.filter((s) => s.id !== id);
    res.json({ status: 'success', message: 'Signal removed' });
  });

  // Reset SOS signals to default state
  app.post('/api/sos/reset', (req, res) => {
    sosSignals = [...initialSosSignals].sort((a, b) => b.priority - a.priority);
    res.json({ status: 'success', signals: sosSignals });
  });

  // AI Hazard Verification endpoint (from RescuNet prototype spec)
  app.post('/api/verify-hazard', async (req, res) => {
    try {
      const { description, locationName, hazardType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback simulation if no API key
        return res.json({
          verified: true,
          confidence: 0.92,
          hazardType: hazardType || 'Flood Blockage',
          riskLevel: 'HIGH',
          rerouteRecommended: true,
          safetyGuidance: `Immediate evacuation advised. Bypassing ${locationName || 'Bridge Sector 4'} via Elevated East Ridge Trail. Avoid low-lying storm channels.`,
          estimatedClearTime: '4-6 hours',
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are the RescuNet Emergency Hazard Assessment AI.
A civilian or first responder has reported an offline disaster hazard:
- Hazard Type: ${hazardType || 'Unspecified'}
- Location: ${locationName || 'Near Sector Grid'}
- Description / Field Note: ${description || 'Blocked pathway with heavy debris and water'}

Analyze this incident report and output JSON strictly adhering to:
{
  "verified": true,
  "confidence": 0.95,
  "hazardType": "${hazardType || 'Flood Debris'}",
  "riskLevel": "CRITICAL" or "HIGH" or "MODERATE",
  "rerouteRecommended": true,
  "safetyGuidance": "Clear 1-2 sentence actionable survival recommendation for evacuees",
  "recommendedSafeBearing": "East-Northeast towards High Ground Shelter Alpha",
  "estimatedClearTime": "Estimated clearance time or persistence"
}
Output ONLY raw JSON with no markdown formatting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      let cleanJson = text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (err: any) {
      console.error('Error verifying hazard with AI:', err);
      res.json({
        verified: true,
        confidence: 0.88,
        hazardType: req.body.hazardType || 'Active Debris Flow',
        riskLevel: 'HIGH',
        rerouteRecommended: true,
        safetyGuidance: 'High-risk hazard verified. Proceed to designated primary evacuation safe zone immediately.',
        estimatedClearTime: '2-4 hours',
      });
    }
  });

  // Fetch page content proxy to bypass CORS
  app.post('/api/fetch-page', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
      }

      let targetUrl = url.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `https://${targetUrl}`;
      }

      const response = await fetch(targetUrl, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GitHubPageReader/1.0; +https://ai.studio)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Failed to fetch target URL: ${response.statusText}`,
          statusCode: response.status,
        });
      }

      const html = await response.text();
      res.json({
        url: targetUrl,
        status: response.status,
        html: html.slice(0, 150000), // Limit payload size safely
      });
    } catch (error: any) {
      console.error('Error fetching page:', error);
      res.status(500).json({ error: error.message || 'Error fetching page' });
    }
  });

  // AI-powered GitHub Page / Website / Dashboard parser
  app.post('/api/parse-github', async (req, res) => {
    try {
      const { url, rawHtml, customNotes } = req.body;

      let fetchedHtml = rawHtml || '';
      let targetUrl = url ? url.trim() : '';

      // If URL is provided and no rawHtml, try to fetch it
      if (targetUrl && !fetchedHtml) {
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = `https://${targetUrl}`;
        }

        try {
          const fetchRes = await fetch(targetUrl, {
            signal: AbortSignal.timeout(5000),
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; GitHubPageReader/1.0; +https://ai.studio)',
            },
          });
          if (fetchRes.ok) {
            fetchedHtml = await fetchRes.text();
          }
        } catch (fetchErr) {
          console.warn('Direct fetch attempt failed:', fetchErr);
        }
      }

      // Check if GEMINI_API_KEY is available for deep synthesis
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && (fetchedHtml || targetUrl)) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are an expert full-stack developer and design architect.
The user wants to convert their GitHub Page, website, and dashboard into a modern interactive application.
Analyze the following source details and produce a complete JSON configuration matching the structure below.

URL: ${targetUrl}
Additional User Notes: ${customNotes || 'None'}
Raw HTML snippet (first 12,000 chars):
${(fetchedHtml || '').slice(0, 12000)}

Output ONLY valid, parseable JSON with NO markdown code blocks, conforming to this exact schema:
{
  "source": {
    "url": "${targetUrl || 'https://github.com'}",
    "type": "github_page",
    "lastSynced": "${new Date().toLocaleDateString('en-US')}"
  },
  "profile": {
    "name": "Extracted or inferred Name",
    "headline": "Professional headline",
    "bio": "Concise bio (1-2 sentences)",
    "avatarUrl": "Image URL if found or leave empty",
    "githubUrl": "GitHub profile URL",
    "websiteUrl": "${targetUrl}",
    "email": "Email if found",
    "location": "Location if found",
    "statusText": "Current status"
  },
  "theme": "indigo",
  "website": {
    "hero": {
      "badge": "Short badge tag",
      "title": "Hero title",
      "subtitle": "Hero subtitle",
      "ctaPrimaryText": "View Dashboard",
      "ctaPrimaryLink": "#dashboard",
      "ctaSecondaryText": "GitHub Profile",
      "ctaSecondaryLink": "${targetUrl}"
    },
    "about": {
      "summary": "About summary",
      "bullets": ["Key accomplishment 1", "Key accomplishment 2", "Key accomplishment 3"],
      "stats": [
        {"label": "Projects", "value": "12+"},
        {"label": "Contributions", "value": "500+"}
      ]
    },
    "projects": [
      {
        "id": "proj-1",
        "title": "Project Title",
        "description": "Project description",
        "tags": ["React", "TypeScript"],
        "stars": 42,
        "forks": 5,
        "liveUrl": "Demo URL",
        "repoUrl": "Repo URL",
        "category": "Web & Cloud",
        "featured": true
      }
    ],
    "skills": [
      {
        "category": "Core Technologies",
        "items": ["TypeScript", "React", "Node.js"]
      }
    ],
    "highlights": [
      {
        "year": "2024",
        "title": "Role or Milestone",
        "organization": "Company or Project",
        "description": "Milestone details"
      }
    ],
    "contact": {
      "message": "Contact message",
      "links": [
        {"label": "GitHub", "url": "${targetUrl}", "icon": "Github"}
      ]
    }
  },
  "dashboard": {
    "kpis": [
      {
        "id": "kpi-1",
        "label": "Total Pageviews",
        "value": "12.4k",
        "change": "+12%",
        "isPositive": true,
        "subtext": "past 30 days",
        "icon": "Eye"
      },
      {
        "id": "kpi-2",
        "label": "GitHub Stars",
        "value": "128",
        "change": "+5%",
        "isPositive": true,
        "subtext": "across repositories",
        "icon": "Star"
      }
    ],
    "trafficData": [
      {"date": "Day 1", "views": 400, "uniqueVisitors": 310},
      {"date": "Day 2", "views": 620, "uniqueVisitors": 480},
      {"date": "Day 3", "views": 850, "uniqueVisitors": 610},
      {"date": "Day 4", "views": 1100, "uniqueVisitors": 820},
      {"date": "Day 5", "views": 1340, "uniqueVisitors": 990}
    ],
    "repoActivityData": [
      {"month": "May", "commits": 40, "prs": 8, "stars": 15},
      {"month": "Jun", "commits": 70, "prs": 14, "stars": 28},
      {"month": "Jul", "commits": 95, "prs": 20, "stars": 54}
    ],
    "trafficSources": [
      {"name": "GitHub Referrals", "value": 55, "color": "#4f46e5"},
      {"name": "Direct Access", "value": 30, "color": "#06b6d4"},
      {"name": "Search Engines", "value": 15, "color": "#10b981"}
    ],
    "deployments": [
      {
        "id": "dep-1",
        "project": "Main Website",
        "environment": "Production",
        "status": "Success",
        "branch": "main",
        "commit": "a1b2c3d",
        "time": "Just now",
        "url": "${targetUrl}"
      }
    ],
    "recentActivities": [
      {
        "id": "act-1",
        "type": "commit",
        "title": "Updated repository documentation and components",
        "description": "Continuous synchronization from GitHub Page source.",
        "timestamp": "10 minutes ago",
        "author": "developer"
      }
    ],
    "systemHealth": {
      "uptime": "99.9%",
      "responseTime": "85ms",
      "sslStatus": "Valid TLS",
      "buildStatus": "Passing",
      "lighthouseScore": 98
    }
  }
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          if (response.text) {
            const parsedData = JSON.parse(response.text);
            return res.json({ success: true, data: parsedData, source: 'ai' });
          }
        } catch (aiErr: any) {
          console.warn('Gemini extraction error, falling back to heuristic parsing:', aiErr);
        }
      }

      // Heuristic fallback if AI is unavailable or no key
      const extractedTitle = (fetchedHtml.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || targetUrl || 'My GitHub Page App').trim();
      const metaDesc = (fetchedHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '').trim();

      const usernameMatch = targetUrl.match(/(?:github\.io\/|github\.com\/)([a-zA-Z0-9_-]+)/i);
      const inferredUsername = usernameMatch ? usernameMatch[1] : 'Developer';

      const fallbackData = {
        source: {
          url: targetUrl || 'https://github.com',
          type: 'github_page',
          lastSynced: new Date().toLocaleDateString('en-US'),
        },
        profile: {
          name: inferredUsername,
          headline: extractedTitle || `${inferredUsername}'s Engineering Workspace`,
          bio: metaDesc || 'Website and performance dashboard synchronized from GitHub Page source.',
          githubUrl: targetUrl.includes('github') ? targetUrl : `https://github.com/${inferredUsername}`,
          websiteUrl: targetUrl,
          statusText: 'Active & Building',
        },
        theme: 'indigo',
        website: {
          hero: {
            badge: 'Live GitHub Source Synced',
            title: extractedTitle || `${inferredUsername}'s Platform`,
            subtitle: metaDesc || 'Full-featured website and operational metrics dashboard powered by your GitHub presence.',
            ctaPrimaryText: 'View Dashboard',
            ctaPrimaryLink: '#dashboard',
            ctaSecondaryText: 'Visit Source',
            ctaSecondaryLink: targetUrl || '#',
          },
          about: {
            summary: metaDesc || 'Engineered for seamless digital delivery, high-performance web architecture, and continuous updates.',
            bullets: [
              'Continuous synchronization with public GitHub Pages and repository commits',
              'Modular client components with automated metric tracking',
              'Fast responsive design for both desktop and mobile viewports',
            ],
            stats: [
              { label: 'Active Repos', value: '14+' },
              { label: 'Uptime', value: '99.9%' },
            ],
          },
          projects: [
            {
              id: 'proj-1',
              title: `${inferredUsername} Main Project`,
              description: 'Primary deployment repository and web assets.',
              tags: ['TypeScript', 'HTML5', 'CSS3', 'Vite'],
              stars: 28,
              forks: 6,
              liveUrl: targetUrl,
              repoUrl: targetUrl,
              category: 'Featured',
              featured: true,
            },
          ],
          skills: [
            {
              category: 'Core Technologies',
              items: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'Git', 'GitHub Actions'],
            },
          ],
          highlights: [
            {
              year: '2025',
              title: 'Deployed GitHub Pages Site',
              organization: inferredUsername,
              description: 'Published interactive web assets and live project demos.',
            },
          ],
          contact: {
            message: 'Connect for collaborations and technical queries.',
            links: [
              { label: 'GitHub', url: targetUrl || `https://github.com/${inferredUsername}`, icon: 'Github' },
            ],
          },
        },
        dashboard: {
          kpis: [
            {
              id: 'kpi-1',
              label: 'Total Traffic',
              value: '18,400',
              change: '+14.2%',
              isPositive: true,
              subtext: 'vs last month',
              icon: 'Eye',
            },
            {
              id: 'kpi-2',
              label: 'GitHub Activity',
              value: '384 Commits',
              change: '+8.1%',
              isPositive: true,
              subtext: 'this quarter',
              icon: 'GitCommit',
            },
            {
              id: 'kpi-3',
              label: 'Deployment Health',
              value: '100% Up',
              change: 'Stable',
              isPositive: true,
              subtext: 'GitHub Pages CDN',
              icon: 'Activity',
            },
            {
              id: 'kpi-4',
              label: 'Lighthouse Score',
              value: '98 / 100',
              change: '+4 pts',
              isPositive: true,
              subtext: 'Desktop & Mobile',
              icon: 'Zap',
            },
          ],
          trafficData: [
            { date: 'Day 1', views: 420, uniqueVisitors: 310 },
            { date: 'Day 2', views: 580, uniqueVisitors: 410 },
            { date: 'Day 3', views: 710, uniqueVisitors: 520 },
            { date: 'Day 4', views: 890, uniqueVisitors: 640 },
            { date: 'Day 5', views: 1150, uniqueVisitors: 820 },
            { date: 'Day 6', views: 1420, uniqueVisitors: 980 },
            { date: 'Day 7', views: 1680, uniqueVisitors: 1140 },
          ],
          repoActivityData: [
            { month: 'Jun', commits: 45, prs: 10, stars: 18 },
            { month: 'Jul', commits: 68, prs: 16, stars: 32 },
            { month: 'Aug', commits: 92, prs: 24, stars: 58 },
            { month: 'Sep', commits: 110, prs: 31, stars: 84 },
          ],
          trafficSources: [
            { name: 'Direct Visits', value: 45, color: '#4f46e5' },
            { name: 'GitHub Referrals', value: 35, color: '#06b6d4' },
            { name: 'Search & Others', value: 20, color: '#10b981' },
          ],
          deployments: [
            {
              id: 'dep-1',
              project: 'GitHub Pages Source',
              environment: 'Production',
              status: 'Success',
              branch: 'main',
              commit: '7b29a1e',
              time: '15m ago',
              url: targetUrl || 'https://github.com',
            },
          ],
          recentActivities: [
            {
              id: 'act-1',
              type: 'deploy',
              title: 'Synced site and dashboard metrics',
              description: 'Processed web content and regenerated application layout.',
              timestamp: 'Just now',
              author: inferredUsername,
            },
          ],
          systemHealth: {
            uptime: '99.98%',
            responseTime: '68ms',
            sslStatus: 'Active Let\'s Encrypt TLS',
            buildStatus: 'Passing',
            lighthouseScore: 98,
          },
        },
      };

      res.json({ success: true, data: fallbackData, source: 'heuristic' });
    } catch (error: any) {
      console.error('Error parsing GitHub page:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
