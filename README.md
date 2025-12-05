# Property Analyzer v3

A comprehensive property investment analysis application built natively for Google Cloud Platform.

## Overview

This application provides real estate investors and analysts with powerful tools to evaluate property investments. It calculates key financial metrics including ROI, cash flow, cap rate, and provides long-term projections.

## Key Features

- **Investment Analysis**: Calculate comprehensive property investment metrics
- **Financial Modeling**: Customize assumptions for rent, expenses, financing, and appreciation
- **Cloud-Native**: Built specifically for Google Cloud (Firestore, Cloud Run, Secret Manager)
- **Secure Configuration**: All API keys and database credentials are externalized
- **RESTful API**: Easy-to-use API endpoints for integration
- **Scalable Architecture**: Serverless deployment with automatic scaling

## Quick Start

See [README_DEPLOYMENT.md](README_DEPLOYMENT.md) for detailed setup and deployment instructions.

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Google Cloud project ID

# Run locally
python main.py
```

### Deploy to Google Cloud

```bash
# Deploy to Cloud Run
gcloud run deploy property-analyzer --source . --region us-central1

# Or deploy to App Engine
gcloud app deploy app.yaml
```

## Architecture

- **Backend**: Python Flask API
- **Database**: Google Cloud Firestore
- **Secrets**: Google Cloud Secret Manager
- **Hosting**: Cloud Run / App Engine

## API Endpoints

- `GET /` - Health check
- `POST /api/properties` - Create property
- `GET /api/properties/{id}` - Get property details
- `POST /api/analyze` - Analyze property investment
- `GET /api/properties/{id}/analyses` - Get analysis history

## Security

⚠️ **Important**: This codebase contains NO hardcoded API keys or database credentials. All sensitive configuration must be provided via:
- Environment variables (local development)
- Google Cloud Secret Manager (production)

## Documentation

- [Deployment Guide](README_DEPLOYMENT.md) - Complete setup and deployment instructions
- API documentation available at `/` endpoint when running

## License

See LICENSE file for details.
