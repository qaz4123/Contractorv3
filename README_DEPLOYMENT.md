# Property Analyzer - Google Cloud Deployment Guide

A comprehensive property investment analysis application built for Google Cloud Platform.

## Features

- **Property Analysis**: Calculate ROI, cash flow, cap rate, and other investment metrics
- **Financial Modeling**: Customizable assumptions for rent, expenses, financing, and appreciation
- **Cloud-Native**: Built specifically for Google Cloud services
- **Secure**: API keys and credentials managed via environment variables and Google Secret Manager
- **Scalable**: Deployable to Cloud Run, App Engine, or Cloud Functions

## Architecture

- **Backend**: Python Flask API
- **Database**: Google Cloud Firestore (NoSQL)
- **Storage**: Google Cloud Storage (optional)
- **Secrets**: Google Cloud Secret Manager
- **Deployment**: Cloud Run, App Engine, or Cloud Functions

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK** (`gcloud` CLI) installed
3. **Python 3.12+** for local development
4. **Docker** (for Cloud Run deployment)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Contractorv3
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
GCP_REGION=us-central1
FIRESTORE_COLLECTION_PROPERTIES=properties
FIRESTORE_COLLECTION_ANALYSES=analyses
```

**Important**: Leave API keys empty in `.env`. Use Google Secret Manager for production.

### 5. Run Locally

```bash
python -m src.api.app
```

The API will be available at `http://localhost:8080`

## Google Cloud Setup

### 1. Create Google Cloud Project

```bash
gcloud projects create your-project-id
gcloud config set project your-project-id
```

### 2. Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable storage.googleapis.com
```

### 3. Initialize Firestore

```bash
gcloud firestore databases create --region=us-central1
```

### 4. Set Up Secret Manager (Optional)

For production API keys, use Google Secret Manager:

```bash
# Create secrets for API keys
echo -n "your-zillow-api-key" | gcloud secrets create ZILLOW_API_KEY --data-file=-
echo -n "your-redfin-api-key" | gcloud secrets create REDFIN_API_KEY --data-file=-
echo -n "your-realtor-api-key" | gcloud secrets create REALTOR_API_KEY --data-file=-
```

## Deployment Options

### Option 1: Deploy to Cloud Run (Recommended)

Cloud Run is serverless, scales to zero, and only charges for usage.

```bash
# Build and deploy
gcloud builds submit --config cloudbuild.yaml

# Or deploy directly
gcloud run deploy property-analyzer \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 2: Deploy to App Engine

```bash
gcloud app deploy app.yaml
```

### Option 3: Build and Deploy Docker Image

```bash
# Build Docker image
docker build -t gcr.io/your-project-id/property-analyzer .

# Push to Container Registry
docker push gcr.io/your-project-id/property-analyzer

# Deploy to Cloud Run
gcloud run deploy property-analyzer \
  --image gcr.io/your-project-id/property-analyzer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## API Endpoints

### Health Check
```
GET /
```

### Create Property
```
POST /api/properties
Content-Type: application/json

{
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94102",
  "purchase_price": 500000,
  "property_type": "single_family",
  "bedrooms": 3,
  "bathrooms": 2,
  "square_feet": 1500,
  "year_built": 2000
}
```

### Analyze Property
```
POST /api/analyze
Content-Type: application/json

{
  "property": {
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102",
    "purchase_price": 500000,
    "property_type": "single_family",
    "bedrooms": 3,
    "bathrooms": 2,
    "square_feet": 1500,
    "year_built": 2000
  },
  "assumptions": {
    "down_payment_percentage": 20,
    "interest_rate": 7.0,
    "loan_term_years": 30,
    "monthly_rent": 3000,
    "property_tax_annual": 5000,
    "insurance_annual": 1200,
    "maintenance_percentage": 10,
    "property_management_percentage": 10
  }
}
```

### Get Property
```
GET /api/properties/{property_id}
```

### List Properties
```
GET /api/properties?limit=100
```

### Get Property Analyses
```
GET /api/properties/{property_id}/analyses
```

## Security Best Practices

1. **Never commit API keys or credentials** to version control
2. **Use Google Secret Manager** for production secrets
3. **Enable authentication** for production APIs
4. **Use IAM roles** to control access to Google Cloud resources
5. **Set up VPC** for additional network security
6. **Enable Cloud Armor** for DDoS protection

## Environment Variables

All sensitive configuration should be set via environment variables:

- `GOOGLE_CLOUD_PROJECT`: Your Google Cloud project ID
- `GCP_REGION`: Deployment region (default: us-central1)
- `ZILLOW_API_KEY`: API key for Zillow (leave empty, use Secret Manager)
- `REDFIN_API_KEY`: API key for Redfin (leave empty, use Secret Manager)
- `REALTOR_API_KEY`: API key for Realtor (leave empty, use Secret Manager)

## Cost Estimation

- **Cloud Run**: Free tier includes 2 million requests/month
- **Firestore**: Free tier includes 1GB storage, 50K reads/day
- **Secret Manager**: $0.06 per 10K access operations
- **Cloud Build**: 120 build-minutes/day free

## Monitoring

Set up monitoring in Google Cloud Console:

```bash
# View logs
gcloud logs read --project=your-project-id --limit 50

# Set up alerts
gcloud alpha monitoring policies create --config-from-file=alerting-policy.yaml
```

## Testing

Run tests locally:

```bash
pytest tests/
```

## Support

For issues and questions, please open an issue in the repository.

## License

[Your License Here]
