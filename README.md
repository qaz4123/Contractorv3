# Contractorv3

Real estate analysis system with AI and real-time web search.

## Architecture

```
Contractorv3
├── server/                    # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   │   ├── search/       # Tavily web search
│   │   │   ├── ai/           # Gemini AI analysis
│   │   │   ├── auth/         # Authentication
│   │   │   └── cache/        # Caching layer
│   │   ├── middleware/       # Auth, validation, errors
│   │   └── index.ts          # Entry point
│   └── prisma/               # Database schema
├── client/                    # Frontend (React + TypeScript)
└── shared/                    # Shared types
```

## Technologies

- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL (Google Cloud SQL)
- **Search**: Tavily API - Real-time web search
- **AI**: Google Gemini 2.0 Flash - Analysis and summarization
- **Cache**: node-cache - API cost optimization
- **Deployment**: Google Cloud Platform (Cloud Run, Cloud SQL)

## Installation

```bash
# Install dependencies
cd server
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Create database tables
npx prisma db push

# Run in development mode
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection (Google Cloud SQL) |
| `TAVILY_API_KEY` | Tavily API key for search |
| `GEMINI_API_KEY` | Google Gemini API key |
| `JWT_SECRET` | Secret key for JWT encryption |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get user details

### Property Analysis
- `POST /api/properties/analyze` - Analyze new property
- `GET /api/properties/history` - Analysis history
- `GET /api/properties/:id` - Specific analysis

### CRM - Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `PATCH /api/leads/:id/status` - Update status

### CRM - Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/today` - Today's tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id/complete` - Mark as completed

### Workflow - Connected Customer Journey
- `POST /api/workflow/leads/:leadId/quotes` - Create quote from lead
- `POST /api/workflow/quotes/:quoteId/project` - Convert quote to project
- `POST /api/workflow/projects/:projectId/invoices` - Create invoice from project
- `POST /api/workflow/quotes/:quoteId/invoices` - Create invoice from quote (skip project)
- `POST /api/workflow/leads/:leadId/lost` - Mark lead as lost
- `GET /api/workflow/leads/:leadId/journey` - Get complete customer journey
- `GET /api/workflow/projects/ready-for-invoicing` - Get projects ready for invoicing

## How It Works

### Property Analysis
1. **Information Search**: Tavily searches the web for property information from Zillow, Redfin, Realtor.com, etc.
2. **AI Analysis**: Gemini analyzes the data and generates:
   - Scores (investment, location, condition, market timing)
   - Pros and cons
   - Recommendations
   - Summary
3. **Caching**: Results are cached for 60 minutes to save API costs

### Customer Journey Workflow
The system manages the complete customer lifecycle with connected workflows:

1. **Lead** → Create from property analysis or manual entry
   - AI-powered lead intelligence and scoring
   - Track communication and follow-ups
   
2. **Lead → Quote** → Create professional quotes
   - One-click quote creation from lead
   - Automatically updates lead status to "Proposal Sent"
   - Track quote status (sent, viewed, accepted, rejected)
   
3. **Quote → Project** → Convert accepted quotes to projects
   - Automatic project creation when quote is accepted
   - Updates lead status to "Won"
   - Inherits all quote details and client information
   - Track milestones, photos, and progress
   
4. **Project → Invoice** → Generate invoices from projects
   - Create invoices from completed or in-progress work
   - Links to original quote and lead
   - Automatically pulls project costs and client info
   - Track payments and due dates

**Alternative Path**: Quote → Invoice (for simple jobs that don't need project management)

**Journey Insights**: View complete customer journey with all quotes, projects, invoices, and metrics in one place

## Development Setup

### Local Development:

```bash
# Terminal 1: Start Backend
cd server
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev

# Terminal 2: Start Frontend
cd client
npm install
npm run dev
```

The frontend will proxy API requests to the backend at `http://localhost:8080`.

## Deploy to Google Cloud Platform (Recommended Setup)

**⭐ Recommended: Separated Frontend & Backend Architecture**

This is the production-ready deployment approach with better performance, cost-effectiveness, and scalability.

### Architecture:
```
┌─────────────────────────────────────────────────────────┐
│              Google Cloud Platform                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Frontend (Client)          Backend (Server)             │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │ Cloud Storage    │◄────►│ Cloud Run        │        │
│  │ + Cloud CDN      │      │ + Cloud SQL      │        │
│  │ (Static Files)   │      │ (API Server)     │        │
│  └──────────────────┘      └──────────────────┘        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Benefits:
- ✅ **50-70% cost reduction** - Static hosting is much cheaper
- ✅ **Global CDN** - Frontend served from edge locations worldwide
- ✅ **Independent scaling** - Backend scales based on API load only
- ✅ **Faster deployments** - Deploy frontend/backend independently
- ✅ **Better security** - Clear separation of concerns
- ✅ **Easier rollbacks** - Rollback services independently

### Quick Deploy:

**See [DEPLOYMENT_SEPARATED.md](DEPLOYMENT_SEPARATED.md) for complete step-by-step guide.**

```bash
# 1. Deploy Backend to Cloud Run
cd server
gcloud builds submit --config cloudbuild.backend.yaml

# 2. Get Backend URL
BACKEND_URL=$(gcloud run services describe contractorv3-backend \
  --region=us-central1 --format='value(status.url)')

# 3. Deploy Frontend to Cloud Storage
cd ../client
gcloud builds submit --config cloudbuild.frontend.yaml \
  --substitutions=_BACKEND_URL=$BACKEND_URL

# Done! ✅
```

### Prerequisites:

1. **Enable Required APIs:**
   ```bash
   gcloud services enable \
     cloudbuild.googleapis.com \
     run.googleapis.com \
     sqladmin.googleapis.com \
     storage.googleapis.com \
     secretmanager.googleapis.com
   ```

2. **Create Secrets in Secret Manager:**
   ```bash
   echo -n "your-database-url" | gcloud secrets create DATABASE_URL --data-file=-
   echo -n "$(openssl rand -base64 32)" | gcloud secrets create JWT_SECRET --data-file=-
   echo -n "your-gemini-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
   echo -n "your-tavily-key" | gcloud secrets create TAVILY_API_KEY --data-file=-
   ```

3. **Create Cloud SQL Instance:**
   ```bash
   gcloud sql instances create contractorv3-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

4. **Create Storage Bucket:**
   ```bash
   gsutil mb -l us-central1 gs://contractorv3-frontend
   gsutil iam ch allUsers:objectViewer gs://contractorv3-frontend
   ```

### Cost Estimate:
- **Backend (Cloud Run)**: $5-15/month (scales to zero when idle)
- **Frontend (Storage)**: $0.02-0.50/month
- **Database (Cloud SQL)**: $7-10/month
- **Total**: ~$12-25/month for small-medium traffic

---

### Alternative: Monolithic Deployment

For quick prototypes or very small projects, you can deploy as a single container:
- See: [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)
- ⚠️ Higher costs, coupled scaling, slower deployments
