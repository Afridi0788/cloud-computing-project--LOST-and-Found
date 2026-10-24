import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Search, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-5 border border-brand-100">
          <HelpCircle className="w-8 h-8" />
        </div>

        <span className="text-4xl font-extrabold text-slate-900 tracking-tight block mb-2">
          404
        </span>

        <h1 className="text-xl font-bold text-slate-800 mb-2">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mb-8 leading-relaxed">
          The page or item you're looking for seems to have gone missing, just like a lost item!
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <Link
            to="/lost"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Lost
          </Link>
        </div>
      </div>
    </div>
  );
}
