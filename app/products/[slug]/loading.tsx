export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-brand-cream animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="space-y-3">
            <div className="aspect-[4/5] rounded-2xl bg-brand-light/60 w-full" />
          </div>
          <div className="space-y-4 pt-2">
            <div className="h-8 w-3/4 bg-brand-light/80 rounded" />
            <div className="h-6 w-32 bg-brand-light/80 rounded" />
            <div className="h-12 w-full rounded-xl bg-brand-light/60 mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}