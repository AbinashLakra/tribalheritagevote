import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-7xl font-bold text-forest-700">404</p>
          <h1 className="text-2xl font-bold text-charcoal-900">
            Page not found
          </h1>
          <p className="text-charcoal-500">
            The page you are looking for does not exist or has been moved. Let us
            guide you back to exploring incredible Adivasi art.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-forest-700 text-white rounded-lg hover:bg-forest-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <Link
            href="/artists"
            className="inline-flex items-center gap-2 px-6 py-3 border border-forest-300 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse artists
          </Link>
        </div>
      </div>
    </div>
  );
}

