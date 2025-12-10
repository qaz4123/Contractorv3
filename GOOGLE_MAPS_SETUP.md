# Google Maps API Setup

## הבעיה הנוכחית
המפתח הנוכחי `AIzaSyA83NhFFyPif5Fj1vlBJawzr2AUdznrhPQ` מוגבל ולא עובד מ-localhost.

## פתרון: הסרת הגבלות API

1. **עבור ל-Google Cloud Console:**
   https://console.cloud.google.com/google/maps-apis/credentials

2. **בחר את המפתח הנוכחי:**
   - לחץ על שם המפתח

3. **ערוך הגבלות אפליקציה:**
   - בחר: **None** (לפיתוח)
   - או הוסף: `localhost:*`, `127.0.0.1:*`, `*.gitpod.io`, `*.github.dev`

4. **וודא שה-APIs הבאים מופעלים:**
   - ✅ Maps JavaScript API
   - ✅ Places API
   - ✅ Geocoding API

5. **שמור שינויים**

## יצירת מפתח חדש (אלטרנטיבה)

```bash
# 1. צור פרויקט חדש או השתמש בקיים
gcloud config set project contractorv3

# 2. הפעל את ה-APIs הנדרשים
gcloud services enable \
  maps-backend.googleapis.com \
  places-backend.googleapis.com \
  geocoding-backend.googleapis.com

# 3. צור API key
gcloud alpha services api-keys create \
  --display-name="Contractor CRM Development" \
  --project=contractorv3

# 4. העתק את המפתח ל-.env
```

## עדכון המפתח באפליקציה

עדכן את הקובץ `/workspaces/Contractorv3/client/.env`:

```bash
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_KEY_HERE
```

## מצב גיבוי (ללא Maps)

האפליקציה תמשיך לעבוד ללא Google Maps API:
- ✅ כניסת משתמשים
- ✅ ניהול לידים
- ✅ חיפוש עם Tavily
- ✅ ניתוח עם Gemini
- ⚠️ השדה כתובת יהיה קלט טקסט פשוט (ללא autocomplete)

## בדיקת המפתח

```bash
# בדוק אם המפתח תקף
curl "https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway&key=YOUR_API_KEY"
```

תגובה מוצלחת אמורה להכיל `"status": "OK"`

## עלות

- **Maps JavaScript API**: $7 לכל 1,000 טעינות
- **Places API**: $17 לכל 1,000 requests
- **Geocoding API**: $5 לכל 1,000 requests

💡 **זכרו**: יש ₪200 קרדיט חודשי חינם!
