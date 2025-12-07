import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Table } from '../components/Table';

interface Commission {
  id: string;
  source: 'SUBCONTRACTOR' | 'MATERIAL' | 'FINANCING' | 'REFERRAL';
  sourceId: string;
  amount: number;
  percentage: number;
  isPaid: boolean;
  paidAt?: string;
  description: string;
  createdAt: string;
}

const SOURCE_LABELS: Record<Commission['source'], string> = {
  SUBCONTRACTOR: 'Subcontractor Hire',
  MATERIAL: 'Material Order',
  FINANCING: 'Financing Offer',
  REFERRAL: 'Referral',
};

const SOURCE_COLORS: Record<Commission['source'], string> = {
  SUBCONTRACTOR: 'info',
  MATERIAL: 'warning',
  FINANCING: 'success',
  REFERRAL: 'default',
};

export const Commissions: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Fetch commissions
  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ['commissions', selectedSource, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSource) params.append('source', selectedSource);
      if (selectedStatus) params.append('status', selectedStatus);
      const response = await api.get(`/analytics/commissions?${params}`);
      return response.data;
    },
  });

  // Filter out material commissions - contractors don't get material commission
  const commissions: Commission[] = (commissionsData?.commissions || []).filter(
    (c: Commission) => c.source !== 'MATERIAL'
  );
  const stats = commissionsData?.stats || {};

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

  const exportToCSV = () => {
    const headers = ['Date', 'Source', 'Description', 'Amount', 'Status', 'Paid Date'];
    // Only export non-material commissions
    const rows = commissions
      .filter((c) => c.source !== 'MATERIAL')
      .map((c) => [
        formatDate(c.createdAt),
        SOURCE_LABELS[c.source],
        c.description,
        c.amount,
        c.isPaid ? 'Paid' : 'Pending',
        c.paidAt ? formatDate(c.paidAt) : '',
      ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Commission Dashboard</h1>
          <p className="text-gray-600">
            Track revenue and commissions from all sources
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={commissions.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-600">Total Commission</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.total || 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats.paid || 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(stats.pending || 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-2xl font-bold">
            {formatCurrency(stats.thisMonth || 0)}
          </p>
        </Card>
      </div>

      {/* Commission by Source */}
      {stats.bySource && (
        <Card className="mb-6">
          <h3 className="font-semibold mb-4">Commission by Source</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <p className="text-sm text-gray-600 mb-1">Subcontractors (5%)</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(stats.bySource.SUBCONTRACTOR || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <p className="text-sm text-gray-600 mb-1">Financing (2%)</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats.bySource.FINANCING || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-1">Referrals</p>
              <p className="text-xl font-bold text-gray-600">
                {formatCurrency(stats.bySource.REFERRAL || 0)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">All Sources</option>
              <option value="SUBCONTRACTOR">Subcontractors</option>
              <option value="FINANCING">Financing</option>
              <option value="REFERRAL">Referrals</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Commissions Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading commissions...</p>
        </div>
      ) : commissions.length === 0 ? (
        <Card>
          <p className="text-center text-gray-600 py-8">
            No commissions found. Commissions will appear as you complete transactions.
          </p>
        </Card>
      ) : (
        <Card>
          <Table
            columns={[
              {
                key: 'createdAt',
                header: 'Date',
                render: (item: Commission) => formatDate(item.createdAt),
              },
              {
                key: 'source',
                header: 'Source',
                render: (item: Commission) => (
                  <Badge variant={SOURCE_COLORS[item.source] as any}>
                    {SOURCE_LABELS[item.source]}
                  </Badge>
                ),
              },
              {
                key: 'description',
                header: 'Description',
                render: (item: Commission) => item.description,
              },
              {
                key: 'amount',
                header: 'Amount',
                render: (item: Commission) => (
                  <span className="font-semibold">{formatCurrency(item.amount)}</span>
                ),
              },
              {
                key: 'percentage',
                header: 'Rate',
                render: (item: Commission) => `${item.percentage}%`,
              },
              {
                key: 'isPaid',
                header: 'Status',
                render: (item: Commission) => (
                  <div>
                    <Badge variant={item.isPaid ? 'success' : 'warning'}>
                      {item.isPaid ? 'Paid' : 'Pending'}
                    </Badge>
                    {item.isPaid && item.paidAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(item.paidAt)}
                      </p>
                    )}
                  </div>
                ),
              },
            ]}
            data={commissions}
            keyExtractor={(item: Commission) => item.id}
          />
        </Card>
      )}
    </Layout>
  );
};
