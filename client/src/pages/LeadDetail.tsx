import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, MapPin, User, Phone, Mail, 
  DollarSign, Calendar, RefreshCw, Edit, Trash2,
  Home, Hammer, FileText, CreditCard, AlertTriangle
} from 'lucide-react';
import { Button, Card, Badge, ScoreBadge, PageLoader, ConfirmModal } from '../components';
import { leadsService, quotesService, financingService } from '../services';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';

interface PropertyIntel {
  propertyType?: string;
  yearBuilt?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: string;
  estimatedValue?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  taxAssessedValue?: number;
  zoning?: string;
}

interface OwnerIntel {
  name?: string;
  phone?: string;
  email?: string;
  mailingAddress?: string;
  ownershipType?: string;
  lengthOfOwnership?: string;
  estimatedEquity?: number;
  likelyToSell?: number;
  motivationIndicators?: string[];
}

interface RenovationOpportunity {
  area: string;
  description: string;
  estimatedCost: number;
  potentialROI: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Lead {
  id: string;
  name: string;
  fullAddress: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  status: string;
  source?: string;
  email?: string;
  phone?: string;
  estimatedValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  analyzedAt?: string;
  leadScore?: number;
  renovationPotential?: number;
  ownerMotivation?: number;
  profitPotential?: number;
  propertyIntel?: PropertyIntel;
  ownerIntel?: OwnerIntel;
  renovationOpps?: RenovationOpportunity[];
  priority?: string; // Not in schema, kept for UI compatibility
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});

  // Validate ID before making request
  const isValidId = Boolean(id && id !== 'undefined' && id !== 'null');

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: async (): Promise<Lead> => {
      console.log('Loading lead:', id);
      const leadData = await leadsService.getById(id!);
      console.log('Lead loaded:', leadData?.id);
      return leadData as Lead;
    },
    enabled: isValidId,
  });

  const { data: quotesData } = useQuery<{ data: any[] }>({
    queryKey: ['quotes', 'lead', id],
    queryFn: () => quotesService.getAll({ leadId: id }),
    enabled: isValidId,
  });

  const { data: financingData } = useQuery<{ data: any[] }>({
    queryKey: ['financing', 'lead', id],
    queryFn: () => financingService.getForLead(id!),
    enabled: isValidId,
  });

  const convertToProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/leads/${id}/convert-to-project`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to convert lead to project');
      return response.json();
    },
    onSuccess: (project: any) => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      navigate(`/projects/${project.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadsService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setIsEditing(false);
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => leadsService.analyze(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsService.delete(id!),
    onSuccess: () => {
      navigate('/leads');
    },
  });

  const handleStatusChange = (status: string) => {
    updateMutation.mutate({ status });
  };

  const handlePriorityChange = (priority: string) => {
    updateMutation.mutate({ priority });
  };

  if (!isValidId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <div className="text-center p-6">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Lead ID</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The lead ID in the URL is invalid. Please check the URL or navigate to a lead from the leads list.
            </p>
            <Button onClick={() => navigate('/leads')}>
              Go to Leads
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader message="Loading lead details..." />;
  }

  if (error || !lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lead not found</h2>
        <p className="text-gray-500 mt-2">The lead you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/leads')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    );
  }

  // Type assertions after null check - the data shape is known from the API
  // The lead data matches the Lead interface structure after successful fetch
  const typedLead = lead as Lead;
  const quotes = (quotesData as { data: any[] } | undefined)?.data || [];
  const financingOffers = (financingData as { data: any[] } | undefined)?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/leads')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {typedLead.fullAddress}
            </h1>
            {typedLead.leadScore && <ScoreBadge score={typedLead.leadScore} label="Score" />}
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {[typedLead.city, typedLead.state, typedLead.zipCode].filter(Boolean).join(', ')}
          </p>
        </div>
        <div className="flex gap-3">
          {typedLead.status !== 'WON' && (
            <Button
              variant="primary"
              onClick={() => convertToProjectMutation.mutate()}
              loading={convertToProjectMutation.isPending}
            >
              <Hammer className="w-4 h-4 mr-2" />
              Convert to Project
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => analyzeMutation.mutate()}
            loading={analyzeMutation.isPending}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {typedLead.analyzedAt ? 'Re-analyze' : 'Analyze'}
          </Button>
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status & Priority Row */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <select
              value={typedLead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 
                       dark:bg-gray-800 dark:text-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Priority:</span>
            <select
              value={typedLead.priority || 'MEDIUM'}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 
                       dark:bg-gray-800 dark:text-white"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Added {formatDateTime(typedLead.createdAt)}
          </div>
          {typedLead.analyzedAt && (
            <div className="text-sm text-gray-500">
              Last analyzed {formatDateTime(typedLead.analyzedAt)}
            </div>
          )}
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Property & Owner Intel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Intelligence */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold">Property Intelligence</h2>
            </div>
            
            {typedLead.propertyIntel ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoItem label="Property Type" value={typedLead.propertyIntel.propertyType} />
                <InfoItem label="Year Built" value={typedLead.propertyIntel.yearBuilt?.toString()} />
                <InfoItem label="Square Feet" value={typedLead.propertyIntel.squareFeet?.toLocaleString()} />
                <InfoItem label="Bedrooms" value={typedLead.propertyIntel.bedrooms?.toString()} />
                <InfoItem label="Bathrooms" value={typedLead.propertyIntel.bathrooms?.toString()} />
                <InfoItem label="Lot Size" value={typedLead.propertyIntel.lotSize} />
                <InfoItem label="Estimated Value" value={typedLead.propertyIntel.estimatedValue ? formatCurrency(typedLead.propertyIntel.estimatedValue) : undefined} />
                <InfoItem label="Last Sale Price" value={typedLead.propertyIntel.lastSalePrice ? formatCurrency(typedLead.propertyIntel.lastSalePrice) : undefined} />
                <InfoItem label="Last Sale Date" value={typedLead.propertyIntel.lastSaleDate ? formatDate(typedLead.propertyIntel.lastSaleDate) : undefined} />
                <InfoItem label="Tax Assessed" value={typedLead.propertyIntel.taxAssessedValue ? formatCurrency(typedLead.propertyIntel.taxAssessedValue) : undefined} />
                <InfoItem label="Zoning" value={typedLead.propertyIntel.zoning} />
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Click "Analyze" to gather property intelligence
              </p>
            )}
          </Card>

          {/* Owner Intelligence */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold">Owner Intelligence</h2>
            </div>
            
            {typedLead.ownerIntel ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Owner Name" value={typedLead.ownerIntel.name} icon={<User className="w-4 h-4" />} />
                  <InfoItem label="Phone" value={typedLead.ownerIntel.phone} icon={<Phone className="w-4 h-4" />} />
                  <InfoItem label="Email" value={typedLead.ownerIntel.email} icon={<Mail className="w-4 h-4" />} />
                  <InfoItem label="Mailing Address" value={typedLead.ownerIntel.mailingAddress} icon={<MapPin className="w-4 h-4" />} />
                  <InfoItem label="Ownership Type" value={typedLead.ownerIntel.ownershipType} />
                  <InfoItem label="Length of Ownership" value={typedLead.ownerIntel.lengthOfOwnership} />
                  <InfoItem label="Estimated Equity" value={typedLead.ownerIntel.estimatedEquity ? formatCurrency(typedLead.ownerIntel.estimatedEquity) : undefined} />
                  {typedLead.ownerIntel.likelyToSell !== undefined && (
                    <div>
                      <span className="text-sm text-gray-500">Likely to Sell</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-600 rounded-full"
                            style={{ width: `${typedLead.ownerIntel.likelyToSell}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{typedLead.ownerIntel.likelyToSell}%</span>
                      </div>
                    </div>
                  )}
                </div>
                {typedLead.ownerIntel.motivationIndicators && typedLead.ownerIntel.motivationIndicators.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 block mb-2">Motivation Indicators</span>
                    <div className="flex flex-wrap gap-2">
                      {typedLead.ownerIntel.motivationIndicators.map((indicator: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-sm rounded">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Click "Analyze" to gather owner intelligence
              </p>
            )}
          </Card>

          {/* Renovation Opportunities */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Hammer className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold">Renovation Opportunities</h2>
            </div>
            
            {typedLead.renovationOpps && typedLead.renovationOpps.length > 0 ? (
              <div className="space-y-4">
                {typedLead.renovationOpps.map((opp: RenovationOpportunity, i: number) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{opp.area}</h4>
                        <p className="text-sm text-gray-500 mt-1">{opp.description}</p>
                      </div>
                      <Badge status={opp.priority} />
                    </div>
                    <div className="flex gap-6 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Est. Cost:</span>
                        <span className="ml-2 font-medium">{formatCurrency(opp.estimatedCost)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Potential ROI:</span>
                        <span className="ml-2 font-medium text-green-600">{opp.potentialROI}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Click "Analyze" to discover renovation opportunities
              </p>
            )}
          </Card>
        </div>

        {/* Right Column - Actions & Notes */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/quotes?new=true&leadId=${id}`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Quote
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/financing?new=true&leadId=${id}`)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Create Financing Offer
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Follow-up
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="w-4 h-4 mr-2" />
                Log Call
              </Button>
            </div>
          </Card>

          {/* Related Quotes */}
          {quotes.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Quotes</h2>
              <div className="space-y-2">
                {quotes.map((quote: any) => (
                  <button
                    key={quote.id}
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                    className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{quote.quoteNumber}</span>
                      <Badge status={quote.status} />
                    </div>
                    <div className="text-sm text-gray-500">{quote.title}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {formatCurrency(quote.total)}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Financing Offers */}
          {financingOffers.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Financing Offers</h2>
              <div className="space-y-2">
                {financingOffers.map((offer: any) => (
                  <div
                    key={offer.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{offer.lenderName}</span>
                      <Badge status={offer.status} />
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(offer.amount)} @ {offer.interestRate}% for {offer.termMonths} months
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      ${offer.monthlyPayment}/mo
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Estimated Value */}
          {typedLead.estimatedValue && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-500">Estimated Project Value</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(typedLead.estimatedValue)}
              </p>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editData.notes || typedLead.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-primary-500
                           dark:bg-gray-800 dark:text-white"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateMutation.mutate({ notes: editData.notes })}
                    loading={updateMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {typedLead.notes || 'No notes yet.'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditData({ notes: typedLead.notes });
                    setIsEditing(true);
                  }}
                  className="mt-3"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Notes
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function InfoItem({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value?: string; 
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="font-medium">{value || '-'}</span>
      </div>
    </div>
  );
}
