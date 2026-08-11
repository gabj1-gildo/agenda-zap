export function AppointmentsSkeleton() {
  return (
    <div className="animate-pulse space-y-8 mt-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl w-full border border-border"></div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="h-10 bg-muted rounded-xl w-64 border border-border"></div>
      </div>
      <div className="h-64 bg-muted rounded-2xl w-full border border-border"></div>
    </div>
  );
}
