export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-brand-cream animate-pulse">
      <div className="w-full h-48 sm:h-64 bg-brand-light/60" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-56 shrink-0 space-y-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="h-8 w-full rounded bg-brand-light/60" />
            ))}
          </aside>
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] rounded-xl bg-brand-light/60" />
                  <div className="h-4 w-3/4 bg-brand-light/80 rounded" />
                  <div className="h-3 w-1/2 bg-brand-light/60 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
