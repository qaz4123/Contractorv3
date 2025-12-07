/**
 * Subcontractors Page
 * Browse subcontractors, post jobs, and manage hires
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, 
  MapPin, 
  Star, 
  Shield, 
  Briefcase, 
  DollarSign,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import api from '../services/api';

interface Subcontractor {
  id: string;
  name: string;
  company?: string;
  trades: string[];
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  hourlyRate?: number;
  verified: boolean;
  insurance: boolean;
  available: boolean;
  distance?: number;
  bio?: string;
  portfolio?: string[];
  avgResponseTime?: number;
}

interface JobPosting {
  id: string;
  title: string;
  description: string;
  tradesNeeded: string[];
  city: string;
  state: string;
  budgetMin?: number;
  budgetMax?: number;
  startDate?: string;
  status: string;
  applications?: any[];
}

export function Subcontractors() {
  const [view, setView] = useState<'search' | 'jobs' | 'hires'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subcontractor | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    tradesNeeded: [] as string[],
    city: '',
    state: '',
    budgetMin: '',
    budgetMax: '',
    startDate: '',
  });

  const queryClient = useQueryClient();

  // Fetch subcontractors
  const { data: subs = [], isLoading: subsLoading } = useQuery({
    queryKey: ['subcontractors', selectedTrades],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTrades.length) params.append('trades', selectedTrades.join(','));
      const response = await api.get(`/subcontractors?${params}`);
      // Ensure we always return an array
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    },
  });

  // Fetch job postings
  const { data: jobs = [] } = useQuery({
    queryKey: ['job-postings'],
    queryFn: async () => {
      const response = await api.get('/subcontractors/job-postings');
      // Ensure we always return an array
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    },
    enabled: view === 'jobs',
  });

  // Fetch hires
  const { data: hires = [] } = useQuery({
    queryKey: ['subcontractor-hires'],
    queryFn: async () => {
      const response = await api.get('/subcontractors/hires');
      return response.data;
    },
    enabled: view === 'hires',
  });

  // Post job mutation
  const postJobMutation = useMutation({
    mutationFn: (data: any) => api.post('/subcontractors/job-postings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      setShowJobModal(false);
      setJobForm({
        title: '',
        description: '',
        tradesNeeded: [],
        city: '',
        state: '',
        budgetMin: '',
        budgetMax: '',
        startDate: '',
      });
    },
  });

  // Hire subcontractor mutation
  // const hireMutation = useMutation({
  //   mutationFn: (data: any) => api.post('/api/subcontractors/hire', data),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['subcontractor-hires'] });
  //     setSelectedSub(null);
  //   },
  // });

  const allTrades = [
    'Plumbing',
    'Electrical',
    'HVAC',
    'Carpentry',
    'Roofing',
    'Painting',
    'Drywall',
    'Flooring',
    'Tile',
    'Landscaping',
    'Concrete',
    'Masonry'
  ];

  const filteredSubs = subs.filter((sub: Subcontractor) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subcontractor Network</h1>
          <p className="text-slate-600">Find skilled tradespeople or post jobs</p>
        </div>
        <Button onClick={() => setShowJobModal(true)}>
          <Plus size={20} />
          Post a Job
        </Button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'search', label: 'Find Subs', icon: Search },
          { id: 'jobs', label: 'My Job Postings', icon: Briefcase },
          { id: 'hires', label: 'Active Hires', icon: CheckCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              view === tab.id
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search View */}
      {view === 'search' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={20} />
              Filters
            </Button>
          </div>

          {/* Trade Filters */}
          {showFilters && (
            <Card className="p-4">
              <div className="flex flex-wrap gap-2">
                {allTrades.map((trade) => (
                  <button
                    key={trade}
                    onClick={() =>
                      setSelectedTrades((prev) =>
                        prev.includes(trade)
                          ? prev.filter((t) => t !== trade)
                          : [...prev, trade]
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedTrades.includes(trade)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {trade}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Subcontractors Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subsLoading ? (
              <div className="col-span-3 text-center py-12 text-slate-500">
                Loading subcontractors...
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-slate-500">
                No subcontractors found
              </div>
            ) : (
              filteredSubs.map((sub: Subcontractor) => (
                <div key={sub.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedSub(sub)}>
                  <Card>
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">{sub.name}</h3>
                        {sub.company && (
                          <p className="text-sm text-slate-600">{sub.company}</p>
                        )}
                      </div>
                      {sub.verified && (
                        <Badge variant="success">
                          <Shield size={12} />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={16} />
                      {sub.city}, {sub.state}
                      {sub.distance && <span className="text-slate-400">• {sub.distance.toFixed(1)} mi</span>}
                    </div>

                    {/* Trades */}
                    <div className="flex flex-wrap gap-1">
                      {sub.trades.slice(0, 3).map((trade) => (
                        <span
                          key={trade}
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium"
                        >
                          {trade}
                        </span>
                      ))}
                      {sub.trades.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          +{sub.trades.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                          <Star size={14} fill="currentColor" />
                          <span className="font-semibold text-sm">{sub.rating.toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-slate-500">{sub.reviewCount} reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-sm text-slate-900 mb-1">
                          {sub.completedJobs}
                        </div>
                        <div className="text-xs text-slate-500">Jobs done</div>
                      </div>
                      <div className="text-center">
                        {sub.hourlyRate ? (
                          <>
                            <div className="font-semibold text-sm text-slate-900 mb-1">
                              ${sub.hourlyRate}
                            </div>
                            <div className="text-xs text-slate-500">per hour</div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-500">Rate varies</div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        {sub.insurance && (
                          <Badge variant="info" size="sm">
                            <Shield size={12} />
                            Insured
                          </Badge>
                        )}
                        {sub.available && (
                          <Badge variant="success" size="sm">
                            <CheckCircle size={12} />
                            Available
                          </Badge>
                        )}
                      </div>
                      {sub.avgResponseTime && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={12} />
                          {sub.avgResponseTime}m
                        </div>
                      )}
                    </div>
                  </div>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Jobs View */}
      {view === 'jobs' && (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="mx-auto mb-4 text-slate-400" size={48} />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No job postings yet</h3>
              <p className="text-slate-600 mb-4">Post a job to find qualified subcontractors</p>
              <Button onClick={() => setShowJobModal(true)}>
                <Plus size={20} />
                Post Your First Job
              </Button>
            </Card>
          ) : (
            jobs.map((job: JobPosting) => (
              <Card key={job.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{job.description}</p>
                  </div>
                  <Badge variant={job.status === 'OPEN' ? 'success' : 'secondary'}>
                    {job.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.tradesNeeded.map((trade) => (
                    <span
                      key={trade}
                      className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                    >
                      {trade}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {job.city}, {job.state}
                    </span>
                    {job.budgetMin && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={16} />
                        ${job.budgetMin.toLocaleString()} - ${job.budgetMax?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {job.applications && (
                    <span className="font-medium text-indigo-600">
                      {job.applications.length} applications
                    </span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Hires View */}
      {view === 'hires' && (
        <div className="space-y-4">
          {hires.length === 0 ? (
            <Card className="p-12 text-center">
              <Award className="mx-auto mb-4 text-slate-400" size={48} />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No active hires</h3>
              <p className="text-slate-600">Hire subcontractors from search to get started</p>
            </Card>
          ) : (
            hires.map((hire: any) => (
              <Card key={hire.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-slate-900">{hire.subcontractor.name}</h3>
                    <p className="text-slate-600 mt-1">{hire.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                      <span>${hire.agreedRate} / {hire.rateType}</span>
                      <Badge variant={
                        hire.status === 'COMPLETED' ? 'success' :
                        hire.status === 'IN_PROGRESS' ? 'info' :
                        'secondary'
                      }>
                        {hire.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Subcontractor Detail Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={selectedSub.name}
        >
          <div className="space-y-6">
            {selectedSub.company && (
              <div>
                <p className="text-lg text-slate-600">{selectedSub.company}</p>
              </div>
            )}

            {selectedSub.bio && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">About</h4>
                <p className="text-slate-600">{selectedSub.bio}</p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Trades & Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedSub.trades.map((trade) => (
                  <span
                    key={trade}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-full font-medium"
                  >
                    {trade}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-600 mb-1">Location</div>
                <div className="font-medium text-slate-900">
                  {selectedSub.city}, {selectedSub.state}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Rating</div>
                <div className="flex items-center gap-2">
                  <Star className="text-amber-500" size={16} fill="currentColor" />
                  <span className="font-medium">{selectedSub.rating.toFixed(1)}</span>
                  <span className="text-sm text-slate-500">({selectedSub.reviewCount})</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Completed Jobs</div>
                <div className="font-medium text-slate-900">{selectedSub.completedJobs}</div>
              </div>
              {selectedSub.hourlyRate && (
                <div>
                  <div className="text-sm text-slate-600 mb-1">Hourly Rate</div>
                  <div className="font-medium text-slate-900">${selectedSub.hourlyRate}/hr</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={() => {
                // Open hire form with this subcontractor
                alert('Hire form coming soon!');
              }}>
                Hire for Project
              </Button>
              <Button variant="outline" onClick={() => {
                alert('Message feature coming soon!');
              }}>
                Send Message
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Post Job Modal */}
      <Modal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        title="Post a Job"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          postJobMutation.mutate({
            ...jobForm,
            budgetMin: jobForm.budgetMin ? parseFloat(jobForm.budgetMin) : undefined,
            budgetMax: jobForm.budgetMax ? parseFloat(jobForm.budgetMax) : undefined,
          });
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              required
              value={jobForm.title}
              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g., Need plumber for bathroom renovation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={jobForm.description}
              onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Describe the work needed..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trades Needed
            </label>
            <div className="flex flex-wrap gap-2">
              {allTrades.map((trade) => (
                <button
                  key={trade}
                  type="button"
                  onClick={() =>
                    setJobForm({
                      ...jobForm,
                      tradesNeeded: jobForm.tradesNeeded.includes(trade)
                        ? jobForm.tradesNeeded.filter((t) => t !== trade)
                        : [...jobForm.tradesNeeded, trade],
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    jobForm.tradesNeeded.includes(trade)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {trade}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={jobForm.city}
                onChange={(e) => setJobForm({ ...jobForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={jobForm.state}
                onChange={(e) => setJobForm({ ...jobForm, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="TX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Budget Min ($)
              </label>
              <input
                type="number"
                value={jobForm.budgetMin}
                onChange={(e) => setJobForm({ ...jobForm, budgetMin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Budget Max ($)
              </label>
              <input
                type="number"
                value={jobForm.budgetMax}
                onChange={(e) => setJobForm({ ...jobForm, budgetMax: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowJobModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={postJobMutation.isPending}
            >
              {postJobMutation.isPending ? 'Posting...' : 'Post Job'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
