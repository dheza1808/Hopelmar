import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'job' | 'quotation' | 'invoice' | 'document';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status.toLowerCase()) {
      // Job & General Statuses
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'booking_confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_transit':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'customs_clearance':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered':
      case 'completed':
      case 'verified':
      case 'accepted':
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
      case 'rejected':
      case 'overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'partial':
      case 'pending':
      case 'sent':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'unpaid':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {formatText(status)}
    </span>
  );
};
