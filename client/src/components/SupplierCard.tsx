import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';

interface SupplierCardProps {
  supplier: {
    id: string;
    name: string;
    materialTypes: string[];
    location: string;
    rating?: number;
    reviewCount?: number;
    minOrderAmount?: number;
    deliveryFee?: number;
    commissionPercentage: number;
    verified?: boolean;
    serviceRadius?: number;
  };
  onSelect?: (supplierId: string) => void;
  onRequestQuote?: (supplierId: string) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier,
  onSelect,
  onRequestQuote,
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{supplier.name}</h3>
            {supplier.verified && (
              <Badge variant="success">Verified</Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">{supplier.location}</p>
        </div>
        {supplier.rating && (
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-semibold">{supplier.rating.toFixed(1)}</span>
            </div>
            {supplier.reviewCount && (
              <p className="text-xs text-gray-500">
                {supplier.reviewCount} reviews
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">Materials:</p>
        <div className="flex flex-wrap gap-1">
          {supplier.materialTypes.map((type) => (
            <Badge key={type}>
              {type}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        {supplier.minOrderAmount !== undefined && (
          <div>
            <p className="text-gray-600">Min Order:</p>
            <p className="font-semibold">${supplier.minOrderAmount}</p>
          </div>
        )}
        {supplier.deliveryFee !== undefined && (
          <div>
            <p className="text-gray-600">Delivery Fee:</p>
            <p className="font-semibold">${supplier.deliveryFee}</p>
          </div>
        )}
        {supplier.serviceRadius && (
          <div>
            <p className="text-gray-600">Service Radius:</p>
            <p className="font-semibold">{supplier.serviceRadius} miles</p>
          </div>
        )}
        <div>
          <p className="text-gray-600">Commission:</p>
          <p className="font-semibold text-green-600">
            {supplier.commissionPercentage}%
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {onSelect && (
          <button
            onClick={() => onSelect(supplier.id)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Details
          </button>
        )}
        {onRequestQuote && (
          <button
            onClick={() => onRequestQuote(supplier.id)}
            className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
          >
            Request Quote
          </button>
        )}
      </div>
    </Card>
  );
};
