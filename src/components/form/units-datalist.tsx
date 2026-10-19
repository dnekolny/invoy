import { UNITS } from "@/lib/units";

export const UNITS_LIST_ID = "invoy-units";

export function UnitsDatalist() {
  return (
    <datalist id={UNITS_LIST_ID}>
      {UNITS.map((u) => (
        <option key={u} value={u} />
      ))}
    </datalist>
  );
}
