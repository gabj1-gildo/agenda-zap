import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ClientProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-muted rounded mt-2 animate-pulse"></div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex gap-2 border-b border-border pb-2">
          <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
          <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
          <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
        </div>
        <div className="h-64 w-full bg-muted rounded-xl animate-pulse mt-6"></div>
      </div>
    </div>
  );
}
