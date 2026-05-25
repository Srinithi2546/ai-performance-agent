# PulseGuard AI - Frontend Performance Monitoring System

**An AI-powered SaaS-style frontend monitoring solution similar to Sentry, New Relic, and Vercel Analytics**

## 🎯 Overview

PulseGuard AI is a complete frontend performance monitoring and analysis system built for the hackathon. It provides real-time monitoring of:

- **Web Vitals**: LCP, CLS, INP
- **JavaScript Errors**: Runtime errors and unhandled rejections
- **API Performance**: Fetch monitoring and failure tracking
- **AI Analysis**: Automated performance issue detection and recommendations
- **Real-time Dashboard**: WebSocket-powered live updates
- **Deployment Tracking**: Pre/post deployment regression analysis

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Website                           │
│              (Website running at :5173)                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├─ [PulseGuard SDK Injected]
                   │  • Monitors Web Vitals (LCP, CLS, INP)
                   │  • Captures JS Errors
                   │  • Intercepts Fetch API
                   │  • Tracks Sessions
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│         Backend API (FastAPI at :8000)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • POST /metrics - Receive telemetry                  │  │
│  │ • POST /errors - Receive error reports              │  │
│  │ • GET /dashboard - Dashboard data                   │  │
│  │ • GET /deployments - Deployment analysis            │  │
│  │ • WS /ws - WebSocket for real-time updates         │  │
│  │ • AI Analysis Engine (Groq/OpenAI)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌─────────────────┐  ┌──────────────────────┐
│  Next.js        │  │   Storage           │
│  Dashboard      │  │ (In-memory for demo) │
│  (:3000)        │  │ (Use DB in prod)     │
│                 │  │                      │
│ • Overview      │  │ • Metrics history    │
│ • Metrics       │  │ • Error logs         │
│ • Errors        │  │ • AI insights        │
│ • AI Insights   │  │ • Sessions           │
│ • Deployments   │  │ • Deployment info    │
└─────────────────┘  └──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (included in project)
- Python 3.9+
- API Key for Groq or OpenAI

### Step 1: Setup Environment Variables

Create `.env` file in `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

Get API keys from:
- **Groq**: https://console.groq.com
- **OpenAI**: https://platform.openai.com/api-keys

### Step 2: Start the Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows

pip install -r requirements.txt
# Or manually:
pip install fastapi uvicorn sqlalchemy openai python-dotenv

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### Step 3: Start the Frontend Website

```bash
cd website

# Using bundled Node (if npm not in PATH)
"../node22/node-v22.14.0-win-x64/npm.cmd" install
"../node22/node-v22.14.0-win-x64/npm.cmd" run dev -- --host 0.0.0.0

# Or with system npm
npm install
npm run dev
```

Website will be available at: `http://localhost:5173`

### Step 4: Start the Dashboard

```bash
cd dashboard

# Install dependencies
"../node22/node-v22.14.0-win-x64/npm.cmd" install

# Start dev server
"../node22/node-v22.14.0-win-x64/npm.cmd" run dev
```

Dashboard will be available at: `http://localhost:3000`

## 📊 Features

### 1. SDK (Intelligent Metric Collection)

**Location**: `website/src/sdk.js`

Features:
- ✅ Web Vitals monitoring (LCP, CLS, INP)
- ✅ Fetch API interception for API tracking
- ✅ JavaScript error capture
- ✅ Unhandled promise rejection tracking
- ✅ Page visibility monitoring
- ✅ Session tracking
- ✅ Beacon API for data delivery (survives page navigation)

```javascript
// SDK automatically initializes on page load
// Accessible via window.PulseGuard for manual tracking
window.PulseGuard.trackCustomEvent('event_name', { data: 'value' })
```

### 2. Backend API

**Location**: `backend/main.py`

Endpoints:

```
GET /
  Health check and status

POST /metrics
  Receive metrics from SDK
  Body: {
    name: string (LCP, CLS, INP, API_CALL, API_ERROR, JS_ERROR, etc)
    type: string (web_vital, api, js_error, etc)
    value: number
    rating: string (good, needs-improvement, poor)
    ...
  }

POST /errors
  Receive error reports
  Body: { message, filename, lineno, stack, ... }

GET /dashboard
  Get complete dashboard data
  Returns: {
    summary: { lcp, cls, inp, errors, sessions },
    metrics: { recent_vitals, api_stats, error_stats },
    errors: [ ... ],
    ai_analysis: string,
    ...
  }

GET /deployments
  Get deployment analysis
  Returns: {
    deployment: { version, commit, status, ... },
    comparison: [ { metric, before, after, delta, status } ],
    risk_level: string,
    ai_analysis: string,
    ...
  }

WS /ws
  WebSocket for real-time updates
  Messages: { type: 'metric'|'error'|'analysis', data, ... }
```

### 3. Dashboard

**Location**: `dashboard/app/page.js`

Pages:
- **Overview**: Real-time metrics, AI insights, error summary
- **Metrics**: Detailed web vital tracking and API stats
- **Errors**: Live error feed with full stack traces
- **AI Insights**: AI-generated performance recommendations
- **Deployments**: Deployment regression analysis

Technology:
- Next.js 16 (React 19 framework)
- Recharts for data visualization
- Tailwind CSS for styling
- Framer Motion for animations
- WebSocket for real-time updates

## 🧪 Testing & Demo

### Good Performance Demo

Navigate to `http://localhost:5173` → Select "Good Performance Demo"

This demonstrates:
- Fast page loads with optimized images
- Quick API responses
- No JavaScript errors
- Low CLS values

**Expected Dashboard Results**:
- LCP: 1-2 seconds (Good)
- CLS: ~0.01 (Good)
- INP: 50-100ms (Good)
- Error rate: 0%

### Bad Performance Demo

Navigate to `http://localhost:5173` → Select "Bad Performance Demo"

This demonstrates:
- Huge 4K images (impacts LCP)
- Slow simulated API calls
- JavaScript errors on demand
- Layout shifts (CLS)
- Blocked main thread (INP)

**Expected Dashboard Results**:
- LCP: 5-10+ seconds (Poor)
- CLS: 0.2-0.5+ (Poor)
- INP: 200-500+ms (Poor)
- Error count: Multiple
- AI analysis: Recommendations for optimization

### Demo Workflow

1. **Start System**
   ```bash
   # Terminal 1: Backend
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2: Frontend
   cd website
   npm run dev -- --host 0.0.0.0
   
   # Terminal 3: Dashboard
   cd dashboard
   npm run dev
   ```

2. **Open Tabs**
   - Browser Tab 1: Website at http://localhost:5173
   - Browser Tab 2: Dashboard at http://localhost:3000
   - Browser Tab 3: Backend at http://localhost:8000 (for health check)

3. **Test Bad Performance**
   - Go to website tab
   - Select "Bad Performance Demo"
   - Click buttons to trigger issues
   - Watch dashboard update in real-time

4. **Observe AI Analysis**
   - Check "AI Insights" page in dashboard
   - See automated recommendations

5. **Deployment Analysis**
   - Go to "Deployments" page
   - See before/after comparison
   - Review regression analysis

## 📁 Project Structure

```
pulseguard-ai/
│
├── website/                    # Vite + React Frontend
│   ├── src/
│   │   ├── App.jsx            # Demo selector & pages
│   │   ├── sdk.js             # PulseGuard SDK (injected)
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── sdk/                        # Standalone SDK (optional export)
│   ├── sdk.js
│   └── package.json
│
├── backend/                    # FastAPI Backend
│   ├── main.py                # API endpoints & data collection
│   ├── ai_service.py          # AI analysis engine
│   ├── .env                   # API keys
│   ├── requirements.txt
│   └── venv/                  # Virtual environment
│
├── dashboard/                 # Next.js Admin Dashboard
│   ├── app/
│   │   ├── page.js            # Main dashboard page
│   │   └── globals.css
│   ├── components/
│   │   ├── MetricsCard.jsx    # Metric components
│   │   └── Charts.jsx         # Chart components
│   ├── lib/
│   │   └── api.js             # API & WebSocket client
│   ├── package.json
│   └── next.config.mjs
│
└── README.md                  # This file
```

## 🔌 API Integration

### Integrating with Your Website

Add this to your HTML `<head>` or after React mounts:

```html
<script src="http://localhost:8000/sdk/sdk.js"></script>
```

Or import in React:

```javascript
import 'http://localhost:8000/sdk/sdk.js'
```

The SDK automatically:
- Initializes on page load
- Tracks all metrics
- Captures errors
- Sends data to backend
- No configuration needed

### Custom Event Tracking

```javascript
window.PulseGuard.trackCustomEvent('feature_used', {
  feature_name: 'checkout',
  value: 100,
})
```

## 🤖 AI Analysis

The system uses **Groq API** (or OpenAI) to generate insights:

### Metrics Analysis

When metrics are degraded:
```
"Performance degraded due to render-blocking JavaScript. 
LCP increased from 2.1s to 5.2s. 
Recommendation: Implement code splitting and lazy loading."
```

### Deployment Analysis

When a deployment impacts performance:
```
"Deployment v2.1.4 caused critical performance regression.
LCP spike of 156%. Likely causes: New third-party script or 
bundle size increase. Confidence: 94%"
```

## 📊 Data Models

### Metric Schema
```python
{
  "name": "LCP",                      # Metric type
  "type": "web_vital",                # Category
  "value": 2.5,                       # Value
  "rating": "good",                   # good|needs-improvement|poor
  "delta": 0.2,                       # Change from baseline
  "sessionId": "session_...",         # Session identifier
  "url": "http://localhost:5173",     # Page URL
  "timestamp": "2026-05-24T10:30:00", # When metric was recorded
}
```

### Error Schema
```python
{
  "name": "JS_ERROR",
  "type": "js_error",
  "message": "Cannot read property 'x' of undefined",
  "filename": "App.jsx",
  "lineno": 42,
  "colno": 15,
  "stack": "Error: ...",
  "sessionId": "session_...",
  "timestamp": "2026-05-24T10:30:00",
}
```

## 🔄 Real-time Updates

WebSocket messages flow:

**Client → Server**:
```json
{ "type": "ping" }
```

**Server → Client**:
```json
{
  "type": "metric",
  "data": { metric object },
  "summary": { dashboard summary }
}

{
  "type": "error",
  "data": { error object },
  "summary": { dashboard summary }
}

{
  "type": "analysis",
  "data": { "analysis": "AI insights..." }
}
```

## 🛠️ Development Tips

### Debugging SDK

```javascript
// SDK logs to console with [PulseGuard] prefix
// Enable verbose logging by checking browser DevTools Console

// Manual metric send
window.PulseGuard.sendMetric({
  name: 'CUSTOM_EVENT',
  type: 'custom',
  value: 42,
})
```

### Testing API

```bash
# Test backend health
curl http://localhost:8000

# Test metrics endpoint
curl -X POST http://localhost:8000/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LCP",
    "type": "web_vital",
    "value": 2.5,
    "rating": "good"
  }'

# Get dashboard data
curl http://localhost:8000/dashboard

# Get deployments
curl http://localhost:8000/deployments
```

### Common Issues

**Dashboard not showing data**:
- Check backend is running: `curl http://localhost:8000`
- Check WebSocket connection in browser DevTools
- Verify SDK is loaded on website (check console logs)
- Check CORS is enabled on backend

**No AI Analysis**:
- Verify `.env` has valid API keys
- Check backend logs for AI service errors
- Try making an API call to trigger analysis

**WebSocket disconnects**:
- Normal, SDK reconnects automatically
- Check backend console for errors
- Verify firewall allows WebSocket connections

## 🚀 Production Deployment

For production use:

1. **Database**: Replace in-memory storage with PostgreSQL
2. **Cache**: Add Redis for session caching
3. **Security**: Add authentication & rate limiting
4. **Monitoring**: Add APM like New Relic or Datadog
5. **Scaling**: Use load balancer & multiple backend instances
6. **CDN**: Serve SDK via CDN for better performance
7. **Data Retention**: Implement data archival policy
8. **Privacy**: Add user consent & data anonymization

## 📝 License

Built for Hackathon 2026

## 🙏 Credits

- **Frontend Monitoring**: web-vitals library
- **AI Analysis**: Groq API
- **Dashboard UI**: Tailwind CSS + Framer Motion
- **Real-time**: WebSockets + Next.js

## 📞 Support

For questions or issues:
1. Check the backend logs: `python -m uvicorn main:app --reload`
2. Check browser console for SDK errors
3. Verify all services are running on correct ports

---

**Happy Performance Monitoring! 🎉**
