import { Textarea } from "@/components/ui/textarea";
import { FieldShell } from "@/components/form/field-shell";

type Props = React.ComponentProps<typeof Textarea> & { label: string; className?: string; hint?: React.ReactNode };

export function TextareaField({ label, id, name, className, hint, required, ...props }: Props) {
  const fieldId = id ?? name;
  return (
    <FieldShell label={label} htmlFor={fieldId} required={required} className={className} hint={hint}>
      <Textarea id={fieldId} name={name} required={required} {...props} className="min-h-11 rounded-[inherit] border-0 bg-transparent px-3 pt-5 pb-2 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent" />
    </FieldShell>
  );
}
