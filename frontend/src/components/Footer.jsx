import React from 'react';
import { Compass, Cloud, Database, Server, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Campus<span className="text-brand-400">Find</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              A secure, cloud-hosted Lost and Found management platform for college campuses.
              Helping students and faculty safely reconnect with misplaced belongings through verified claims.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] font-medium bg-slate-800 text-brand-300 px-2.5 py-1 rounded-md border border-slate-700">
                React + Vite
              </span>
              <span className="text-[11px] font-medium bg-slate-800 text-emerald-300 px-2.5 py-1 rounded-md border border-slate-700">
                Node.js & Express
              </span>
              <span className="text-[11px] font-medium bg-slate-800 text-amber-300 px-2.5 py-1 rounded-md border border-slate-700">
                MySQL on EC2
              </span>
              <span className="text-[11px] font-medium bg-slate-800 text-sky-300 px-2.5 py-1 rounded-md border border-slate-700">
                Amazon S3
              </span>
              <span className="text-[11px] font-medium bg-slate-800 text-purple-300 px-2.5 py-1 rounded-md border border-slate-700">
                Docker & CloudWatch
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Explore Listings
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/lost" className="hover:text-white transition-colors">
                  Lost Items Directory
                </Link>
              </li>
              <li>
                <Link to="/found" className="hover:text-white transition-colors">
                  Found Items Directory
                </Link>
              </li>
              <li>
                <Link to="/post" className="hover:text-white transition-colors">
                  Report a Lost Item
                </Link>
              </li>
              <li>
                <Link to="/post" className="hover:text-white transition-colors">
                  Submit a Found Item
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  User Dashboard & Claims
                </Link>
              </li>
            </ul>
          </div>

          {/* Cloud Architecture Highlights */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Cloud Computing
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Server className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                <span>Backend Containerized on AWS EC2 with Nginx</span>
              </div>
              <div className="flex items-start gap-2">
                <Database className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Relational MySQL with Strict Foreign Keys & Transactions</span>
              </div>
              <div className="flex items-start gap-2">
                <Cloud className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <span>Amazon S3 Bucket with Private Objects & Presigned URLs</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>JWT Authentication & CloudWatch Metric Alarms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CampusFind • College Cloud Computing Project Demonstration.</p>
          <p className="flex items-center gap-1.5">
            Designed for secure campus item recovery
          </p>
        </div>
      </div>
    </footer>
  );
}
