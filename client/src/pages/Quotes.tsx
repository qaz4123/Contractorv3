import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FileText, Send, Eye, CheckCircle } from 'lucide-react';
import { Button, Card, Badge, Table, Pagination, Modal, PageLoader, EmptyState, Input } from '../components';
import { quotesService } from '../services';
import { formatCurrency, formatDate } from '../utils/format';

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  title?: string;
  clientName?: string;
  clientEmail?: string;
  subtotal: number;
  tax: number;
  total: number;
  validUntil?: string;
  createdAt: string;
  lead?: { address: string };
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'VIEWED', label: 'Viewed' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
];

export function Quotes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(searchParams.get('new') === 'true');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [newQuote, setNewQuote] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    validDays: 30,
  });

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['quotes', { page: currentPage, status: statusFilter }],
    queryFn: () => quotesService.getAll({
      page: currentPage,
      pageSize: 10,
      status: statusFilter || undefined,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['quotes-stats'],
    queryFn: () => quotesService.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => quotesService.create(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setIsNewModalOpen(false);
      navigate(`/quotes/${data.id}`);
    },
  });

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newQuote);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'VIEWED':
        return <Eye className="w-4 h-4 text-purple-500" />;
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const columns = [
    {
      key: 'quoteNumber',
      header: 'Quote #',
      render: (quote: Quote) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(quote.status)}
          <span className="font-medium">{quote.quoteNumber}</span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title / Client',
      render: (quote: Quote) => (
        <div>
          <p className="font-medium">{quote.title || 'Untitled Quote'}</p>
          {quote.clientName && (
            <p className="text-sm text-gray-500">{quote.clientName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (quote: Quote) => <Badge status={quote.status} />,
    },
    {
      key: 'total',
      header: 'Total',
      render: (quote: Quote) => (
        <span className="font-medium">{formatCurrency(quote.total)}</span>
      ),
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      render: (quote: Quote) => (
        <span className="text-gray-500">
          {quote.validUntil ? formatDate(quote.validUntil) : '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (quote: Quote) => (
        <span className="text-gray-500">{formatDate(quote.createdAt)}</span>
      ),
    },
  ];

  if (isLoading) {
    return <PageLoader message="Loading quotes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quotes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage project quotes
          </p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Quote
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Quotes</p>
          <p className="text-2xl font-semibold">{stats?.total || 0}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600">{stats?.pending || 0}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Accepted</p>
          <p className="text-2xl font-semibold text-green-600">{stats?.accepted || 0}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-semibold">{formatCurrency(stats?.totalValue || 0)}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex gap-4">
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
      {(data?.data?.length === 0 || !data?.data) ? (
        <EmptyState
          icon={<FileText className="w-12 h-12 text-gray-400" />}
          title="No quotes found"
          description="Create your first quote to get started"
          action={
            <Button onClick={() => setIsNewModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Quote
            </Button>
          }
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={data?.data || []}
            keyExtractor={(quote) => quote.id}
            onRowClick={(quote) => navigate(`/quotes/${quote.id}`)}
          />
          {data?.totalPages && data.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={data.totalPages}
              totalItems={data.total}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* New Quote Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          searchParams.delete('new');
          setSearchParams(searchParams);
        }}
        title="Create New Quote"
        size="md"
      >
        <form onSubmit={handleCreateQuote} className="space-y-4">
          <Input
            label="Quote Title"
            value={newQuote.title}
            onChange={(e) => setNewQuote({ ...newQuote, title: e.target.value })}
            placeholder="e.g., Kitchen Renovation"
            required
          />
          
          <Input
            label="Client Name"
            value={newQuote.clientName}
            onChange={(e) => setNewQuote({ ...newQuote, clientName: e.target.value })}
            placeholder="John Smith"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Client Email"
              type="email"
              value={newQuote.clientEmail}
              onChange={(e) => setNewQuote({ ...newQuote, clientEmail: e.target.value })}
              placeholder="john@example.com"
            />
            <Input
              label="Client Phone"
              value={newQuote.clientPhone}
              onChange={(e) => setNewQuote({ ...newQuote, clientPhone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <Input
            label="Valid for (days)"
            type="number"
            value={newQuote.validDays}
            onChange={(e) => setNewQuote({ ...newQuote, validDays: parseInt(e.target.value) || 30 })}
            min={1}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Quote
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
