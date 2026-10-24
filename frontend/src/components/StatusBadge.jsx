import React from 'react';
import { AlertCircle, CheckCircle2, Clock, HelpCircle } from 'lucide-react';

export function TypeBadge({ type }) {
  if (type === 'LOST') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 shadow-sm">
        <AlertCircle className="w-3.5 h-3.5" />
        Lost Item
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Found Item
    </span>
  );
}

export function StatusBadge({ status }) {
  switch (status) {
    case 'RETURNED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
          <CheckCircle2 className="w-3 h-3" />
          Returned / Reunited
        </span>
      );
    case 'CLAIM_PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3" />
          Claim Pending
        </span>
      );
    case 'OPEN':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          <HelpCircle className="w-3 h-3" />
          Open
        </span>
      );
  }
}
