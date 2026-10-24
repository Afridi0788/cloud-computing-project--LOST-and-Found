import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { itemsAPI } from '../services/api';
import {
  AlertCircle,
  CheckCircle2,
  Upload,
  Calendar,
  MapPin,
  Tag,
  FileText,
  Loader2,
  X,
  ImageIcon
} from 'lucide-react';

const CATEGORIES = [
  'Electronics',
  'Wallets & Bags',
  'Documents & IDs',
  'Keys',
  'Jewellery',
  'Clothing',
  'Books & Stationery',
  'Other'
];

export default function PostItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'FOUND' ? 'FOUND' : 'LOST';

  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState('');
  const [itemDate, setItemDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image exceeds the 5MB file size limit.');
      return;
    }

    // Check type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are supported.');
      return;
    }

    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !location.trim() || !itemDate) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('location', location.trim());
      formData.append('item_date', itemDate);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await itemsAPI.create(formData);
      if (response.data?.item?.id) {
        navigate(`/items/${response.data.item.id}`);
      } else {
        navigate(type === 'LOST' ? '/lost' : '/found');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        {/* Title Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Publish a Campus Listing
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Provide descriptive details to help reunite owners with their items quickly.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Type Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Listing Category *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('LOST')}
                className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  type === 'LOST'
                    ? 'border-rose-600 bg-rose-50/80 text-rose-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-rose-600" />
                I Lost Something
              </button>

              <button
                type="button"
                onClick={() => setType('FOUND')}
                className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  type === 'FOUND'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                I Found Something
              </button>
            </div>
          </div>

          {/* Item Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Item Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fossil Leather Wallet, Apple AirPods Pro, Student ID Card"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Item Category *
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Date {type === 'LOST' ? 'Lost' : 'Found'} *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={itemDate}
                  onChange={(e) => setItemDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Approximate Location */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Approximate Campus Location *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Central Library 2nd Floor reading table, CS Department lawn bench"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe color, brand, condition, and any distinguishing markings. (Do not post confidential codes or passwords!)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed"
            />
          </div>

          {/* Image Upload with AWS S3 Support */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Photograph (Optional - Uploaded to Amazon S3)
            </label>
            
            {imagePreview ? (
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 max-h-64 flex items-center justify-center group">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="max-h-64 object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-md"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 cursor-pointer bg-slate-50/50 hover:bg-brand-50/30 transition-colors">
                <Upload className="w-8 h-8 text-brand-600 mb-2" />
                <span className="text-sm font-semibold text-slate-700">
                  Click to select photo or drag and drop
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  JPG, PNG, or WebP up to 5MB (stored securely in AWS S3)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-base transition-all shadow-md flex items-center justify-center gap-2 ${
              type === 'LOST'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting & Uploading to S3...</span>
              </>
            ) : (
              <>
                <span>Publish {type === 'LOST' ? 'Lost Item Report' : 'Found Item Listing'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
