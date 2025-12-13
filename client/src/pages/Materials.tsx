import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import Layout from '../components/Layout';
import { SupplierCard } from '../components/SupplierCard';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  materialTypes: string[];
  minOrderAmount?: number;
  deliveryFee?: number;
  commissionPercentage: number;
  rating?: number;
  serviceRadius?: number;
  verified: boolean;
  createdAt: string;
}

interface DeliveryQuote {
  supplierId: string;
  supplierName: string;
  deliveryFee: number;
  estimatedDays: number;
  totalCost: number;
}

const MATERIAL_TYPES = [
  'Lumber',
  'Concrete',
  'Roofing',
  'Drywall',
  'Insulation',
  'Flooring',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Paint',
  'Hardware',
  'Windows',
  'Doors',
  'Cabinets',
  'Countertops',
];

export const Materials: React.FC = () => {
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    materialType: '',
    quantity: '',
    description: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryZipCode: '',
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['materials-suppliers', selectedMaterialTypes, location],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMaterialTypes.length > 0) {
        params.append('materialTypes', selectedMaterialTypes.join(','));
      }
      if (location) {
        params.append('location', location);
      }
      const response = await api.get(`/materials/suppliers?${params}`);
      return response.data;
    },
  });

  // Request delivery quote mutation
  const requestQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/materials/delivery-quotes', data);
      return response.data;
    },
    onSuccess: (data: DeliveryQuote) => {
      alert(
        `Quote received from ${data.supplierName}:\n` +
        `Delivery Fee: $${data.deliveryFee}\n` +
        `Estimated Delivery: ${data.estimatedDays} days\n` +
        `Total Cost: $${data.totalCost}`
      );
      setShowQuoteModal(false);
      setQuoteForm({
        materialType: '',
        quantity: '',
        description: '',
        deliveryAddress: '',
        deliveryCity: '',
        deliveryState: '',
        deliveryZipCode: '',
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to request quote');
    },
  });

  const handleMaterialTypeToggle = (type: string) => {
    setSelectedMaterialTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleRequestQuote = (supplierId: string) => {
    const supplier = suppliers.find((s: Supplier) => s.id === supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setShowQuoteModal(true);
    }
  };

  const handleViewDetails = (supplierId: string) => {
    const supplier = suppliers.find((s: Supplier) => s.id === supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
    }
  };

  const handleSubmitQuote = () => {
    if (!selectedSupplier || !quoteForm.materialType || !quoteForm.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    requestQuoteMutation.mutate({
      supplierId: selectedSupplier.id,
      ...quoteForm,
      quantity: parseFloat(quoteForm.quantity),
    });
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Material Suppliers</h1>
        <p className="text-gray-600">
          Browse suppliers, compare prices, and request delivery quotes
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-3">Filters</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            type="text"
            placeholder="City, State or ZIP"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Material Types</label>
          <div className="flex flex-wrap gap-2">
            {MATERIAL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleMaterialTypeToggle(type)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedMaterialTypes.includes(type)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {selectedMaterialTypes.length > 0 && (
          <button
            onClick={() => setSelectedMaterialTypes([])}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </Card>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <Card>
          <p className="text-center text-gray-600 py-8">
            No suppliers found. Try adjusting your filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier: Supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={{
                id: supplier.id,
                name: supplier.name,
                materialTypes: supplier.materialTypes,
                location: `${supplier.city}, ${supplier.state}`,
                rating: supplier.rating,
                minOrderAmount: supplier.minOrderAmount,
                deliveryFee: supplier.deliveryFee,
                commissionPercentage: supplier.commissionPercentage,
                verified: supplier.verified,
                serviceRadius: supplier.serviceRadius,
              }}
              onSelect={handleViewDetails}
              onRequestQuote={handleRequestQuote}
            />
          ))}
        </div>
      )}

      {/* Supplier Details Modal */}
      {selectedSupplier && !showQuoteModal && (
        <Modal
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          title={selectedSupplier.name}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Contact Information</h4>
              <p className="text-sm">Email: {selectedSupplier.contactEmail}</p>
              <p className="text-sm">Phone: {selectedSupplier.contactPhone}</p>
              <p className="text-sm">
                Address: {selectedSupplier.address}, {selectedSupplier.city},{' '}
                {selectedSupplier.state} {selectedSupplier.zipCode}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Materials</h4>
              <div className="flex flex-wrap gap-2">
                {selectedSupplier.materialTypes.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedSupplier.minOrderAmount !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Minimum Order</p>
                  <p className="font-semibold">${selectedSupplier.minOrderAmount}</p>
                </div>
              )}
              {selectedSupplier.deliveryFee !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Delivery Fee</p>
                  <p className="font-semibold">${selectedSupplier.deliveryFee}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Commission</p>
                <p className="font-semibold text-green-600">
                  {selectedSupplier.commissionPercentage}%
                </p>
              </div>
              {selectedSupplier.serviceRadius && (
                <div>
                  <p className="text-sm text-gray-600">Service Radius</p>
                  <p className="font-semibold">{selectedSupplier.serviceRadius} miles</p>
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                setShowQuoteModal(true);
              }}
              className="w-full"
            >
              Request Quote
            </Button>
          </div>
        </Modal>
      )}

      {/* Request Quote Modal */}
      {showQuoteModal && selectedSupplier && (
        <Modal
          isOpen={showQuoteModal}
          onClose={() => {
            setShowQuoteModal(false);
            setQuoteForm({
              materialType: '',
              quantity: '',
              description: '',
              deliveryAddress: '',
              deliveryCity: '',
              deliveryState: '',
              deliveryZipCode: '',
            });
          }}
          title={`Request Quote - ${selectedSupplier.name}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Material Type *
              </label>
              <select
                value={quoteForm.materialType}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, materialType: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select material type</option>
                {selectedSupplier.materialTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity *
              </label>
              <input
                type="number"
                value={quoteForm.quantity}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, quantity: e.target.value })
                }
                className="w-full p-2 border rounded"
                placeholder="Enter quantity"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={quoteForm.description}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, description: e.target.value })
                }
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Additional details..."
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Delivery Address</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  value={quoteForm.deliveryAddress}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, deliveryAddress: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Street address"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={quoteForm.deliveryCity}
                    onChange={(e) =>
                      setQuoteForm({ ...quoteForm, deliveryCity: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={quoteForm.deliveryState}
                    onChange={(e) =>
                      setQuoteForm({ ...quoteForm, deliveryState: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={quoteForm.deliveryZipCode}
                    onChange={(e) =>
                      setQuoteForm({ ...quoteForm, deliveryZipCode: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitQuote}
                disabled={requestQuoteMutation.isPending}
                className="flex-1"
              >
                {requestQuoteMutation.isPending ? 'Requesting...' : 'Request Quote'}
              </Button>
              <Button
                onClick={() => setShowQuoteModal(false)}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};
