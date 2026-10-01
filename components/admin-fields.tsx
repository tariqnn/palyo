import { setCatalogueActiveAction } from "@/app/actions";

export const bundledImages = [
  { value: "/images/football.jpg", label: "Football" },
  { value: "/images/basketball.jpg", label: "Basketball" },
  { value: "/images/dodgeball.jpg", label: "Dodgeball" },
  { value: "/images/tennis.jpg", label: "Tennis" },
  { value: "/images/hero-ground.jpg", label: "Stadium lights" },
];

export function ImageField({ defaultValue }: { defaultValue?: string }) {
  const bundled = bundledImages.some(i => i.value === defaultValue);
  return <div className="form-field"><label>Image</label>
    <select name="imagePreset" defaultValue={bundled ? defaultValue : ""} aria-label="Choose a PlayUp image">
      <option value="">Custom link (below)</option>{bundledImages.map(i => <option value={i.value} key={i.value}>{i.label}</option>)}
    </select>
    <input className="input" name="imageUrl" defaultValue={bundled ? "" : defaultValue || ""} placeholder="https://images.unsplash.com/… (only if no PlayUp image is chosen)" style={{ marginTop: 8 }}/>
  </div>;
}

export function ActiveToggle({ table, id, active }: { table: "activities" | "academies" | "venues"; id: string; active: boolean }) {
  return <form action={setCatalogueActiveAction}><input type="hidden" name="table" value={table}/><input type="hidden" name="id" value={id}/><input type="hidden" name="active" value={active ? "0" : "1"}/><button className="text-button" type="submit">{active ? "Hide" : "Show"}</button></form>;
}
