# ContractorCRM - QA & Demo Readiness Checklist

## Pre-Deployment Checks

### Environment Configuration
- [ ] `DATABASE_URL` is set and accessible
- [ ] `JWT_SECRET` is configured (32+ characters in production)
- [ ] `CORS_ORIGIN` is configured for production domain
- [ ] `NODE_ENV` is set to `production` for production builds
- [ ] All required API keys are in Secret Manager (Gemini, Tavily, Maps)
- [ ] Environment variables load correctly on Cloud Run

### Database
- [ ] Database connection is stable
- [ ] All migrations are applied
- [ ] Prisma client is generated
- [ ] Database has proper indexes
- [ ] Demo data is seeded successfully
- [ ] Database connection pooling is configured

### Security
- [ ] JWT tokens are properly signed and verified
- [ ] Passwords are hashed with bcrypt (10+ rounds)
- [ ] Refresh tokens are stored securely
- [ ] CORS is configured for specific origins (not `*` in production)
- [ ] Rate limiting is enabled on auth endpoints
- [ ] No secrets in code or version control
- [ ] HTTPS is enforced in production
- [ ] SQL injection protection via Prisma parameterized queries

---

## Authentication Flow Tests

### Registration
- [ ] New user can register with valid credentials
- [ ] Email validation works (rejects invalid emails)
- [ ] Password validation works (min 8 chars, letter + number required)
- [ ] Duplicate email registration is prevented
- [ ] User data is stored correctly in database
- [ ] Access token is returned on successful registration
- [ ] Refresh token is returned and stored
- [ ] User is automatically logged in after registration
- [ ] Rate limiting works (10 registrations per hour per IP)

### Login
- [ ] User can login with correct credentials
- [ ] Login fails with incorrect password
- [ ] Login fails with non-existent email
- [ ] Error messages don't reveal if email exists (security)
- [ ] Access token is returned on successful login
- [ ] Refresh token is returned
- [ ] Rate limiting works (10 attempts per 15 minutes per IP)
- [ ] Last login time is updated in database

### Token Management
- [ ] Access token is attached to all authenticated requests
- [ ] Invalid token returns 401 Unauthorized
- [ ] Expired token returns 401 Unauthorized
- [ ] Refresh token can generate new access token
- [ ] Old refresh token is invalidated after refresh
- [ ] Token refresh works seamlessly in frontend
- [ ] Logout invalidates refresh token

### Protected Routes
- [ ] Unauthenticated requests to protected routes return 401
- [ ] Valid token allows access to protected routes
- [ ] Token is verified on every protected request
- [ ] User context is available in request (`req.user`)

---

## Backend API Endpoint Tests

### Health Checks
- [ ] `/health` returns 200 OK
- [ ] `/api/health` returns 200 OK with status info

### Auth Endpoints
- [ ] `POST /api/auth/register` works correctly
- [ ] `POST /api/auth/login` works correctly
- [ ] `POST /api/auth/refresh` works correctly
- [ ] `POST /api/auth/logout` works correctly
- [ ] `GET /api/auth/me` returns current user
- [ ] `POST /api/auth/change-password` works correctly

### Lead Endpoints
- [ ] `GET /api/leads` returns paginated leads
- [ ] `GET /api/leads/:id` returns single lead
- [ ] `POST /api/leads` creates new lead
- [ ] `PATCH /api/leads/:id` updates lead
- [ ] `DELETE /api/leads/:id` deletes lead
- [ ] `POST /api/leads/:id/refresh-intelligence` triggers AI analysis
- [ ] `POST /api/leads/:id/convert-to-project` creates project from lead
- [ ] Lead filtering works (by status, date, etc.)
- [ ] Lead search works (by name, address, etc.)

### Project Endpoints
- [ ] `GET /api/projects` returns paginated projects
- [ ] `GET /api/projects/:id` returns single project
- [ ] `POST /api/projects` creates new project
- [ ] `PUT /api/projects/:id` updates project
- [ ] `DELETE /api/projects/:id` deletes project
- [ ] Project status updates work
- [ ] Budget tracking calculates correctly
- [ ] Project filtering works

### Task Endpoints
- [ ] `GET /api/tasks` returns paginated tasks
- [ ] `GET /api/tasks/:id` returns single task
- [ ] `POST /api/tasks` creates new task
- [ ] `PATCH /api/tasks/:id` updates task
- [ ] `PATCH /api/tasks/:id/complete` marks task complete
- [ ] `DELETE /api/tasks/:id` deletes task
- [ ] Task filtering by priority works
- [ ] Task filtering by due date works
- [ ] Overdue tasks are identified correctly

### Subcontractor Endpoints
- [ ] `GET /api/subcontractors` returns paginated subcontractors
- [ ] `GET /api/subcontractors/:id` returns single subcontractor
- [ ] `GET /api/subcontractors/search` with location works
- [ ] Distance calculation is accurate
- [ ] Trade filtering works
- [ ] Rating filtering works
- [ ] `POST /api/subcontractors/hire` creates hire
- [ ] `GET /api/subcontractors/hires/my` returns contractor's hires

### Quote Endpoints
- [ ] `GET /api/quotes` returns paginated quotes
- [ ] `GET /api/quotes/:id` returns single quote
- [ ] `POST /api/quotes` creates new quote
- [ ] `PUT /api/quotes/:id` updates quote
- [ ] `POST /api/quotes/:id/send` sends quote to client
- [ ] `POST /api/quotes/:id/convert-to-invoice` creates invoice
- [ ] Line item calculations are correct
- [ ] Tax calculations are correct
- [ ] Total amounts are accurate

### Invoice Endpoints
- [ ] `GET /api/invoices` returns paginated invoices
- [ ] `GET /api/invoices/:id` returns single invoice
- [ ] `POST /api/invoices` creates new invoice
- [ ] `POST /api/invoices/:id/send` sends invoice
- [ ] `POST /api/invoices/:id/payments` records payment
- [ ] Invoice status updates correctly
- [ ] Outstanding balance calculates correctly
- [ ] Overdue invoices are flagged

### Analytics Endpoints
- [ ] `GET /api/analytics/dashboard` returns dashboard stats
- [ ] `GET /api/analytics/revenue` returns revenue data
- [ ] `GET /api/analytics/leads` returns lead analytics
- [ ] All calculations are accurate
- [ ] Date range filtering works

---

## Frontend Integration Tests

### Routing & Navigation
- [ ] Landing page loads correctly
- [ ] Login page is accessible
- [ ] Register page is accessible
- [ ] Unauthenticated users are redirected to login
- [ ] Authenticated users can access dashboard
- [ ] All sidebar navigation links work
- [ ] Browser back button works correctly
- [ ] Deep links work correctly

### Login Page
- [ ] Form validation works (email, password)
- [ ] Login button is disabled while loading
- [ ] Loading spinner shows during login
- [ ] Success redirects to dashboard
- [ ] Errors display clearly to user
- [ ] Rate limit errors show countdown
- [ ] "Remember me" functionality works
- [ ] "Forgot password" link works

### Register Page
- [ ] Form validation works (all fields)
- [ ] Password confirmation validates
- [ ] Password strength indicator works
- [ ] Register button is disabled while loading
- [ ] Loading spinner shows during registration
- [ ] Success redirects to dashboard
- [ ] Errors display clearly to user
- [ ] Terms of service checkbox works
- [ ] Link to login page works

### Dashboard
- [ ] All metrics load correctly
- [ ] Charts render properly
- [ ] Data updates in real-time
- [ ] Quick actions work
- [ ] Recent activity displays correctly
- [ ] Loading states show while fetching data
- [ ] Empty states display when no data

### Leads Page
- [ ] Lead list loads with pagination
- [ ] Status filters work
- [ ] Search functionality works
- [ ] "New Lead" button works
- [ ] Lead cards display all info correctly
- [ ] Clicking lead opens detail view
- [ ] Empty state shows when no leads

### Lead Detail Page
- [ ] All lead data displays correctly
- [ ] Edit mode works
- [ ] Save updates correctly
- [ ] Delete confirmation works
- [ ] Delete removes lead
- [ ] "Refresh Intelligence" button works
- [ ] AI analysis displays correctly
- [ ] "Convert to Project" works
- [ ] Notes section works
- [ ] Task creation works

### Projects Page
- [ ] Project list loads with pagination
- [ ] Status filters work
- [ ] Search functionality works
- [ ] "New Project" button works
- [ ] Project cards display all info
- [ ] Clicking project opens detail view

### Project Detail Page
- [ ] All project data displays correctly
- [ ] Status can be updated
- [ ] Budget tracking displays correctly
- [ ] Task list shows project tasks
- [ ] Subcontractor assignment works
- [ ] Notes and files work
- [ ] Milestones display correctly

### Subcontractors Page
- [ ] Subcontractor list loads
- [ ] Location-based search works
- [ ] Trade filters work
- [ ] Rating filters work
- [ ] Distance display is accurate
- [ ] "Hire" button works
- [ ] Subcontractor profile link works

### Tasks Page
- [ ] Task list loads with pagination
- [ ] Priority filters work
- [ ] Status filters work
- [ ] "New Task" button works
- [ ] Task completion checkbox works
- [ ] Due date indicators work
- [ ] Overdue tasks are highlighted
- [ ] Task detail modal works

### Quotes Page
- [ ] Quote list loads
- [ ] Status filters work
- [ ] "New Quote" button works
- [ ] Quote detail view works
- [ ] Line items display correctly
- [ ] Calculations are accurate
- [ ] "Send" functionality works
- [ ] "Convert to Invoice" works

### Invoices Page
- [ ] Invoice list loads
- [ ] Status filters work
- [ ] "New Invoice" button works
- [ ] Invoice detail view works
- [ ] Payment recording works
- [ ] Status updates correctly
- [ ] Overdue invoices are flagged

### Analytics Page
- [ ] All charts load correctly
- [ ] Data is accurate
- [ ] Date range picker works
- [ ] Export functionality works (if implemented)
- [ ] Responsive design works

### Settings Page
- [ ] User profile displays correctly
- [ ] Profile updates save correctly
- [ ] Password change works
- [ ] Email notifications toggle works
- [ ] Subscription info displays correctly

---

## Error Handling Tests

### Network Errors
- [ ] No internet connection shows proper error
- [ ] Timeout errors are handled gracefully
- [ ] Server errors (5xx) show user-friendly message
- [ ] Failed requests retry automatically
- [ ] Loading states show during retry

### Validation Errors
- [ ] Client-side validation shows immediately
- [ ] Server-side validation errors display clearly
- [ ] Field-level errors highlight the field
- [ ] Form submission is prevented on validation errors

### Authentication Errors
- [ ] 401 errors trigger logout
- [ ] Token refresh happens automatically
- [ ] Multiple failed auth attempts handled correctly
- [ ] Session expiry notification shows

---

## Performance Tests

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Authenticated page load < 2 seconds
- [ ] API responses < 500ms (without AI)
- [ ] Search results < 1 second
- [ ] List pagination < 500ms

### Optimization
- [ ] Images are optimized and lazy-loaded
- [ ] Code splitting is implemented
- [ ] Bundle size is reasonable (< 500KB main bundle)
- [ ] Caching is implemented
- [ ] Database queries are optimized with indexes

---

## Cross-Browser Tests

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

### Responsive Design
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Works on large screens (1920px+)

---

## Accessibility Tests

- [ ] Keyboard navigation works throughout app
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Form labels are properly associated
- [ ] Error messages are announced
- [ ] Focus indicators are visible
- [ ] Alt text on images

---

## Cloud Run Deployment Tests

### Configuration
- [ ] Cloud Run service is created
- [ ] Environment variables are set
- [ ] Secrets are mounted correctly
- [ ] Cloud SQL connection works
- [ ] Memory limits are appropriate (512Mi+)
- [ ] CPU limits are appropriate
- [ ] Timeout is set appropriately (300s)
- [ ] Min/max instances configured

### Runtime
- [ ] Cold starts are acceptable (< 5 seconds)
- [ ] Health checks pass
- [ ] Service scales automatically
- [ ] Logs are visible in Cloud Logging
- [ ] Error tracking works
- [ ] Custom domain works (if configured)
- [ ] SSL certificate is valid

---

## Demo Day Final Checks

### 1 Hour Before Demo
- [ ] All servers are running
- [ ] Database is accessible
- [ ] Demo data is fresh (run seed script)
- [ ] Test login works
- [ ] All pages load correctly
- [ ] Network is stable
- [ ] Backup plan ready (local backup, screenshots, etc.)

### 15 Minutes Before Demo
- [ ] Clear browser cache
- [ ] Close unnecessary tabs
- [ ] Test login one more time
- [ ] Navigate through key pages
- [ ] Check for console errors
- [ ] Ensure good screen resolution for presentation

### During Demo
- [ ] Have presenter guide open in another window
- [ ] Monitor network requests in dev tools
- [ ] Have backup data/screenshots ready
- [ ] Note any issues for post-demo review

---

## Post-Demo Review

### Issues Encountered
- [ ] Document any bugs found during demo
- [ ] Note performance issues
- [ ] Record audience feedback
- [ ] Identify missing features requested

### Success Metrics
- [ ] Demo completed without major issues
- [ ] All key features demonstrated
- [ ] Positive audience feedback
- [ ] Clear value proposition communicated
- [ ] Follow-up actions identified

---

## Sign-Off

**QA Engineer**: _________________ Date: _________

**Product Manager**: _________________ Date: _________

**Technical Lead**: _________________ Date: _________

**Demo Ready**: ☐ Yes  ☐ No (see issues above)

---

**Notes:**
_Use this space for additional comments or observations_

