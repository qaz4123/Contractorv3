import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, DollarSign, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Card, Badge, Table, Pagination, Modal, PageLoader, EmptyState, Input } from '../components';
import { invoicesService } from '../services';
import { formatCurrency, formatDate } from '../utils/format';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  clientName?: string;
  clientEmail?: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  dueDate?: string;
  createdAt: string;
  project?: { name: string };
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'VIEWED', label: 'Viewed' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
];

export function Invoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(searchParams.get('new') === 'true');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [newInvoice, setNewInvoice] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    dueInDays: 30,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { page: currentPage, status: statusFilter }],
    queryFn: () => invoicesService.getAll({
      page: currentPage,
      limit: 10,
      status: statusFilter || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => invoicesService.create(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsNewModalOpen(false);
      navigate(`/invoices/${data.id}`);
    },
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newInvoice);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'PARTIAL':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (invoice: Invoice) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(invoice.status)}
          <span className="font-medium">{invoice.invoiceNumber}</span>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (invoice: Invoice) => (
        <div>
          <p className="font-medium">{invoice.clientName || 'No client'}</p>
          {invoice.project && (
            <p className="text-sm text-gray-500">{invoice.project.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice: Invoice) => <Badge status={invoice.status} />,
    },
    {
      key: 'total',
      header: 'Total',
      render: (invoice: Invoice) => (
        <span className="font-medium">{formatCurrency(invoice.total)}</span>
      ),
    },
    {
      key: 'amountDue',
      header: 'Amount Due',
      render: (invoice: Invoice) => (
        <span className={invoice.amountDue > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatCurrency(invoice.amountDue)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (invoice: Invoice) => {
        if (!invoice.dueDate) return <span className="text-gray-400">-</span>;
        const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.amountDue > 0;
        return (
          <span className={isOverdue ? 'text-red-600' : 'text-gray-500'}>
            {formatDate(invoice.dueDate)}
          </span>
        );
      },
    },
  ];

  if (isLoading) {
    return <PageLoader message="Loading invoices..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage billing and payments
          </p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Invoiced</p>
          <p className="text-2xl font-semibold">{formatCurrency(data?.stats?.totalInvoiced || 0)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-semibold text-green-600">{formatCurrency(data?.stats?.totalPaid || 0)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-semibold text-yellow-600">{formatCurrency(data?.stats?.totalOutstanding || 0)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-semibold text-red-600">{formatCurrency(data?.stats?.totalOverdue || 0)}</p>
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
      {data?.invoices?.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="w-12 h-12 text-gray-400" />}
          title="No invoices found"
          description="Create your first invoice to start billing"
          action={
            <Button onClick={() => setIsNewModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          }
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={data?.invoices || []}
            keyExtractor={(invoice) => invoice.id}
            onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
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

      {/* New Invoice Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          searchParams.delete('new');
          setSearchParams(searchParams);
        }}
        title="Create New Invoice"
        size="md"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Input
            label="Client Name"
            value={newInvoice.clientName}
            onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
            placeholder="John Smith"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Client Email"
              type="email"
              value={newInvoice.clientEmail}
              onChange={(e) => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })}
              placeholder="john@example.com"
            />
            <Input
              label="Client Phone"
              value={newInvoice.clientPhone}
              onChange={(e) => setNewInvoice({ ...newInvoice, clientPhone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <Input
            label="Client Address"
            value={newInvoice.clientAddress}
            onChange={(e) => setNewInvoice({ ...newInvoice, clientAddress: e.target.value })}
            placeholder="123 Main St, City, State 12345"
          />

          <Input
            label="Payment Due (days)"
            type="number"
            value={newInvoice.dueInDays}
            onChange={(e) => setNewInvoice({ ...newInvoice, dueInDays: parseInt(e.target.value) || 30 })}
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
              Create Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
