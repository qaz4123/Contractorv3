/**
 * My Subcontractor Profile
 * Register as a subcontractor and manage profile
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Star,
  Shield,
  CheckCircle,
  Save,
  AlertCircle,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import api from '../services/api';

export function SubcontractorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    company: '',
    trades: [] as string[],
    specialization: '',
    bio: '',
    city: '',
    state: '',
    zipCode: '',
    serviceRadius: '25',
    hourlyRate: '',
    dailyRate: '',
    preferredJobTypes: [] as string[],
  });

  const queryClient = useQueryClient();

  // Fetch current profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-sub-profile'],
    queryFn: async () => {
      try {
        const response = await api.get('/subcontractors/me');
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null; // No profile yet
        }
        throw error;
      }
    },
  });

  // Update form when profile loads
  useState(() => {
    if (profile && !isEditing) {
      setProfileForm({
        name: profile.name || '',
        company: profile.company || '',
        trades: profile.trades || [],
        specialization: profile.specialization || '',
        bio: profile.bio || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        serviceRadius: profile.serviceRadius?.toString() || '25',
        hourlyRate: profile.hourlyRate?.toString() || '',
        dailyRate: profile.dailyRate?.toString() || '',
        preferredJobTypes: profile.preferredJobTypes || [],
      });
    }
  });

  // Create/Update profile mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (profile) {
        return api.put('/subcontractors/me', data);
      } else {
        return api.post('/subcontractors/register', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-sub-profile'] });
      setIsEditing(false);
    },
  });

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
    'Masonry',
    'Siding',
    'Windows',
    'Doors',
    'Gutters',
    'Fencing',
    'Decking',
  ];

  const jobTypes = [
    'Residential',
    'Commercial',
    'New Construction',
    'Renovation',
    'Repair',
    'Maintenance',
    'Emergency',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...profileForm,
      serviceRadius: parseInt(profileForm.serviceRadius),
      hourlyRate: profileForm.hourlyRate ? parseFloat(profileForm.hourlyRate) : undefined,
      dailyRate: profileForm.dailyRate ? parseFloat(profileForm.dailyRate) : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading profile...</div>
      </div>
    );
  }

  // No profile yet - show registration form
  if (!profile && !isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Register as a Subcontractor
          </h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto">
            Get hired for jobs, showcase your skills, and grow your business by joining our
            subcontractor network.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { icon: TrendingUp, label: 'Get More Jobs', desc: 'Connect with contractors' },
              { icon: Star, label: 'Build Reputation', desc: 'Earn reviews and ratings' },
              { icon: Award, label: 'Premium Features', desc: 'Boost your visibility' },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="text-indigo-600" size={24} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{feature.label}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
          <Button size="lg" onClick={() => setIsEditing(true)}>
            Get Started
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Subcontractor Profile</h1>
          <p className="text-slate-600">Manage your profile and job preferences</p>
        </div>
        {!isEditing && profile && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {/* Stats - Only show if profile exists */}
      {profile && !isEditing && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="text-amber-600" size={24} fill="currentColor" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {profile.rating?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-slate-600">Rating</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Briefcase className="text-indigo-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {profile.completedJobs || 0}
                </div>
                <div className="text-sm text-slate-600">Jobs Done</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {profile.reviewCount || 0}
                </div>
                <div className="text-sm text-slate-600">Reviews</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {profile.avgResponseTime || '--'}m
                </div>
                <div className="text-sm text-slate-600">Avg Response</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Profile Form/View */}
      <Card className="p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="text-indigo-600" size={24} />
              <p className="text-sm text-slate-600">
                Complete your profile to start receiving job offers from contractors
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={profileForm.company}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trades & Skills * (Select at least one)
              </label>
              <div className="flex flex-wrap gap-2">
                {allTrades.map((trade) => (
                  <button
                    key={trade}
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        ...profileForm,
                        trades: profileForm.trades.includes(trade)
                          ? profileForm.trades.filter((t) => t !== trade)
                          : [...profileForm.trades, trade],
                      })
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      profileForm.trades.includes(trade)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {trade}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Primary Specialization
              </label>
              <input
                type="text"
                value={profileForm.specialization}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, specialization: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g., Kitchen & Bath Remodeling"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bio / About You
              </label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Tell contractors about your experience, certifications, and what makes you stand out..."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="TX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={profileForm.zipCode}
                  onChange={(e) => setProfileForm({ ...profileForm, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service Radius (miles)
              </label>
              <input
                type="number"
                value={profileForm.serviceRadius}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, serviceRadius: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <p className="text-xs text-slate-500 mt-1">
                How far are you willing to travel for jobs?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={profileForm.hourlyRate}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, hourlyRate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Daily Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={profileForm.dailyRate}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, dailyRate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preferred Job Types
              </label>
              <div className="flex flex-wrap gap-2">
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        ...profileForm,
                        preferredJobTypes: profileForm.preferredJobTypes.includes(type)
                          ? profileForm.preferredJobTypes.filter((t) => t !== type)
                          : [...profileForm.preferredJobTypes, type],
                      })
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      profileForm.preferredJobTypes.includes(type)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                <Save size={20} />
                {saveMutation.isPending ? 'Saving...' : profile ? 'Save Changes' : 'Create Profile'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* View Mode */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
                {profile.company && (
                  <p className="text-lg text-slate-600 mt-1">{profile.company}</p>
                )}
              </div>
              <div className="flex gap-2">
                {profile.verified && (
                  <Badge variant="success">
                    <Shield size={14} />
                    Verified
                  </Badge>
                )}
                {profile.available && (
                  <Badge variant="info">
                    <CheckCircle size={14} />
                    Available
                  </Badge>
                )}
              </div>
            </div>

            {profile.bio && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">About</h3>
                <p className="text-slate-600">{profile.bio}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Trades & Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.trades?.map((trade: string) => (
                  <span
                    key={trade}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-full font-medium"
                  >
                    {trade}
                  </span>
                ))}
              </div>
            </div>

            {profile.specialization && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Specialization</h3>
                <p className="text-slate-600">{profile.specialization}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Location</h3>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={18} />
                  {profile.city}, {profile.state}
                  {profile.zipCode && ` ${profile.zipCode}`}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Service radius: {profile.serviceRadius || 25} miles
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Rates</h3>
                <div className="space-y-1">
                  {profile.hourlyRate && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign size={18} />
                      ${profile.hourlyRate}/hour
                    </div>
                  )}
                  {profile.dailyRate && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign size={18} />
                      ${profile.dailyRate}/day
                    </div>
                  )}
                  {!profile.hourlyRate && !profile.dailyRate && (
                    <p className="text-sm text-slate-500">Rates negotiable</p>
                  )}
                </div>
              </div>
            </div>

            {profile.preferredJobTypes && profile.preferredJobTypes.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Preferred Job Types</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.preferredJobTypes.map((type: string) => (
                    <span
                      key={type}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Insurance & Verification */}
      {profile && !isEditing && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Professional Credentials</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  profile.verified ? 'bg-green-100' : 'bg-slate-100'
                }`}
              >
                <Shield
                  className={profile.verified ? 'text-green-600' : 'text-slate-400'}
                  size={24}
                />
              </div>
              <div>
                <div className="font-medium text-slate-900">
                  {profile.verified ? 'Verified' : 'Not Verified'}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {profile.verified
                    ? 'Identity and credentials verified'
                    : 'Complete verification to build trust'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  profile.insurance ? 'bg-green-100' : 'bg-slate-100'
                }`}
              >
                <Shield
                  className={profile.insurance ? 'text-green-600' : 'text-slate-400'}
                  size={24}
                />
              </div>
              <div>
                <div className="font-medium text-slate-900">
                  {profile.insurance ? 'Insured' : 'No Insurance on File'}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {profile.insurance
                    ? 'Liability insurance active'
                    : 'Add insurance information'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
