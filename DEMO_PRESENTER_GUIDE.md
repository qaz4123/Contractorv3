# ContractorCRM - Demo Presenter Guide

## Pre-Demo Setup Checklist

### 1. Environment Preparation
- [ ] Database is running and accessible
- [ ] Backend server is running on port 8080
- [ ] Frontend is running on port 3000 (or deployed)
- [ ] Demo data has been seeded (`npm run db:seed` in server directory)
- [ ] Test login with demo credentials

### 2. Demo Login Credentials
```
Email: demo@contractorcrm.com
Password: Demo123!
```

### 3. Browser Setup
- Clear browser cache and cookies
- Have developer console ready (F12) for debugging if needed
- Ensure good internet connection
- Maximize browser window for better visibility

---

## Demo Flow: Complete User Journey

### Act 1: Authentication & Dashboard (2-3 minutes)

#### Step 1: Landing Page
- **URL**: `http://localhost:3000` (or production URL)
- **What to say**: "Welcome to ContractorCRM - an AI-powered contractor management system."
- **Action**: Click "Sign In" or navigate to login

#### Step 2: Login
- **What to say**: "Let's log into our demo account. The system uses JWT-based authentication with secure token management."
- **Action**: 
  - Enter email: `demo@contractorcrm.com`
  - Enter password: `Demo123!`
  - Click "Sign In"
- **Expected**: Smooth redirect to dashboard

#### Step 3: Dashboard Overview
- **What to say**: "Here's our main dashboard with real-time insights."
- **Highlight**:
  - Total leads and conversion metrics
  - Active projects and their status
  - Upcoming tasks and reminders
  - Revenue tracking and analytics
- **Action**: Briefly scroll through dashboard sections

---

### Act 2: Lead Management & Intelligence (5-7 minutes)

#### Step 4: View Leads
- **Navigation**: Click "Leads" in sidebar
- **What to say**: "Our lead management system tracks all potential clients."
- **Highlight**:
  - Lead list with status indicators
  - AI-generated lead scores (85-95%)
  - Quick filters by status
- **Action**: Show the list of pre-seeded leads

#### Step 5: Lead Detail View
- **Action**: Click on "Sarah Johnson" lead
- **What to say**: "Each lead has a detailed profile with AI-powered intelligence."
- **Highlight**:
  - Contact information
  - Property address
  - Lead intelligence scores:
    - Renovation Potential: 95%
    - Owner Motivation: 90%
    - Profit Potential: 90%
  - Notes and follow-up history
- **Optional**: Click "Refresh Intelligence" to demonstrate AI analysis (if APIs configured)

#### Step 6: Create New Lead (Optional)
- **Action**: Click "New Lead" button
- **What to say**: "Adding a new lead is simple and intuitive."
- **Fill in**:
  - Name: "Robert Williams"
  - Email: "rwilliams@example.com"
  - Phone: "(555) 999-8888"
  - Address: "321 Cedar Lane, Los Angeles, CA 90012"
  - Notes: "Interested in complete home renovation"
- **Action**: Click "Save Lead"
- **Expected**: Lead appears in list immediately

---

### Act 3: Subcontractor Marketplace (3-4 minutes)

#### Step 7: Search Subcontractors
- **Navigation**: Click "Subcontractors" in sidebar
- **What to say**: "Our marketplace connects you with verified, rated subcontractors."
- **Highlight**:
  - Location-based search
  - Trade filters (Plumbing, Electrical, Tile Work)
  - Rating and review system
  - Distance calculation
  - Availability status
- **Action**: Browse the list of subcontractors

#### Step 8: View Subcontractor Profile
- **Action**: Click on "Mike Wilson - Wilson Plumbing Services"
- **What to say**: "Each subcontractor has a detailed profile."
- **Highlight**:
  - Rating: 4.8/5 (127 reviews)
  - Completed jobs: 234
  - License number and insurance verification
  - Service radius: 50 miles
  - Hourly rate: $85/hr
  - Trades and specializations
- **Action**: Show contact options

---

### Act 4: Project Creation & Management (4-5 minutes)

#### Step 9: View Projects
- **Navigation**: Click "Projects" in sidebar
- **What to say**: "Project management is at the heart of ContractorCRM."
- **Action**: Show existing project "Johnson Residence"

#### Step 10: Create New Project from Lead
- **Navigation**: Go back to "Leads", click on "John Smith"
- **Action**: Click "Convert to Project" button
- **What to say**: "Converting a lead to a project is seamless."
- **Fill in**:
  - Project Name: "Smith Kitchen Remodel"
  - Description: "Complete kitchen renovation with custom cabinets and countertops"
  - Estimated Budget: $65,000
  - Estimated Days: 45
  - Start Date: (Select date 2 weeks from now)
- **Action**: Click "Create Project"
- **Expected**: Project created, lead status updated to "WON"

#### Step 11: View Project Details
- **Action**: Navigate to newly created project
- **What to say**: "Project dashboard shows all details in one place."
- **Highlight**:
  - Project status and timeline
  - Budget tracking
  - Task list
  - Assigned subcontractors (if any)
  - Notes and communications

---

### Act 5: Task Management (2-3 minutes)

#### Step 12: View Tasks
- **Navigation**: Click "Tasks" in sidebar
- **What to say**: "Never miss a deadline with our task management system."
- **Highlight**:
  - Upcoming tasks sorted by priority
  - Due date indicators
  - Task categories (URGENT, HIGH, MEDIUM, LOW)
  - Associated leads/projects
- **Action**: Show task list

#### Step 13: Create New Task
- **Action**: Click "New Task"
- **Fill in**:
  - Title: "Schedule design consultation"
  - Description: "Meet with client to finalize kitchen design"
  - Priority: HIGH
  - Due Date: (Select date 1 week from now)
  - Associated Project: Smith Kitchen Remodel
- **Action**: Click "Save Task"
- **Expected**: Task appears in list immediately

---

### Act 6: Quotes & Invoicing (3-4 minutes)

#### Step 14: View Quotes
- **Navigation**: Click "Quotes" in sidebar
- **What to say**: "Professional quote generation with line items and customization."
- **Action**: Browse quotes (if any exist)

#### Step 15: Create New Quote (Optional)
- **Action**: Click "New Quote"
- **What to say**: "Create detailed quotes quickly."
- **Fill in**:
  - Title: "Kitchen Remodel Quote - Smith Residence"
  - Select Project: Smith Kitchen Remodel
  - Add line items:
    - Cabinets: $15,000
    - Countertops: $8,000
    - Labor: $12,000
  - Tax: 8.5%
  - Valid Until: (30 days from now)
- **Action**: Click "Save Quote"

#### Step 16: Invoices
- **Navigation**: Click "Invoices" in sidebar
- **What to say**: "Track all invoicing and payments in one place."
- **Highlight**:
  - Invoice status (Draft, Sent, Paid, Overdue)
  - Payment tracking
  - Outstanding balance calculations

---

### Act 7: Analytics & Insights (2-3 minutes)

#### Step 17: Analytics Dashboard
- **Navigation**: Click "Analytics" in sidebar
- **What to say**: "Data-driven insights help you grow your business."
- **Highlight**:
  - Revenue trends over time
  - Lead conversion rates
  - Project completion metrics
  - Top performing subcontractors
  - Profit margin analysis

---

### Act 8: Settings & Profile (1-2 minutes)

#### Step 18: User Settings
- **Navigation**: Click profile icon → "Settings"
- **What to say**: "Customize your profile and preferences."
- **Highlight**:
  - Company information
  - Notification preferences
  - Password management
  - Subscription tier (if applicable)

---

## Demo Closing (1 minute)

### Key Takeaways to Emphasize:
1. **All-in-One Solution**: Lead management, project tracking, invoicing, and team collaboration in one platform
2. **AI-Powered Intelligence**: Smart lead scoring and property analysis
3. **Marketplace Integration**: Easy access to verified subcontractors
4. **Professional Tools**: Quote generation, invoicing, and payment tracking
5. **Real-Time Analytics**: Data-driven insights for business growth

### Call to Action:
"ContractorCRM streamlines every aspect of your construction business, from lead capture to project completion. Ready to see how it can transform your workflow?"

---

## Troubleshooting Tips

### If Login Fails:
1. Check database connection
2. Verify demo user exists: `npm run db:seed`
3. Check browser console for errors
4. Verify JWT_SECRET is configured

### If Pages Are Slow:
1. Check backend server is running
2. Verify database queries are optimized
3. Check network tab for failed requests

### If Data Doesn't Appear:
1. Run seed script: `npm run db:seed` in server directory
2. Check API responses in network tab
3. Verify authentication token is valid

### If Navigation Doesn't Work:
1. Clear browser cache
2. Check React Router configuration
3. Verify protected routes are configured correctly

---

## Quick Recovery Commands

### Reset Demo Data:
```bash
cd server
npm run db:push --force-reset
npm run db:seed
```

### Restart Servers:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Check Server Health:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/health
```

---

## Advanced Demo Features (If Time Permits)

### Material Orders
- Show material supplier search
- Demonstrate order creation
- Track delivery status

### Financing Options
- Show financing offers for projects
- Demonstrate commission tracking

### Notifications
- Show real-time notification system
- Demonstrate task reminders

### Commissions
- Show marketplace commission tracking
- Demonstrate referral system

---

## Post-Demo Q&A Preparation

### Common Questions & Answers:

**Q: "Is the data in the cloud?"**
A: "Yes, we use Google Cloud Platform with Cloud Run for serverless deployment and Cloud SQL for database management."

**Q: "How secure is the authentication?"**
A: "We use industry-standard JWT tokens with bcrypt password hashing and refresh token rotation."

**Q: "Can I integrate with other tools?"**
A: "Yes, our API-first architecture allows integration with QuickBooks, Stripe, and other popular tools."

**Q: "What about mobile access?"**
A: "The interface is fully responsive and works on all devices. Native mobile apps are on our roadmap."

**Q: "How is pricing structured?"**
A: "We offer tiered pricing: Free for 1-5 projects, Starter at $49/mo, Professional at $149/mo, and custom Enterprise plans."

**Q: "What kind of support do you provide?"**
A: "Professional and Enterprise plans include priority email support, phone support, and dedicated account management."

---

## Success Metrics to Track

After the demo, note:
- [ ] Login worked smoothly
- [ ] All pages loaded quickly (< 2 seconds)
- [ ] No JavaScript errors in console
- [ ] Data displayed correctly
- [ ] Navigation was intuitive
- [ ] Audience engagement level
- [ ] Questions asked
- [ ] Interest in features shown

---

**Good luck with your demo! 🚀**
