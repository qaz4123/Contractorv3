# Twilio SMS Configuration Guide

## יצירת Secrets ב-GCP

אם עדיין לא יצרת את ה-secrets, הרץ את הפקודות הבאות:

```bash
# Set project
gcloud config set project contractorv3

# יצירת Twilio Account SID secret
echo -n "YOUR_TWILIO_ACCOUNT_SID" | gcloud secrets create TWILIO_ACCOUNT_SID \
  --data-file=- \
  --replication-policy="automatic"

# יצירת Twilio Auth Token secret
echo -n "YOUR_TWILIO_AUTH_TOKEN" | gcloud secrets create TWILIO_AUTH_TOKEN \
  --data-file=- \
  --replication-policy="automatic"

# יצירת Twilio Phone Number secret
echo -n "+1234567890" | gcloud secrets create TWILIO_PHONE_NUMBER \
  --data-file=- \
  --replication-policy="automatic"

# הענקת הרשאות ל-Cloud Run
gcloud secrets add-iam-policy-binding TWILIO_ACCOUNT_SID \
  --member="serviceAccount:291626603758-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding TWILIO_AUTH_TOKEN \
  --member="serviceAccount:291626603758-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding TWILIO_PHONE_NUMBER \
  --member="serviceAccount:291626603758-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## אם כבר יש לך secret בשם "twilio"

אם יצרת secret אחד בשם `twilio` עם כל הערכים, צריך ליצור 3 secrets נפרדים:

```bash
# קבל את הערך מה-secret הקיים
TWILIO_DATA=$(gcloud secrets versions access latest --secret="twilio")

# פרק לשלושה ערכים (בהנחה שזה JSON)
# דוגמה אם זה JSON:
echo $TWILIO_DATA | jq -r '.account_sid' | gcloud secrets create TWILIO_ACCOUNT_SID --data-file=-
echo $TWILIO_DATA | jq -r '.auth_token' | gcloud secrets create TWILIO_AUTH_TOKEN --data-file=-
echo $TWILIO_DATA | jq -r '.phone_number' | gcloud secrets create TWILIO_PHONE_NUMBER --data-file=-
```

## בדיקת Secrets

```bash
# בדוק שכל ה-secrets קיימים
gcloud secrets list | grep -i twilio

# בדוק גישה
gcloud secrets versions access latest --secret="TWILIO_ACCOUNT_SID"
gcloud secrets versions access latest --secret="TWILIO_AUTH_TOKEN"
gcloud secrets versions access latest --secret="TWILIO_PHONE_NUMBER"
```

## פיצ'רים שיופעלו

ברגע שTwilio מוגדר, התכונות הבאות יעבדו:

1. **התראות SMS למשימות**
   - תזכורות SMS למשימות קרובות
   - התראות על משימות שפג תוקפן

2. **התראות SMS ללידים**
   - הודעה כאשר ליד חדש נוצר
   - עדכון כאשר ליד מתקדם בשלבים

3. **התראות SMS לציטוטים**
   - הודעה כאשר ציטוט נשלח
   - התראה כאשר ציטוט מאושר

4. **התראות SMS לפרויקטים**
   - עדכון על שלב חדש בפרויקט
   - התראה על השלמת פרויקט

## הגדרות משתמש

משתמשים יכולים לשלוט בהתראות SMS דרך Settings:

```typescript
{
  "smsNotifications": true,  // Enable/Disable SMS
  "phone": "+1234567890"     // Phone number for SMS
}
```

## עלויות

**Twilio Pricing (נכון לדצמבר 2025):**
- SMS יוצא (ארה"ב): ~$0.0075 לכל הודעה
- SMS נכנס (ארה"ב): ~$0.0075 לכל הודעה
- מספר טלפון (חודשי): ~$1.15/חודש

💡 **המלצה**: התחל עם Twilio Trial Account לפיתוח ($15 קרדיט חינם)
