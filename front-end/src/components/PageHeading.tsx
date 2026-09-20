import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeading({ title, description, children }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-[27px] font-bold tracking-tight leading-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}