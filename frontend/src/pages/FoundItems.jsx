import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import ItemCard from '../components/ItemCard';
import {
  CheckCircle2,
  Search,
  Filter,
  PlusCircle,
  Loader2,
  RefreshCw,
  XCircle
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Electronics',
  'Wallets & Bags',
  'Documents & IDs',
  'Keys',
  'Jewellery',
  'Clothing',
  'Books & Stationery',
  'Other'
];

export default function FoundItems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchFoundItems();
  }, [selectedCategory, statusFilter]);

  const fetchFoundItems = async (searchOverride) => {
    setLoading(true);
    setError(null);
    try {
      const activeSearch = searchOverride !== undefined ? searchOverride : searchTerm;
      const params = {
        type: 'FOUND',
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: activeSearch ? activeSearch.trim() : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      };

      const response = await itemsAPI.getAll(params);
      if (response.data?.items) {
        setItems(response.data.items);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch found items.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFoundItems();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setStatusFilter('ALL');
    fetchFoundItems('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Found Items Directory
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Browse Found Valuables
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Items discovered around campus awaiting their rightful owners. If an item belongs to you, click "This Is Mine" to submit a claim.
          </p>
        </div>

        <Link
          to="/post?type=FOUND"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Found Item
        </Link>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search found items (e.g. AirPods, Casio calculator, watch)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          {(searchTerm || selectedCategory !== 'All' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Status:
          </span>
          {['ALL', 'OPEN', 'CLAIM_PENDING', 'RETURNED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Section */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading found items...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-rose-200 p-8 max-w-lg mx-auto">
          <CheckCircle2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Failed to fetch items</h3>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => fetchFoundItems()}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8">
          <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No found items match</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            There are currently no matching found item listings for your selected search or filter criteria.
          </p>
          <button
            onClick={clearFilters}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
