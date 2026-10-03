export default function HomePageLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream animate-pulse">
      <div className="w-full h-[480px] sm:h-[600px] bg-brand-light/60" />
      <div className="py-10 border-b border-brand-border/60 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-8 space-y-2">
            <div className="h-3 w-28 bg-brand-light/80 rounded mx-auto" />
            <div className="h-7 w-64 bg-brand-light/80 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[0,1,2,3,4,5].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-brand-light/60" />
            ))}
          </div>
        </div>
      </div>
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-7 w-48 bg-brand-light/80 rounded mb-6 mx-auto" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0,1,2,3,4,5,6,7].map((i) => (
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
  );
}
