import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { CommissionBadge } from '../components/CommissionBadge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';

interface FinancingOffer {
  id: string;
  projectId?: string;
  project?: {
    name: string;
    customer: { name: string };
  };
  lenderName: string;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED';
  commissionPercentage: number;
  commissionAmount?: number;
  commissionPaid: boolean;
  commissionPaidAt?: string;
  applicationDate: string;
  approvalDate?: string;
  fundingDate?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<FinancingOffer['status'], string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  ACTIVE: 'info',
  COMPLETED: 'default',
};

export const Financing: React.FC = () => {
  const [selectedOffer, setSelectedOffer] = useState<FinancingOffer | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcValues, setCalcValues] = useState({
    loanAmount: '',
    interestRate: '',
    termMonths: '',
  });

  const queryClient = useQueryClient();

  // Fetch financing offers
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['financing-offers'],
    queryFn: async () => {
      const response = await api.get('/financing/offers');
      return response.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['financing-stats'],
    queryFn: async () => {
      const response = await api.get('/financing/stats');
      return response.data;
    },
  });

  // Update offer status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: string }) => {
      const response = await api.put(`/financing/offers/${offerId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financing-offers'] });
      queryClient.invalidateQueries({ queryKey: ['financing-stats'] });
      setSelectedOffer(null);
      alert('Financing offer status updated successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update offer status');
    },
  });

  const calculateMonthlyPayment = () => {
    const principal = parseFloat(calcValues.loanAmount);
    const rate = parseFloat(calcValues.interestRate) / 100 / 12;
    const term = parseFloat(calcValues.termMonths);

    if (!principal || !rate || !term) return 0;

    const monthlyPayment =
      (principal * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    return monthlyPayment;
  };

  const calculateTotalInterest = () => {
    const principal = parseFloat(calcValues.loanAmount);
    const term = parseFloat(calcValues.termMonths);
    const monthly = calculateMonthlyPayment();
    
    if (!monthly) return 0;
    
    return monthly * term - principal;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Financing</h1>
          <p className="text-gray-600">
            Manage financing offers and track commission
          </p>
        </div>
        <Button onClick={() => setShowCalculator(true)}>
          Payment Calculator
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <p className="text-sm text-gray-600">Total Offers</p>
            <p className="text-2xl font-bold">{stats.totalOffers || 0}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Active Loans</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeLoans || 0}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Total Funded</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalFunded || 0)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Total Commission</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalCommission || 0)}
            </p>
          </Card>
        </div>
      )}

      {/* Offers List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading financing offers...</p>
        </div>
      ) : offers.length === 0 ? (
        <Card>
          <p className="text-center text-gray-600 py-8">
            No financing offers yet. Create offers from project pages.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer: FinancingOffer) => (
            <div
              key={offer.id}
              className="cursor-pointer"
              onClick={() => setSelectedOffer(offer)}
            >
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{offer.lenderName}</h3>
                    <Badge variant={STATUS_COLORS[offer.status] as any}>
                      {offer.status}
                    </Badge>
                  </div>
                  {offer.project && (
                    <p className="text-sm text-gray-600">
                      Project: {offer.project.name} - {offer.project.customer.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Applied: {formatDate(offer.applicationDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(offer.loanAmount)}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(offer.monthlyPayment)}/mo
                  </p>
                  <p className="text-xs text-gray-500">
                    {offer.interestRate}% × {offer.termMonths} months
                  </p>
                </div>
              </div>

              {offer.commissionAmount && (
                <CommissionBadge
                  amount={offer.commissionAmount}
                  percentage={offer.commissionPercentage}
                  isPaid={offer.commissionPaid}
                  paidAt={offer.commissionPaidAt}
                />
              )}
            </Card>
            </div>
          ))}
        </div>
      )}

      {/* Offer Details Modal */}
      {selectedOffer && (
        <Modal
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          title={`Financing Offer - ${selectedOffer.lenderName}`}
        >
          <div className="space-y-4">
            <div>
              <Badge variant={STATUS_COLORS[selectedOffer.status] as any}>
                {selectedOffer.status}
              </Badge>
            </div>

            {selectedOffer.project && (
              <div>
                <h4 className="font-semibold mb-2">Project</h4>
                <p>{selectedOffer.project.name}</p>
                <p className="text-sm text-gray-600">
                  Customer: {selectedOffer.project.customer.name}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Loan Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Loan Amount:</p>
                  <p className="font-bold">{formatCurrency(selectedOffer.loanAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Interest Rate:</p>
                  <p className="font-medium">{selectedOffer.interestRate}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Term:</p>
                  <p className="font-medium">{selectedOffer.termMonths} months</p>
                </div>
                <div>
                  <p className="text-gray-600">Monthly Payment:</p>
                  <p className="font-bold">{formatCurrency(selectedOffer.monthlyPayment)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Timeline</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-600">Applied:</span>{' '}
                  {formatDate(selectedOffer.applicationDate)}
                </p>
                {selectedOffer.approvalDate && (
                  <p>
                    <span className="text-gray-600">Approved:</span>{' '}
                    {formatDate(selectedOffer.approvalDate)}
                  </p>
                )}
                {selectedOffer.fundingDate && (
                  <p>
                    <span className="text-gray-600">Funded:</span>{' '}
                    {formatDate(selectedOffer.fundingDate)}
                  </p>
                )}
              </div>
            </div>

            {selectedOffer.commissionAmount && (
              <div>
                <h4 className="font-semibold mb-2">Commission</h4>
                <CommissionBadge
                  amount={selectedOffer.commissionAmount}
                  percentage={selectedOffer.commissionPercentage}
                  isPaid={selectedOffer.commissionPaid}
                  paidAt={selectedOffer.commissionPaidAt}
                />
              </div>
            )}

            {selectedOffer.notes && (
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm text-gray-700">{selectedOffer.notes}</p>
              </div>
            )}

            {/* Status Update Buttons */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {selectedOffer.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          offerId: selectedOffer.id,
                          status: 'APPROVED',
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          offerId: selectedOffer.id,
                          status: 'REJECTED',
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      variant="secondary"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedOffer.status === 'APPROVED' && (
                  <Button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        offerId: selectedOffer.id,
                        status: 'ACTIVE',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark as Active
                  </Button>
                )}
                {selectedOffer.status === 'ACTIVE' && (
                  <Button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        offerId: selectedOffer.id,
                        status: 'COMPLETED',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Calculator Modal */}
      <Modal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        title="Financing Calculator"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Loan Amount ($)
            </label>
            <input
              type="number"
              value={calcValues.loanAmount}
              onChange={(e) =>
                setCalcValues({ ...calcValues, loanAmount: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={calcValues.interestRate}
              onChange={(e) =>
                setCalcValues({ ...calcValues, interestRate: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="5.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Term (months)
            </label>
            <input
              type="number"
              value={calcValues.termMonths}
              onChange={(e) =>
                setCalcValues({ ...calcValues, termMonths: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="60"
            />
          </div>

          {calcValues.loanAmount && calcValues.interestRate && calcValues.termMonths && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Results</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Payment:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(calculateMonthlyPayment())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Interest:</span>
                  <span className="font-medium">
                    {formatCurrency(calculateTotalInterest())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Payment:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      parseFloat(calcValues.loanAmount) + calculateTotalInterest()
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Estimated Commission (2%):</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(parseFloat(calcValues.loanAmount) * 0.02)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};
