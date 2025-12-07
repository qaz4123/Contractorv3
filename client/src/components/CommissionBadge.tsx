import React from 'react';
import { Badge } from './Badge';

interface CommissionBadgeProps {
  amount?: number;
  percentage?: number;
  isPaid?: boolean;
  paidAt?: string;
  className?: string;
}

export const CommissionBadge: React.FC<CommissionBadgeProps> = ({
  amount,
  percentage,
  isPaid,
  paidAt,
  className = '',
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {amount !== undefined && (
        <Badge variant={isPaid ? 'success' : 'warning'}>
          Commission: {formatCurrency(amount)}
          {percentage !== undefined && ` (${percentage}%)`}
        </Badge>
      )}
      {isPaid && paidAt && (
        <span className="text-xs text-gray-600">
          Paid: {formatDate(paidAt)}
        </span>
      )}
      {!isPaid && amount !== undefined && amount > 0 && (
        <Badge variant="warning">Pending Payment</Badge>
      )}
    </div>
  );
};
