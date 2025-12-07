import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, User, TrendingUp } from 'lucide-react';
import { Button, Card, Badge, Table, Pagination, PageLoader, EmptyState } from '../components';
import { QuickLeadInput } from '../components/QuickLeadInput';
import { leadsService } from '../services';
import { formatCurrency, formatRelativeTime } from '../utils/format';

interface Lead {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: string;
  priority: string;
  estimatedValue?: number;
  propertyType?: string;
  ownerName?: string;
  createdAt: string;
  analyzedAt?: string;
  overallScore?: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
];

export function Leads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads', { page: currentPage, status: statusFilter, search: searchQuery }],
    queryFn: async () => {
      const result = await leadsService.getAll({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      console.log('Leads loaded:', result?.data?.length || 0, 'leads');
      return result;
    },
  });

  const handleLeadCreated = (lead: any) => {
    console.log('Lead created, navigating to:', lead);
    
    if (!lead || !lead.id) {
      console.error('Invalid lead data received:', lead);
      alert('Lead created but ID is missing. Please refresh the page.');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    navigate(`/leads/${lead.id}`);
  };

  const columns = [
    {
      key: 'address',
      header: 'Property',
      render: (lead: Lead) => (
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{lead.address}</span>
          </div>
          {(lead.city || lead.state) && (
            <p className="text-sm text-gray-500 mt-0.5">
              {[lead.city, lead.state, lead.zipCode].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Lead Score',
      render: (lead: Lead) => (
        <div className="flex flex-col gap-1">
          {lead.overallScore ? (
            <>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className={`font-bold ${
                  lead.overallScore >= 70 ? 'text-green-600' :
                  lead.overallScore >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {lead.overallScore}
                </span>
                <span className="text-xs text-gray-400">/100</span>
              </div>
              {lead.overallScore >= 70 && (
                <span className="text-xs text-green-600 font-medium">Hot Lead 🔥</span>
              )}
              {lead.overallScore < 40 && (
                <span className="text-xs text-gray-500">Low Priority</span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-sm">Not analyzed</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead: Lead) => <Badge status={lead.status} />,
    },
    {
      key: 'estimatedValue',
      header: 'Est. Value',
      render: (lead: Lead) => (
        <span className="font-medium">
          {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '-'}
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (lead: Lead) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{lead.ownerName || '-'}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (lead: Lead) => (
        <span className="text-gray-500 text-sm">{formatRelativeTime(lead.createdAt)}</span>
      ),
    },
  ];

  if (error) {
    return (
      <EmptyState
        icon={<MapPin className="w-12 h-12 text-gray-400" />}
        title="Error loading leads"
        description="There was a problem loading your leads. Please try again."
        action={
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['leads'] })}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Leads</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Add property addresses to analyze and track opportunities
        </p>
        <QuickLeadInput onLeadCreated={handleLeadCreated} />
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by address, city, or owner..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                       dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                     dark:bg-gray-800 dark:text-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <PageLoader message="Loading leads..." />
      ) : data?.leads?.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-12 h-12 text-gray-400" />}
          title="No leads found"
          description={searchQuery || statusFilter
            ? "Try adjusting your filters"
            : "Type a property address above to add your first lead"
          }
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={data?.leads || []}
            keyExtractor={(lead) => lead.id}
            onRowClick={(lead) => navigate(`/leads/${lead.id}`)}
          />
          {data?.pagination && data.pagination.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.total}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}


    </div>
  );
}
