import { cn } from "@/lib/utils";

type Props = { label: string; htmlFor?: string; required?: boolean; className?: string; hint?: React.ReactNode; children: React.ReactNode };

export const SHELL_INPUT = "h-11 rounded-[inherit] border-0 bg-transparent px-3 pt-3 pb-1 text-sm shadow-none outline-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent";

export function FieldShell({ label, htmlFor, required, className, hint, children }: Props) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="group/shell relative rounded-lg border border-input bg-card transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 has-[:disabled]:opacity-60 has-[[readonly]]:bg-muted/40">
        <label htmlFor={htmlFor} className="pointer-events-none absolute top-1.5 left-3 z-10 text-[10.5px] leading-none font-medium tracking-wide text-muted-foreground uppercase">
          {label}
          {required && <span className="ml-0.5 text-primary">*</span>}
        </label>
        {children}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
