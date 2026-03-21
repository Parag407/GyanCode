import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, AlertTriangle, PlayCircle, Trophy } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center relative">
      <div className="gradient-blob"></div>
      <div className="gradient-blob-2"></div>

      <div className="relative z-10 text-center space-y-8 max-w-lg animate-fade-in-up">
        <div className="relative">
          <h1 className="text-[8rem] md:text-[10rem] font-black gradient-text leading-none select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle size={48} className="text-amber-400/30" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight">Page Not Found</h2>
          <p className="text-gray-400 leading-relaxed max-w-sm mx-auto">
            Looks like this route doesn't exist. It may have been moved, deleted, or you may have followed a broken link.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link to="/" className="btn-primary text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
            <Home size={16} /> Go Home
          </Link>
          <Link to="/playground" className="px-4 sm:px-6 py-3 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 text-gray-400 hover:text-white">
            <PlayCircle size={16} /> Try Playground
          </Link>
          <Link to="/leaderboard" className="px-4 sm:px-6 py-3 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 text-gray-400 hover:text-white">
            <Trophy size={16} /> Leaderboard
          </Link>
        </div>

        <button onClick={() => window.history.back()}
          className="text-sm text-gray-500 hover:text-primary-light transition-colors flex items-center gap-1.5 mx-auto">
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    </div>
  );
}
