import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemsAPI, claimsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TypeBadge, StatusBadge } from '../components/StatusBadge';
import {
  LayoutDashboard,
  Package,
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'incoming' | 'outgoing'
  const [myItems, setMyItems] = useState([]);
  const [incomingClaims, setIncomingClaims] = useState([]);
  const [outgoingClaims, setOutgoingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch user's own items
      const itemsRes = await itemsAPI.getAll({ userId: user.id });
      if (itemsRes.data?.items) {
        setMyItems(itemsRes.data.items);
      }

      // Fetch incoming & outgoing claims
      const claimsRes = await claimsAPI.getClaims();
      if (claimsRes.data) {
        setIncomingClaims(claimsRes.data.incoming || []);
        setOutgoingClaims(claimsRes.data.outgoing || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClaimStatus = async (claimId, newStatus) => {
    setActionLoadingId(claimId);
    setError(null);
    setSuccessMessage(null);
    try {
      await claimsAPI.updateStatus(claimId, newStatus);
      setSuccessMessage(`Claim has been ${newStatus.toLowerCase()} successfully.`);
      await fetchDashboardData();
    } catch (err) {
      setError(err.message || `Failed to update claim status.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkReturned = async (itemId) => {
    if (!window.confirm('Confirm that this item has been returned and reunited?')) {
      return;
    }
    setActionLoadingId(`item-${itemId}`);
    setError(null);
    setSuccessMessage(null);
    try {
      await itemsAPI.markReturned(itemId);
      setSuccessMessage('Item status updated to RETURNED.');
      await fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to mark item as returned.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }
    setActionLoadingId(`delete-${itemId}`);
    try {
      await itemsAPI.delete(itemId);
      setSuccessMessage('Listing deleted successfully.');
      await fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to delete listing.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingIncomingCount = incomingClaims.filter(c => c.claim_status === 'PENDING').length;
  const returnedCount = myItems.filter(i => i.status === 'RETURNED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* User Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-8 h-8 text-brand-600" />
            Member Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Logged in as <strong className="text-slate-900">{user?.name}</strong> ({user?.email})
          </p>
        </div>

        <Link
          to="/post"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all self-start md:self-auto"
        >
          Post New Item
        </Link>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">My Listings</span>
            <Package className="w-5 h-5 text-brand-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{myItems.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Claims to Review</span>
            <Inbox className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{pendingIncomingCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Claims Submitted</span>
            <Send className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{outgoingClaims.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reunited Belongings</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{returnedCount}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('listings')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'listings'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          My Listings ({myItems.length})
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'incoming'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Incoming Claims ({incomingClaims.length})
          {pendingIncomingCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
              {pendingIncomingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'outgoing'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          My Claims ({outgoingClaims.length})
        </button>
      </div>

      {/* Tab 1: My Listings */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading your listings...</p>
            </div>
          ) : myItems.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 mb-1">No listings created yet</h3>
              <p className="text-xs text-slate-500 mb-4">You have not reported any lost or found items.</p>
              <Link
                to="/post"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
              >
                Post an Item
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Item</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 line-clamp-1">{item.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{item.location}</div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <TypeBadge type={item.type} />
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600 text-xs font-medium">
                        {item.category}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-xs">
                        {item.item_date}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/items/${item.id}`}
                            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {item.status !== 'RETURNED' && (
                            <button
                              onClick={() => handleMarkReturned(item.id)}
                              disabled={actionLoadingId === `item-${item.id}`}
                              className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                            >
                              Confirm Return
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={actionLoadingId === `delete-${item.id}`}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incoming Claims */}
      {activeTab === 'incoming' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading incoming claims...</p>
            </div>
          ) : incomingClaims.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 mb-1">No incoming claims yet</h3>
              <p className="text-xs text-slate-500">
                When other users submit claims or match reports on your items, they will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {incomingClaims.map((claim) => (
                <div key={claim.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                          Claim on item:
                        </span>
                        <Link
                          to={`/items/${claim.item_id}`}
                          className="font-bold text-slate-900 hover:text-brand-600 hover:underline"
                        >
                          {claim.item_title}
                        </Link>
                      </div>

                      <p className="text-xs text-slate-500">
                        Claimant: <strong className="text-slate-800">{claim.claimant_name}</strong> ({claim.claimant_email}) • {new Date(claim.claim_date).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          claim.claim_status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : claim.claim_status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {claim.claim_status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {claim.claim_status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                        {claim.claim_status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                        {claim.claim_status}
                      </span>
                    </div>
                  </div>

                  {/* Private Verification Message */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 text-xs text-slate-700">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Private Verification Message from Claimant:
                    </span>
                    <p className="whitespace-pre-line leading-relaxed">{claim.message}</p>
                  </div>

                  {/* Owner Action Buttons */}
                  {claim.claim_status === 'PENDING' && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleUpdateClaimStatus(claim.id, 'APPROVED')}
                        disabled={actionLoadingId === claim.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Claim
                      </button>

                      <button
                        onClick={() => handleUpdateClaimStatus(claim.id, 'REJECTED')}
                        disabled={actionLoadingId === claim.id}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Claim
                      </button>
                    </div>
                  )}

                  {claim.claim_status === 'APPROVED' && claim.item_status !== 'RETURNED' && (
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleMarkReturned(claim.item_id)}
                        disabled={actionLoadingId === `item-${claim.item_id}`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm Physical Handover & Mark as RETURNED
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Outgoing Claims */}
      {activeTab === 'outgoing' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading your submitted claims...</p>
            </div>
          ) : outgoingClaims.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 mb-1">No claims submitted</h3>
              <p className="text-xs text-slate-500 mb-4">
                You haven't claimed any items or reported matches yet.
              </p>
              <Link
                to="/found"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
              >
                Browse Found Items
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {outgoingClaims.map((claim) => (
                <div key={claim.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/items/${claim.item_id}`}
                          className="font-bold text-base text-slate-900 hover:text-brand-600 hover:underline flex items-center gap-1.5"
                        >
                          {claim.item_title}
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                      </div>

                      <p className="text-xs text-slate-500">
                        Listed by: <strong className="text-slate-800">{claim.owner_name}</strong> • Submitted {new Date(claim.claim_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          claim.claim_status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : claim.claim_status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {claim.claim_status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Your Verification Message:
                    </span>
                    <p className="whitespace-pre-line leading-relaxed">{claim.message}</p>
                  </div>

                  {claim.claim_status === 'APPROVED' && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Great news! The poster has approved your claim. Coordinate with {claim.owner_name} ({claim.owner_email}) for campus handover.
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
