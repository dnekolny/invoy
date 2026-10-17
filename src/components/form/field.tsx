import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Input> & { label: string; className?: string };

export function Field({ label, id, name, className, ...props }: Props) {
  const fieldId = id ?? name;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} name={name} {...props} />
    </div>
  );
}
