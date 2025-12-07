import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { CommissionBadge } from '../components/CommissionBadge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';

interface MaterialOrder {
  id: string;
  supplierId: string;
  supplier: {
    name: string;
    contactPhone: string;
  };
  materialType: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZipCode: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  commissionAmount?: number;
  commissionPaid: boolean;
  commissionPaidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<MaterialOrder['status'], string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

export const MaterialOrders: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<MaterialOrder | null>(null);
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['material-orders', selectedStatus],
    queryFn: async () => {
      const params = selectedStatus ? `?status=${selectedStatus}` : '';
      const response = await api.get(`/materials/orders${params}`);
      return response.data;
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await api.put(`/materials/orders/${orderId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-orders'] });
      setSelectedOrder(null);
      alert('Order status updated successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update order status');
    },
  });

  const calculateTotalCommission = () => {
    return orders
      .filter((order: MaterialOrder) => order.commissionAmount)
      .reduce((sum: number, order: MaterialOrder) => sum + (order.commissionAmount || 0), 0);
  };

  const calculatePendingCommission = () => {
    return orders
      .filter((order: MaterialOrder) => order.commissionAmount && !order.commissionPaid)
      .reduce((sum: number, order: MaterialOrder) => sum + (order.commissionAmount || 0), 0);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Material Orders</h1>
        <p className="text-gray-600">
          Manage material orders and track deliveries
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Total Commission</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(calculateTotalCommission())}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Pending Commission</p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(calculatePendingCommission())}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <label className="font-medium">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <p className="text-center text-gray-600 py-8">
            No orders found. Create an order from the Materials page.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: MaterialOrder) => (
            <div
              key={order.id}
              className="cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{order.materialType}</h3>
                    <Badge variant={STATUS_COLORS[order.status] as any}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Supplier: {order.supplier.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Order Date: {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {formatCurrency(order.totalAmount + order.deliveryFee)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {order.quantity} units @ {formatCurrency(order.unitPrice)}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-700">
                  Delivery: {order.deliveryAddress}, {order.deliveryCity},{' '}
                  {order.deliveryState} {order.deliveryZipCode}
                </p>
                {order.estimatedDeliveryDate && (
                  <p className="text-sm text-gray-600">
                    Estimated Delivery: {formatDate(order.estimatedDeliveryDate)}
                  </p>
                )}
                {order.actualDeliveryDate && (
                  <p className="text-sm text-green-600">
                    Delivered: {formatDate(order.actualDeliveryDate)}
                  </p>
                )}
              </div>

              {order.commissionAmount && (
                <CommissionBadge
                  amount={order.commissionAmount}
                  isPaid={order.commissionPaid}
                  paidAt={order.commissionPaidAt}
                />
              )}
            </Card>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details - ${selectedOrder.materialType}`}
        >
          <div className="space-y-4">
            <div>
              <Badge variant={STATUS_COLORS[selectedOrder.status] as any}>
                {selectedOrder.status}
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Supplier</h4>
              <p>{selectedOrder.supplier.name}</p>
              <p className="text-sm text-gray-600">
                Phone: {selectedOrder.supplier.contactPhone}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Order Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Material Type:</p>
                  <p className="font-medium">{selectedOrder.materialType}</p>
                </div>
                <div>
                  <p className="text-gray-600">Quantity:</p>
                  <p className="font-medium">{selectedOrder.quantity} units</p>
                </div>
                <div>
                  <p className="text-gray-600">Unit Price:</p>
                  <p className="font-medium">{formatCurrency(selectedOrder.unitPrice)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Subtotal:</p>
                  <p className="font-medium">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Delivery Fee:</p>
                  <p className="font-medium">{formatCurrency(selectedOrder.deliveryFee)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total:</p>
                  <p className="font-bold">
                    {formatCurrency(selectedOrder.totalAmount + selectedOrder.deliveryFee)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Delivery Information</h4>
              <p className="text-sm">{selectedOrder.deliveryAddress}</p>
              <p className="text-sm">
                {selectedOrder.deliveryCity}, {selectedOrder.deliveryState}{' '}
                {selectedOrder.deliveryZipCode}
              </p>
              {selectedOrder.estimatedDeliveryDate && (
                <p className="text-sm text-gray-600 mt-2">
                  Estimated: {formatDate(selectedOrder.estimatedDeliveryDate)}
                </p>
              )}
              {selectedOrder.actualDeliveryDate && (
                <p className="text-sm text-green-600 mt-2">
                  Delivered: {formatDate(selectedOrder.actualDeliveryDate)}
                </p>
              )}
            </div>

            {selectedOrder.commissionAmount && (
              <div>
                <h4 className="font-semibold mb-2">Commission</h4>
                <CommissionBadge
                  amount={selectedOrder.commissionAmount}
                  isPaid={selectedOrder.commissionPaid}
                  paidAt={selectedOrder.commissionPaidAt}
                />
              </div>
            )}

            {selectedOrder.notes && (
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Status Update Buttons */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: 'CONFIRMED',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    Confirm Order
                  </Button>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <Button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: 'SHIPPED',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark as Shipped
                  </Button>
                )}
                {selectedOrder.status === 'SHIPPED' && (
                  <Button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: 'DELIVERED',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark as Delivered
                  </Button>
                )}
                {['PENDING', 'CONFIRMED'].includes(selectedOrder.status) && (
                  <Button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: selectedOrder.id,
                        status: 'CANCELLED',
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                    variant="secondary"
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};
