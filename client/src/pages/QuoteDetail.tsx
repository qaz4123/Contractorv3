import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Send, CheckCircle, Receipt, Edit, Trash2 
} from 'lucide-react';
import { Button, Card, Badge, PageLoader, ConfirmModal } from '../components';
import { quotesService } from '../services';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  description?: string;
  status: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  validUntil?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  lead?: { id: string; address: string };
  project?: { id: string; name: string };
}

export function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: quote, isLoading, error } = useQuery<Quote>({
    queryKey: ['quote', id],
    queryFn: () => quotesService.getById(id!),
    enabled: !!id,
  });

  const sendMutation = useMutation({
    mutationFn: () => quotesService.send(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
    },
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: () => quotesService.convertToInvoice(id!),
    onSuccess: (invoice: any) => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      navigate(`/invoices/${invoice.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => quotesService.delete(id!),
    onSuccess: () => {
      navigate('/quotes');
    },
  });

  if (isLoading) {
    return <PageLoader message="Loading quote details..." />;
  }

  if (error || !quote) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quote not found</h2>
        <p className="text-gray-500 mt-2">The quote you are looking for does not exist.</p>
        <Button onClick={() => navigate('/quotes')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quotes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/quotes')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {quote.quoteNumber}
            </h1>
            <Badge status={quote.status} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{quote.title}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {quote.status === 'DRAFT' && (
            <Button
              variant="primary"
              onClick={() => sendMutation.mutate()}
              loading={sendMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Quote
            </Button>
          )}
          {quote.status === 'ACCEPTED' && (
            <Button
              variant="primary"
              onClick={() => convertToInvoiceMutation.mutate()}
              loading={convertToInvoiceMutation.isPending}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Convert to Invoice
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/quotes/${id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Client Information
            </h2>
            <div className="space-y-3">
              {quote.clientName && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium">{quote.clientName}</p>
                </div>
              )}
              {quote.clientEmail && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium">{quote.clientEmail}</p>
                </div>
              )}
              {quote.clientPhone && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium">{quote.clientPhone}</p>
                </div>
              )}
              {quote.lead && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Related Lead</p>
                  <button
                    onClick={() => navigate(`/leads/${quote.lead!.id}`)}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {quote.lead.address}
                  </button>
                </div>
              )}
              {quote.project && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Related Project</p>
                  <button
                    onClick={() => navigate('/projects')}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {quote.project.name}
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Line Items */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {quote.lineItems.map((item: LineItem) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.description}</p>
                        {item.category && (
                          <p className="text-sm text-gray-500">{item.category}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(quote.discount)}</span>
                </div>
              )}
              {quote.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">{formatCurrency(quote.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </Card>

          {/* Description */}
          {quote.description && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {quote.description}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-medium">{formatDateTime(quote.createdAt)}</p>
              </div>
              {quote.validUntil && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valid Until</p>
                  <p className="font-medium">{formatDate(quote.validUntil)}</p>
                </div>
              )}
              {quote.acceptedAt && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Accepted</p>
                  <p className="font-medium text-green-600">{formatDateTime(quote.acceptedAt)}</p>
                </div>
              )}
              {quote.rejectedAt && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
                  <p className="font-medium text-red-600">{formatDateTime(quote.rejectedAt)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="font-medium">{formatDateTime(quote.updatedAt)}</p>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          {quote.status === 'ACCEPTED' && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Quote Accepted!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Next steps:
                  </p>
                  <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1 list-disc list-inside">
                    <li>Convert to invoice</li>
                    <li>Assign to subcontractor (optional)</li>
                    <li>Create project if needed</li>
                    <li>Order materials</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Quote"
        message="Are you sure you want to delete this quote? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
