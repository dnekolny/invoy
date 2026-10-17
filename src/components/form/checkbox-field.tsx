import { Label } from "@/components/ui/label";

type Props = { name: string; label: string; defaultChecked?: boolean; checked?: boolean; onChange?: (v: boolean) => void };

export function CheckboxField({ name, label, defaultChecked, checked, onChange }: Props) {
  return (
    <Label className="flex items-center gap-2 font-normal">
      <input
        type="checkbox"
        name={name}
        value="true"
        className="size-4 accent-primary"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
      />
      {label}
    </Label>
  );
}
