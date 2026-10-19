import { ChevronDown } from "lucide-react";
import { FieldShell } from "@/components/form/field-shell";

type Props = React.ComponentProps<"select"> & { label: string; options: { value: string; label: string }[] };

export const SHELL_SELECT = "h-11 w-full appearance-none rounded-[inherit] bg-transparent pr-8 pl-3 pt-3 pb-1 text-sm outline-none";

export function NativeSelect({ label, id, name, options, className, required, ...props }: Props) {
  const fieldId = id ?? name;
  return (
    <FieldShell label={label} htmlFor={fieldId} required={required} className={className}>
      <select id={fieldId} name={name} required={required} className={SHELL_SELECT} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </FieldShell>
  );
}
