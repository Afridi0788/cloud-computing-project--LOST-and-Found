import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import ItemCard from '../components/ItemCard';
import {
  Search,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Loader2,
  ArrowRight,
  HelpCircle,
  FileText
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

export default function Home() {
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchRecentItems();
  }, []);

  const fetchRecentItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await itemsAPI.getAll();
      if (response.data?.items) {
        setRecentItems(response.data.items.slice(0, 6)); // Show latest 6 items
      }
    } catch (err) {
      setError(err.message || 'Failed to load recent items.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/lost?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/lost');
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-slate-50 pt-12 pb-20 border-b border-slate-200/70">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 text-brand-800 text-xs font-semibold mb-6 border border-brand-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Smart College Campus Lost & Found System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Lost Something on Campus? <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
              We Help Reconnect Belongings.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Report misplaced valuables, search verified found items, and claim your belongings through private verification. Secure, cloud-hosted, and transparent.
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <div className="pl-5 text-slate-400">
                <Search className="w-5 h-5 text-brand-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name (e.g., Fossil Wallet, AirPods, ID card, keys)..."
                className="w-full py-4 pl-3 pr-28 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
              >
                Search
              </button>
            </form>
          </div>

          {/* Prominent Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/post?type=LOST"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all hover:-translate-y-0.5"
            >
              <AlertCircle className="w-5 h-5" />
              I Lost Something
            </Link>

            <Link
              to="/post?type=FOUND"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-5 h-5" />
              I Found Something
            </Link>

            <Link
              to="/lost"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Search className="w-5 h-5 text-slate-500" />
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      {/* College Project Viva / Demo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold mb-3 border border-blue-700">
                <FileText className="w-3.5 h-3.5" />
                Cloud Computing Course Project Demonstration
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                Sample Test Accounts Ready for Viva Evaluation
              </h2>
              <p className="text-sm text-blue-200 max-w-2xl leading-relaxed">
                Test the end-to-end workflow: Alice (poster), Bob (finder), and Charlie (claimant). 
                Default password for all accounts is: <code className="bg-blue-950 px-2 py-0.5 rounded font-mono text-amber-300 font-bold">Password123!</code>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/login"
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-blue-900 hover:bg-blue-50 transition-colors shadow-sm"
              >
                Sign In with Demo Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Posted Items Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <Clock className="w-4 h-4" />
              Live Campus Listings
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Recently Reported Items
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/lost"
              className="text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              View all lost <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/found"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View all found <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 h-80 animate-pulse flex flex-col justify-between">
                <div className="h-44 bg-slate-200 rounded-xl" />
                <div className="space-y-2 mt-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-12 bg-white rounded-2xl border border-rose-200 p-8 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Unable to load items</h3>
            <p className="text-xs text-slate-500 mb-4">{error}</p>
            <button
              onClick={fetchRecentItems}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Items grid */}
        {!loading && !error && recentItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && recentItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No items listed yet</h3>
            <p className="text-sm text-slate-500 mb-6">Be the first to report a lost or found item on campus.</p>
            <Link
              to="/post"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
            >
              <PlusCircle className="w-4 h-4" />
              Post New Item
            </Link>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Simple & Secure Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-4 mb-3">
            How Campus Lost & Found Works
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Three simple steps to connect genuine owners with their misplaced belongings while preventing false claims.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 font-extrabold flex items-center justify-center text-lg mb-5 border border-rose-100">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Report Lost or Found Item</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload title, category, campus location, date, and photo. Images are encrypted and safely stored in an isolated Amazon S3 bucket.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 font-extrabold flex items-center justify-center text-lg mb-5 border border-brand-100">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Private Verification Claim</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Claimants submit identifying details (e.g. engravings, locks, contents) that are kept private and reviewed only by the item poster.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 font-extrabold flex items-center justify-center text-lg mb-5 border border-emerald-100">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Verified Handover & Return</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The poster approves the claim. After physical handover, the item is marked as RETURNED through a transactional database commit.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
