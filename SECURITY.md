# Security Policy

## Overview

This Property Analyzer application is designed with security best practices for Google Cloud Platform.

## Security Features

### 1. No Hardcoded Secrets
- **All API keys and credentials are externalized**
- Configuration is loaded from environment variables
- Production secrets managed via Google Cloud Secret Manager
- `.env.example` provides template with empty values

### 2. Google Cloud Security Integration

#### Secret Manager
```bash
# Store secrets securely
gcloud secrets create ZILLOW_API_KEY --data-file=-
gcloud secrets create DB_PASSWORD --data-file=-
```

#### IAM and Service Accounts
- Use least-privilege IAM roles
- Separate service accounts for different services
- Never commit service account keys to version control

#### Firestore Security Rules
Example security rules:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /properties/{property} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Environment Configuration

Required environment variables (all should be empty in repository):
- `GOOGLE_CLOUD_PROJECT` - Your GCP project ID
- `ZILLOW_API_KEY` - API key for Zillow (use Secret Manager)
- `REDFIN_API_KEY` - API key for Redfin (use Secret Manager)
- `REALTOR_API_KEY` - API key for Realtor (use Secret Manager)
- `DB_PASSWORD` - Database password (use Secret Manager)

### 4. Network Security

For production deployments:
- Enable Cloud Armor for DDoS protection
- Use VPC Service Controls for private networking
- Implement authentication (OAuth 2.0, API keys)
- Enable HTTPS only (automatic with Cloud Run)

### 5. Data Protection

- All data at rest is encrypted (default in Firestore)
- All data in transit uses TLS (enforced by GCP)
- Regular backups of Firestore data
- Access logging enabled

## Best Practices

1. **Never commit sensitive data**
   - API keys
   - Passwords
   - Service account credentials
   - Connection strings

2. **Use Google Secret Manager for production**
   ```python
   from src.utils.secret_manager import load_api_keys_from_secret_manager
   api_keys = load_api_keys_from_secret_manager()
   ```

3. **Rotate secrets regularly**
   - Update API keys quarterly
   - Rotate service account keys
   - Update database passwords

4. **Monitor and audit**
   - Enable Cloud Logging
   - Set up Cloud Monitoring alerts
   - Review IAM policies regularly

5. **Implement authentication**
   - Use Firebase Auth or Cloud Identity Platform
   - Implement API authentication for production
   - Use Cloud Endpoints for API management

## Reporting Security Issues

If you discover a security vulnerability, please email [security@example.com] or open a confidential issue.

## Compliance

This application follows:
- OWASP Security Principles
- Google Cloud Security Best Practices
- PCI DSS guidelines for handling sensitive data

## Security Checklist

Before deploying to production:

- [ ] All API keys stored in Secret Manager
- [ ] Service account permissions reviewed
- [ ] Firestore security rules configured
- [ ] Authentication enabled on API endpoints
- [ ] HTTPS enforced
- [ ] Logging and monitoring enabled
- [ ] Backup strategy implemented
- [ ] Security scanning completed
- [ ] IAM policies follow least privilege
- [ ] No secrets in environment variables

## Resources

- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
