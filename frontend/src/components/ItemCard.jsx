import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, ArrowRight, ImageOff } from 'lucide-react';
import { TypeBadge, StatusBadge } from './StatusBadge';

export default function ItemCard({ item }) {
  const {
    id,
    title,
    description,
    category,
    type,
    image_url,
    location,
    item_date,
    status
  } = item;

  // Format date cleanly
  const formattedDate = item_date
    ? new Date(item_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Date not specified';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Image Container with Badges */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.querySelector('.image-fallback')?.classList.remove('hidden');
            }}
          />
        ) : null}

        <div className={`image-fallback flex flex-col items-center justify-center text-slate-400 p-4 ${image_url ? 'hidden' : ''}`}>
          <div className="w-12 h-12 rounded-full bg-slate-200/60 flex items-center justify-center mb-2">
            <ImageOff className="w-6 h-6 text-slate-400" />
          </div>
          <span className="text-xs font-medium text-slate-400">No photo provided</span>
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3">
          <TypeBadge type={type} />
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
              <Tag className="w-3 h-3 text-brand-600" />
              {category}
            </span>
          </div>

          <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-2">
            {title}
          </h3>

          <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="space-y-1.5 text-xs text-slate-500 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <Link
            to={`/items/${id}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-brand-700 bg-brand-50 hover:bg-brand-600 hover:text-white transition-all duration-200"
          >
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
