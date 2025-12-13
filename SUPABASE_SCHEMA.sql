--- BEGIN SUPABASE SQL ---

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE "UserRole" AS ENUM ('CONTRACTOR', 'SUBCONTRACTOR', 'CLIENT', 'ADMIN');
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "OrgMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ReminderType" AS ENUM ('EMAIL', 'SMS', 'BOTH');
CREATE TYPE "NotificationType" AS ENUM ('TASK_REMINDER', 'LEAD_UPDATE', 'PROJECT_UPDATE', 'PAYMENT_RECEIVED', 'QUOTE_ACCEPTED', 'SYSTEM');
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "QuoteSourceType" AS ENUM ('MANUAL', 'IMAGE_AI', 'VOICE_AI', 'TEMPLATE');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHECK', 'CREDIT_CARD', 'BANK_TRANSFER', 'VENMO', 'ZELLE', 'OTHER');
CREATE TYPE "DeliveryType" AS ENUM ('PICKUP', 'DELIVERY', 'WILL_CALL');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PROCESSING', 'PAID', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
CREATE TYPE "ServiceAreaType" AS ENUM ('RADIUS', 'STATES', 'ZIPCODES', 'COUNTIES', 'NATIONWIDE', 'CUSTOM');
CREATE TYPE "MaterialOrderStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED');
CREATE TYPE "PremiumTier" AS ENUM ('BASIC', 'PLUS', 'ELITE');
CREATE TYPE "RateType" AS ENUM ('HOURLY', 'DAILY', 'PROJECT');
CREATE TYPE "JobUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "JobPostingStatus" AS ENUM ('DRAFT', 'OPEN', 'FILLED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "HireStatus" AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
CREATE TYPE "FinancingStatus" AS ENUM ('OFFERED', 'APPLIED', 'APPROVED', 'FUNDED', 'DECLINED', 'EXPIRED');
CREATE TYPE "PaymentType" AS ENUM ('SUBSCRIPTION', 'COMMISSION_EARNED', 'COMMISSION_PAID', 'MARKETPLACE_FEE', 'FINANCING_FEE');

-- ===========================================
-- TABLES
-- ===========================================

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CONTRACTOR',
    "avatar" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscription_ends_at" TIMESTAMP(3),
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'ENTERPRISE',
    "subscription_ends_at" TIMESTAMP(3),
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "logo" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "OrgMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "full_address" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "lead_score" INTEGER,
    "renovation_potential" INTEGER,
    "owner_motivation" INTEGER,
    "profit_potential" INTEGER,
    "property_intel" JSONB,
    "owner_intel" JSONB,
    "financial_intel" JSONB,
    "permit_history" JSONB,
    "renovation_opps" JSONB,
    "sales_approach" JSONB,
    "ai_summary" TEXT,
    "analyzed_at" TIMESTAMP(3),
    "notes" TEXT,
    "next_follow_up" TIMESTAMP(3),
    "last_contact_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "estimated_days" INTEGER,
    "estimated_budget" DOUBLE PRECISION,
    "actual_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "portal_enabled" BOOLEAN NOT NULL DEFAULT false,
    "portal_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "order_num" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_photos" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "taken_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_photos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "reminder_at" TIMESTAMP(3),
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "reminder_type" "ReminderType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sentVia" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "line_items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "source_type" "QuoteSourceType" NOT NULL DEFAULT 'MANUAL',
    "source_data" JSONB,
    "valid_until" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "quote_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_email" TEXT,
    "client_phone" TEXT,
    "client_address" TEXT,
    "line_items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "pdf_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "material_suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "street" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "categories" TEXT[],
    "brands" TEXT[],
    "service_area_type" "ServiceAreaType" NOT NULL DEFAULT 'RADIUS',
    "delivery_radius" INTEGER,
    "service_states" TEXT[],
    "service_zip_codes" TEXT[],
    "service_counties" TEXT[],
    "excluded_zip_codes" TEXT[],
    "offers_delivery" BOOLEAN NOT NULL DEFAULT true,
    "offers_pickup" BOOLEAN NOT NULL DEFAULT true,
    "offers_will_call" BOOLEAN NOT NULL DEFAULT true,
    "free_delivery_min" DOUBLE PRECISION,
    "delivery_fee" DOUBLE PRECISION,
    "delivery_per_mile" DOUBLE PRECISION,
    "min_delivery_fee" DOUBLE PRECISION,
    "max_delivery_distance" DOUBLE PRECISION,
    "same_day_available" BOOLEAN NOT NULL DEFAULT false,
    "same_day_cutoff" TEXT,
    "same_day_fee" DOUBLE PRECISION,
    "express_available" BOOLEAN NOT NULL DEFAULT false,
    "express_fee" DOUBLE PRECISION,
    "business_hours" JSONB,
    "holiday_schedule" JSONB,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "contractor_discount" DOUBLE PRECISION,
    "requires_account" BOOLEAN NOT NULL DEFAULT false,
    "accepts_credit" BOOLEAN NOT NULL DEFAULT true,
    "accepts_check" BOOLEAN NOT NULL DEFAULT true,
    "net30_available" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "material_suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_service_areas" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zipCodes" TEXT[],
    "counties" TEXT[],
    "delivery_fee" DOUBLE PRECISION,
    "delivery_per_mile" DOUBLE PRECISION,
    "free_delivery_min" DOUBLE PRECISION,
    "min_order" DOUBLE PRECISION,
    "lead_time_days" INTEGER NOT NULL DEFAULT 1,
    "same_day_available" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "supplier_service_areas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "material_orders" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "supplier_name" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "delivery_street" TEXT,
    "delivery_city" TEXT,
    "delivery_state" TEXT,
    "delivery_zip_code" TEXT,
    "delivery_latitude" DOUBLE PRECISION,
    "delivery_longitude" DOUBLE PRECISION,
    "distance_to_supplier" DOUBLE PRECISION,
    "delivery_type" "DeliveryType" NOT NULL DEFAULT 'DELIVERY',
    "delivery_date" TIMESTAMP(3),
    "delivery_window" TEXT,
    "delivery_notes" TEXT,
    "status" "MaterialOrderStatus" NOT NULL DEFAULT 'PENDING',
    "ordered_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "tracking_number" TEXT,
    "payment_method" "PaymentMethod",
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paid_at" TIMESTAMP(3),
    "invoice_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "material_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subcontractors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "trades" TEXT[],
    "specialization" TEXT,
    "bio" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location_updated_at" TIMESTAMP(3),
    "service_radius" INTEGER NOT NULL DEFAULT 25,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "completed_jobs" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "hourly_rate" DOUBLE PRECISION,
    "daily_rate" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "license_number" TEXT,
    "insurance" BOOLEAN NOT NULL DEFAULT false,
    "insurance_expiry" TIMESTAMP(3),
    "portfolio" TEXT[],
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "premium_tier" "PremiumTier",
    "premium_expires_at" TIMESTAMP(3),
    "featured_until" TIMESTAMP(3),
    "available_from" TIMESTAMP(3),
    "preferred_job_types" TEXT[],
    "avg_response_time" INTEGER,
    "response_rate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subcontractors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trades_needed" TEXT[],
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "budget_min" DOUBLE PRECISION,
    "budget_max" DOUBLE PRECISION,
    "rate_type" "RateType" NOT NULL DEFAULT 'PROJECT',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "urgency" "JobUrgency" NOT NULL DEFAULT 'NORMAL',
    "status" "JobPostingStatus" NOT NULL DEFAULT 'OPEN',
    "referral_commission" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "referrer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "subcontractor_id" TEXT NOT NULL,
    "cover_letter" TEXT,
    "proposed_rate" DOUBLE PRECISION,
    "estimated_days" INTEGER,
    "availability" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subcontractor_hires" (
    "id" TEXT NOT NULL,
    "subcontractor_id" TEXT NOT NULL,
    "contractor_id" TEXT NOT NULL,
    "project_id" TEXT,
    "description" TEXT NOT NULL,
    "agreed_rate" DOUBLE PRECISION NOT NULL,
    "rateType" TEXT NOT NULL,
    "status" "HireStatus" NOT NULL DEFAULT 'PENDING',
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "commission_paid" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subcontractor_hires_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "referral_commissions" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referee_id" TEXT NOT NULL,
    "hire_id" TEXT,
    "job_posting_id" TEXT,
    "job_value" DOUBLE PRECISION NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL,
    "commission_amount" DOUBLE PRECISION NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "referral_commissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subcontractor_reviews" (
    "id" TEXT NOT NULL,
    "subcontractor_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subcontractor_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "financing_offers" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT,
    "project_id" TEXT,
    "lender_name" TEXT NOT NULL,
    "lender_logo" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "interest_rate" DOUBLE PRECISION NOT NULL,
    "term_months" INTEGER NOT NULL,
    "monthly_payment" DOUBLE PRECISION NOT NULL,
    "status" "FinancingStatus" NOT NULL DEFAULT 'OFFERED',
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "commission_amount" DOUBLE PRECISION,
    "commission_paid" BOOLEAN NOT NULL DEFAULT false,
    "offered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "funded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "financing_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_users" INTEGER NOT NULL DEFAULT 0,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "new_users" INTEGER NOT NULL DEFAULT 0,
    "total_leads" INTEGER NOT NULL DEFAULT 0,
    "total_projects" INTEGER NOT NULL DEFAULT 0,
    "total_quotes" INTEGER NOT NULL DEFAULT 0,
    "total_invoiced" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subscription_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketplace_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financing_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analysis_cache" (
    "id" TEXT NOT NULL,
    "cache_key" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_hit_at" TIMESTAMP(3),
    CONSTRAINT "analysis_cache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "task_id" TEXT,
    "quote_id" TEXT,
    "invoice_id" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usage_tracking" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "ai_api_calls" INTEGER NOT NULL DEFAULT 0,
    "ai_tokens_used" INTEGER NOT NULL DEFAULT 0,
    "ai_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leads_analyzed" INTEGER NOT NULL DEFAULT 0,
    "quotes_generated" INTEGER NOT NULL DEFAULT 0,
    "invoices_sent" INTEGER NOT NULL DEFAULT 0,
    "storage_used_mb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storage_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feature_limits" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "max_projects" INTEGER NOT NULL DEFAULT -1,
    "max_project_value" DOUBLE PRECISION NOT NULL DEFAULT -1,
    "max_leads_per_month" INTEGER NOT NULL DEFAULT -1,
    "max_ai_analyses_per_month" INTEGER NOT NULL DEFAULT -1,
    "max_quotes_per_month" INTEGER NOT NULL DEFAULT -1,
    "max_invoices_per_month" INTEGER NOT NULL DEFAULT -1,
    "max_storage_mb" DOUBLE PRECISION NOT NULL DEFAULT -1,
    "has_ai_analysis" BOOLEAN NOT NULL DEFAULT false,
    "has_client_portal" BOOLEAN NOT NULL DEFAULT false,
    "has_marketplace" BOOLEAN NOT NULL DEFAULT false,
    "has_financing" BOOLEAN NOT NULL DEFAULT false,
    "has_advanced_reports" BOOLEAN NOT NULL DEFAULT false,
    "has_api_access" BOOLEAN NOT NULL DEFAULT false,
    "has_priority_support" BOOLEAN NOT NULL DEFAULT false,
    "platform_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feature_limits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "upsell_triggers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "feature_name" TEXT NOT NULL,
    "current_tier" "SubscriptionTier" NOT NULL,
    "recommended_tier" "SubscriptionTier" NOT NULL,
    "shown" BOOLEAN NOT NULL DEFAULT false,
    "shown_at" TIMESTAMP(3),
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "upsell_triggers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "source_type" TEXT,
    "source_id" TEXT,
    "stripe_payment_id" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- ===========================================
-- UNIQUE CONSTRAINTS
-- ===========================================

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");
CREATE UNIQUE INDEX "projects_lead_id_key" ON "projects"("lead_id");
CREATE UNIQUE INDEX "projects_portal_token_key" ON "projects"("portal_token");
CREATE UNIQUE INDEX "invoices_quote_id_key" ON "invoices"("quote_id");
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE UNIQUE INDEX "subcontractors_user_id_key" ON "subcontractors"("user_id");
CREATE UNIQUE INDEX "subcontractors_email_key" ON "subcontractors"("email");
CREATE UNIQUE INDEX "job_applications_job_posting_id_subcontractor_id_key" ON "job_applications"("job_posting_id", "subcontractor_id");
CREATE UNIQUE INDEX "subcontractor_reviews_subcontractor_id_reviewer_id_key" ON "subcontractor_reviews"("subcontractor_id", "reviewer_id");
CREATE UNIQUE INDEX "platform_stats_date_key" ON "platform_stats"("date");
CREATE UNIQUE INDEX "analysis_cache_cache_key_key" ON "analysis_cache"("cache_key");
CREATE UNIQUE INDEX "usage_tracking_user_id_date_key" ON "usage_tracking"("user_id", "date");
CREATE UNIQUE INDEX "feature_limits_tier_key" ON "feature_limits"("tier");
CREATE UNIQUE INDEX "payment_transactions_stripe_payment_id_key" ON "payment_transactions"("stripe_payment_id");

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX "leads_user_id_idx" ON "leads"("user_id");
CREATE INDEX "leads_status_idx" ON "leads"("status");
CREATE INDEX "leads_lead_score_idx" ON "leads"("lead_score");
CREATE INDEX "leads_full_address_idx" ON "leads"("full_address");
CREATE INDEX "leads_analyzed_at_idx" ON "leads"("analyzed_at");
CREATE INDEX "leads_user_id_status_idx" ON "leads"("user_id", "status");
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");
CREATE INDEX "projects_status_idx" ON "projects"("status");
CREATE INDEX "projects_portal_token_idx" ON "projects"("portal_token");
CREATE INDEX "projects_user_id_status_idx" ON "projects"("user_id", "status");
CREATE INDEX "projects_start_date_idx" ON "projects"("start_date");

CREATE INDEX "milestones_project_id_idx" ON "milestones"("project_id");
CREATE INDEX "project_photos_project_id_idx" ON "project_photos"("project_id");
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");
CREATE INDEX "tasks_reminder_at_idx" ON "tasks"("reminder_at");
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_read_idx" ON "notifications"("read");
CREATE INDEX "quotes_user_id_idx" ON "quotes"("user_id");
CREATE INDEX "quotes_status_idx" ON "quotes"("status");
CREATE INDEX "invoices_user_id_idx" ON "invoices"("user_id");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

CREATE INDEX "material_suppliers_city_state_idx" ON "material_suppliers"("city", "state");
CREATE INDEX "material_suppliers_latitude_longitude_idx" ON "material_suppliers"("latitude", "longitude");
CREATE INDEX "material_suppliers_categories_idx" ON "material_suppliers"("categories");
CREATE INDEX "material_suppliers_service_states_idx" ON "material_suppliers"("service_states");
CREATE INDEX "material_suppliers_active_offers_delivery_idx" ON "material_suppliers"("active", "offers_delivery");
CREATE INDEX "supplier_service_areas_supplier_id_idx" ON "supplier_service_areas"("supplier_id");
CREATE INDEX "supplier_service_areas_zipCodes_idx" ON "supplier_service_areas"("zipCodes");
CREATE INDEX "material_orders_project_id_idx" ON "material_orders"("project_id");
CREATE INDEX "material_orders_supplier_id_idx" ON "material_orders"("supplier_id");
CREATE INDEX "material_orders_status_idx" ON "material_orders"("status");

CREATE INDEX "subcontractors_city_state_idx" ON "subcontractors"("city", "state");
CREATE INDEX "subcontractors_trades_idx" ON "subcontractors"("trades");
CREATE INDEX "subcontractors_available_idx" ON "subcontractors"("available");
CREATE INDEX "subcontractors_latitude_longitude_idx" ON "subcontractors"("latitude", "longitude");
CREATE INDEX "subcontractors_is_premium_rating_idx" ON "subcontractors"("is_premium", "rating");

CREATE INDEX "job_postings_city_state_idx" ON "job_postings"("city", "state");
CREATE INDEX "job_postings_latitude_longitude_idx" ON "job_postings"("latitude", "longitude");
CREATE INDEX "job_postings_status_idx" ON "job_postings"("status");
CREATE INDEX "job_postings_trades_needed_idx" ON "job_postings"("trades_needed");
CREATE INDEX "subcontractor_hires_subcontractor_id_idx" ON "subcontractor_hires"("subcontractor_id");
CREATE INDEX "subcontractor_hires_contractor_id_idx" ON "subcontractor_hires"("contractor_id");
CREATE INDEX "referral_commissions_referrer_id_idx" ON "referral_commissions"("referrer_id");
CREATE INDEX "referral_commissions_status_idx" ON "referral_commissions"("status");
CREATE INDEX "financing_offers_lead_id_idx" ON "financing_offers"("lead_id");
CREATE INDEX "financing_offers_project_id_idx" ON "financing_offers"("project_id");
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");
CREATE INDEX "analysis_cache_cache_key_idx" ON "analysis_cache"("cache_key");
CREATE INDEX "analysis_cache_expires_at_idx" ON "analysis_cache"("expires_at");
CREATE INDEX "notes_project_id_idx" ON "notes"("project_id");
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");
CREATE INDEX "notes_lead_id_idx" ON "notes"("lead_id");
CREATE INDEX "usage_tracking_date_idx" ON "usage_tracking"("date");
CREATE INDEX "upsell_triggers_user_id_idx" ON "upsell_triggers"("user_id");
CREATE INDEX "upsell_triggers_trigger_type_idx" ON "upsell_triggers"("trigger_type");
CREATE INDEX "payment_transactions_user_id_idx" ON "payment_transactions"("user_id");
CREATE INDEX "payment_transactions_type_idx" ON "payment_transactions"("type");
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- ===========================================
-- FOREIGN KEYS
-- ===========================================

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_photos" ADD CONSTRAINT "project_photos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "supplier_service_areas" ADD CONSTRAINT "supplier_service_areas_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "material_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "material_orders" ADD CONSTRAINT "material_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "material_orders" ADD CONSTRAINT "material_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "material_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "subcontractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subcontractor_hires" ADD CONSTRAINT "subcontractor_hires_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "subcontractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subcontractor_hires" ADD CONSTRAINT "subcontractor_hires_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subcontractor_hires" ADD CONSTRAINT "subcontractor_hires_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "subcontractor_reviews" ADD CONSTRAINT "subcontractor_reviews_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "subcontractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "upsell_triggers" ADD CONSTRAINT "upsell_triggers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

--- END SUPABASE SQL ---

