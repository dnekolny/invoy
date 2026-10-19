import { Input } from "@/components/ui/input";
import { FieldShell, SHELL_INPUT } from "@/components/form/field-shell";

type Props = React.ComponentProps<typeof Input> & { label: string; className?: string; hint?: React.ReactNode };

export function Field({ label, id, name, className, hint, required, ...props }: Props) {
  const fieldId = id ?? name;
  return (
    <FieldShell label={label} htmlFor={fieldId} required={required} className={className} hint={hint}>
      <Input id={fieldId} name={name} required={required} {...props} className={SHELL_INPUT} />
    </FieldShell>
  );
}
