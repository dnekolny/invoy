import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"select"> & { label: string; options: { value: string; label: string }[] };

export function NativeSelect({ label, id, name, options, className, ...props }: Props) {
  const fieldId = id ?? name;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <select
        id={fieldId}
        name={name}
        className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
