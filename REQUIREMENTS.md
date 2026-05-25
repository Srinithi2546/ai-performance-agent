# Complete Requirements - PulseGuard AI

## Backend Requirements (Python)
**Location:** `backend/requirements.txt`

```
fastapi==0.136.3
uvicorn==0.47.0
sqlalchemy==2.0.28
openai==1.42.0
python-dotenv==1.0.0
pydantic==2.9.0
```

### Installation
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
```

---

## Dashboard Requirements (Node.js - Next.js)
**Location:** `dashboard/package.json`

### Dependencies
```json
{
  "framer-motion": "^12.40.0",
  "lucide-react": "^1.16.0",
  "next": "16.2.6",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "recharts": "^3.8.1"
}
```

### Dev Dependencies
```json
{
  "@tailwindcss/postcss": "^4",
  "eslint": "^9",
  "eslint-config-next": "16.2.6",
  "tailwindcss": "^4"
}
```

### Installation
```bash
cd dashboard
npm install
# or
yarn install
```

---

## Website Requirements (Node.js - Vite + React)
**Location:** `website/package.json`

### Dependencies
```json
{
  "react": "^19.2.6",
  "react-dom": "^19.2.6",
  "web-vitals": "^5.2.0"
}
```

### Dev Dependencies
```json
{
  "@eslint/js": "^10.0.1",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^6.0.1",
  "eslint": "^10.3.0",
  "eslint-plugin-react-hooks": "^7.1.1",
  "eslint-plugin-react-refresh": "^0.5.2",
  "globals": "^17.6.0",
  "vite": "^8.0.12"
}
```

### Installation
```bash
cd website
npm install
# or
yarn install
```

---

## SDK Requirements (Node.js)
**Location:** `sdk/package.json`

### Dependencies
```json
{
  "web-vitals": "^5.2.0"
}
```

### Installation
```bash
cd sdk
npm install
# or
yarn install
```

---

## System Requirements

### Required
- **Node.js:** 20+
- **Python:** 3.9+
- **npm** or **yarn:** Latest version

### API Keys Required
- **Groq API Key:** https://console.groq.com
- **OpenAI API Key:** https://platform.openai.com/api-keys

---

## Quick Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Dashboard Setup
```bash
cd dashboard
npm install
npm run dev  # Development server at http://localhost:3000
```

### 3. Website Setup
```bash
cd website
npm install
npm run dev  # Development server at http://localhost:5173
```

### 4. SDK Setup
```bash
cd sdk
npm install
```

---

## Environment Variables

Create `.env` file in `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```
