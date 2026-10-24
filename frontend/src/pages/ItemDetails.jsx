import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemsAPI, claimsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TypeBadge, StatusBadge } from '../components/StatusBadge';
import {
  MapPin,
  Calendar,
  Tag,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Send,
  Loader2,
  ImageOff,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [claimError, setClaimError] = useState(null);

  // Owner action loading state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await itemsAPI.getById(id);
      if (response.data?.item) {
        setItem(response.data.item);
      }
    } catch (err) {
      setError(err.message || 'Item not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimError(null);

    if (!user) {
      navigate('/login', { state: { from: `/items/${id}` } });
      return;
    }

    if (!claimMessage.trim() || claimMessage.trim().length < 5) {
      setClaimError('Please provide descriptive verification details (at least 5 characters).');
      return;
    }

    setClaimLoading(true);
    try {
      const response = await claimsAPI.submitClaim(id, { message: claimMessage });
      setClaimSuccess(response.data?.message || 'Your claim has been submitted to the owner.');
      setClaimMessage('');
      // Refresh item state to update status to CLAIM_PENDING if changed
      await fetchItemDetails();
      setTimeout(() => setShowClaimModal(false), 2000);
    } catch (err) {
      setClaimError(err.message || 'Failed to submit claim.');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleMarkReturned = async () => {
    if (!window.confirm('Confirm that this item has been returned and safely reunited?')) {
      return;
    }

    setActionLoading(true);
    try {
      await itemsAPI.markReturned(id);
      setActionMessage('Item status successfully updated to RETURNED.');
      await fetchItemDetails();
    } catch (err) {
      setError(err.message || 'Failed to update item status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing permanently?')) {
      return;
    }

    setActionLoading(true);
    try {
      await itemsAPI.delete(id);
      navigate(item.type === 'LOST' ? '/lost' : '/found');
    } catch (err) {
      setError(err.message || 'Failed to delete listing.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Item Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">{error || 'This listing may have been deleted.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === item.user_id;
  const isReturned = item.status === 'RETURNED';

  const formattedDate = item.item_date
    ? new Date(item.item_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Date not specified';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <Link
        to={item.type === 'LOST' ? '/lost' : '/found'}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {item.type === 'LOST' ? 'Lost Items' : 'Found Items'}
      </Link>

      {/* Notifications */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Item Card Layout */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Image Showcase */}
        <div className="relative bg-slate-100 flex items-center justify-center min-h-[320px] md:min-h-[460px] p-4">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="max-h-[420px] w-auto max-w-full object-contain rounded-2xl shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement.querySelector('.image-fallback')?.classList.remove('hidden');
              }}
            />
          ) : null}

          <div className={`image-fallback flex flex-col items-center justify-center text-slate-400 ${item.image_url ? 'hidden' : ''}`}>
            <div className="w-16 h-16 rounded-full bg-slate-200/80 flex items-center justify-center mb-3">
              <ImageOff className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-medium">No photograph attached</p>
            <p className="text-xs text-slate-400 mt-1">Listing relies on text description</p>
          </div>

          <div className="absolute top-4 left-4">
            <TypeBadge type={item.type} />
          </div>
          <div className="absolute top-4 right-4">
            <StatusBadge status={item.status} />
          </div>
        </div>

        {/* Content & Actions */}
        <div className="p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  <Tag className="w-3.5 h-3.5 text-brand-600" />
                  {item.category}
                </span>
                <span className="text-xs text-slate-400">• Posted by {item.owner_name}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                {item.title}
              </h1>
            </div>

            {/* Metadata Pills */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Campus Location
                  </span>
                  <span className="font-medium text-slate-800">{item.location}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700 pt-2 border-t border-slate-200/60">
                <Calendar className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Date {item.type === 'LOST' ? 'Lost' : 'Found'}
                  </span>
                  <span className="font-medium text-slate-800">{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700 pt-2 border-t border-slate-200/60">
                <User className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Posted By
                  </span>
                  <span className="font-medium text-slate-800">{item.owner_name}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Detailed Description
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {item.description}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 mt-6 border-t border-slate-100">
            {isReturned ? (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-center">
                <CheckCircle2 className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="font-bold text-sm">Item Successfully Reunited</p>
                <p className="text-xs text-purple-700 mt-0.5">
                  This listing is marked as RETURNED and closed for new claims.
                </p>
              </div>
            ) : isOwner ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>You are the author of this listing. Manage claims in your Dashboard.</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleMarkReturned}
                    disabled={actionLoading}
                    className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Returned
                  </button>

                  <Link
                    to="/dashboard"
                    className="flex-1 py-3 px-4 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-sm transition-colors text-center"
                  >
                    Review Claims
                  </Link>

                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="p-3 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                    title="Delete listing"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {item.type === 'FOUND' ? (
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>This Is Mine (Claim Item)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>I Found This (Report Match)</span>
                  </button>
                )}
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Your verification message is sent directly to the poster and is never published publicly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Claim / Response Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold ${
                  item.type === 'FOUND' ? 'bg-emerald-600' : 'bg-brand-600'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {item.type === 'FOUND' ? 'Claim Your Belonging' : 'Report Possible Match'}
                  </h3>
                  <p className="text-xs text-slate-500">Item: {item.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {claimSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Claim Submitted!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">{claimSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                {claimError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{claimError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {item.type === 'FOUND'
                      ? 'Private Ownership Verification Details *'
                      : 'Match Details & Handover Instructions *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    placeholder={
                      item.type === 'FOUND'
                        ? 'Provide specific identifying marks not visible in photos (e.g. phone wallpaper, serial number, student ID name inside, stickers, keyring color)...'
                        : 'Explain where and when you found it, condition, and how the owner can safely verify and collect it...'
                    }
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Keep your contact information private until the poster approves your claim.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                      item.type === 'FOUND'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-brand-600 hover:bg-brand-700'
                    } disabled:opacity-50`}
                  >
                    {claimLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Claim</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
