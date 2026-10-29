export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-ivory-300 border-t-forest-700 animate-spin" />
        </div>
        <p className="text-charcoal-500 text-sm animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}

