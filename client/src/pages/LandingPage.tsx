import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hammer,
  Search,
  FileText,
  Users,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Zap,
  Menu,
  X,
  Brain,
  Target,
  Sparkles,
  ArrowRight,
  Play,
  TrendingUp,
  Wallet,
  Calendar
} from 'lucide-react';

interface LandingPageProps {
  onLogin?: () => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = (plan?: string) => {
    navigate('/register', { state: { plan } });
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 font-bold text-2xl text-slate-900">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Hammer size={22} />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              ApexBuilder
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <button onClick={handleLogin} className="hover:text-indigo-600 transition-colors">Log In</button>
            <button 
              onClick={() => handleGetStarted()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
            >
              Get Started Free
            </button>
          </div>
          
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-4">
            <a href="#features" className="block text-slate-600 font-medium">Features</a>
            <a href="#how-it-works" className="block text-slate-600 font-medium">How It Works</a>
            <a href="#pricing" className="block text-slate-600 font-medium">Pricing</a>
            <button onClick={handleLogin} className="block text-slate-600 font-medium">Log In</button>
            <button 
              onClick={() => handleGetStarted()}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Get Started Free
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-50 to-violet-50 rounded-full blur-[80px] opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold mb-8 border border-indigo-100">
                <Sparkles size={16} className="text-indigo-500" />
                Now with Advanced AI Lead Intelligence
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6">
                Grow Your{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Contracting Business
                </span>
                {' '}with AI
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                The all-in-one CRM that helps contractors find high-value leads, 
                generate accurate quotes, and close more deals with AI-powered insights.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => handleGetStarted('pro')}
                  className="group bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 flex items-center justify-center gap-3"
                >
                  Start 30-Day Free Trial
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button 
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl text-lg font-bold hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={20} className="text-indigo-600" />
                  Watch Demo
                </button>
              </div>

              <div className="mt-12 flex items-center gap-4 justify-center lg:justify-start flex-wrap">
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-medium">Free 30-day trial</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">
                  <Zap size={18} className="text-indigo-600" />
                  <span className="text-sm text-indigo-700 font-medium">No credit card required</span>
                </div>
              </div>
            </div>

            {/* Hero Image / Dashboard Preview */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 transform lg:rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 md:p-6">
                  {/* Mock Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="text-slate-400 text-xs font-mono">Contractor CRM Dashboard</div>
                  </div>
                  
                  {/* Mock Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Active Leads', value: '47', icon: Target, color: 'from-indigo-500 to-violet-500' },
                      { label: 'This Month', value: '$127K', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
                      { label: 'Win Rate', value: '68%', icon: BarChart3, color: 'from-amber-500 to-orange-500' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-xl p-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                          <stat.icon size={16} className="text-white" />
                        </div>
                        <div className="text-white font-bold text-lg">{stat.value}</div>
                        <div className="text-slate-400 text-xs">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mock Lead Card */}
                  <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold">🔥 Hot Lead Detected</div>
                        <div className="text-slate-400 text-sm">123 Oak Street, Austin TX</div>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Score: 94
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">Roof Repair</div>
                      <div className="bg-violet-500/20 text-violet-300 text-xs px-2 py-1 rounded-full">High Equity</div>
                      <div className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded-full">Recent Permit</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 z-20">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2 rounded-xl text-white">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Quote Accepted!</div>
                  <div className="font-bold text-slate-900">$24,500</div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 z-20">
                <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-2 rounded-xl text-white">
                  <Brain size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">AI Analysis</div>
                  <div className="font-bold text-slate-900">Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Logos Section */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-slate-500 font-medium mb-8">Integrates with your favorite tools</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale">
            {['Google Maps', 'Stripe', 'QuickBooks', 'Zapier', 'Slack'].map((brand, i) => (
              <div key={i} className="text-slate-400 font-bold text-lg">{brand}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Zap size={16} /> Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                win more jobs
              </span>
            </h2>
            <p className="text-xl text-slate-600">
              From lead intelligence to project completion, Contractor CRM has you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI Lead Intelligence",
                desc: "Get instant property analysis with equity estimates, permit history, owner demographics, and a custom lead score.",
                color: "from-indigo-500 to-violet-500"
              },
              {
                icon: FileText,
                title: "Smart Quoting",
                desc: "Generate professional quotes in seconds using AI. Just describe the job or upload a photo.",
                color: "from-violet-500 to-purple-500"
              },
              {
                icon: Users,
                title: "Subcontractor Network",
                desc: "Find and manage trusted subs. View ratings, availability, and past performance at a glance.",
                color: "from-purple-500 to-fuchsia-500"
              },
              {
                icon: Calendar,
                title: "Project Management",
                desc: "Track every project from quote to completion with tasks, timelines, and milestone tracking.",
                color: "from-fuchsia-500 to-pink-500"
              },
              {
                icon: Wallet,
                title: "Invoicing & Payments",
                desc: "Create and send professional invoices. Accept payments online and track your cash flow.",
                color: "from-pink-500 to-rose-500"
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                desc: "See your business at a glance with real-time metrics, conversion rates, and revenue tracking.",
                color: "from-rose-500 to-red-500"
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-100 cursor-pointer"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-slate-600">
              Get up and running in minutes, not days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Add a Property",
                desc: "Enter any address and let our AI analyze the property, owner, and opportunity potential.",
                icon: Search
              },
              {
                step: "02",
                title: "Get AI Insights",
                desc: "Receive a complete lead dossier with equity analysis, permit history, and personalized outreach tips.",
                icon: Brain
              },
              {
                step: "03",
                title: "Close the Deal",
                desc: "Generate quotes, manage the project, and collect payment—all in one platform.",
                icon: Target
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-indigo-200 transition-all hover:shadow-lg">
                  <div className="text-6xl font-black bg-gradient-to-r from-indigo-100 to-violet-100 bg-clip-text text-transparent mb-4">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white mb-4">
                    <item.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 z-10">
                    <ChevronRight className="text-indigo-300" size={32} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "30+", label: "Data Points Per Lead" },
              { value: "<5s", label: "AI Analysis Time" },
              { value: "50+", label: "Property Sources" },
              { value: "24/7", label: "Automated Insights" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-indigo-200 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600">
              Start with a 30-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-indigo-200 transition-all hover:shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-500 text-sm mb-6">For new contractors</p>
              <div className="mb-6">
                <span className="text-5xl font-black text-slate-900">$0</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['5 Projects', '20 Leads/month', 'Basic AI Analysis', 'Standard Support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleGetStarted('starter')}
                className="w-full py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Pro - Recommended */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-8 rounded-3xl shadow-2xl transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <p className="text-slate-400 text-sm mb-6">For growing businesses</p>
              <div className="mb-6">
                <span className="text-5xl font-black text-white">$99</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited Projects', 'Unlimited Leads', 'Advanced AI Insights', 'Sub Network Access', 'Priority Support', 'Analytics Dashboard'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 size={18} className="text-indigo-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleGetStarted('pro')}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-indigo-200 transition-all hover:shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-500 text-sm mb-6">For large teams</p>
              <div className="mb-6">
                <span className="text-5xl font-black text-slate-900">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Pro', 'Unlimited Team Members', 'API Access', 'Custom Integrations', 'Dedicated Support', 'White Label Options'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleGetStarted('enterprise')}
                className="w-full py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            All paid plans include a 30-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-3xl p-12 md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to grow your business?
              </h2>
              <p className="text-indigo-200 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of contractors who are closing more deals with Contractor CRM.
              </p>
              <button 
                onClick={() => handleGetStarted('pro')}
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-indigo-50 transition-colors shadow-xl inline-flex items-center gap-2"
              >
                Start Your Free Trial
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-1.5 rounded-lg">
                  <Hammer size={18} />
                </div>
                Contractor CRM
              </div>
              <p className="text-slate-400 text-sm">
                The AI-powered CRM for modern contractors.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Contractor CRM. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
