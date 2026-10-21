import { setCatalogueActiveAction } from "@/app/actions";

export const bundledImages = [
  { value: "/images/football.jpg", label: "Football" },
  { value: "/images/basketball.jpg", label: "Basketball" },
  { value: "/images/dodgeball.jpg", label: "Dodgeball" },
  { value: "/images/tennis.jpg", label: "Tennis" },
  { value: "/images/hero-ground.jpg", label: "Stadium lights" },
  { value: "/images/infinity-sports/court_3x3.jpeg", label: "Infinity Sports · 3x3 basketball" },
  { value: "/images/infinity-sports/court_basketball_ac.jpeg", label: "Infinity Sports · indoor basketball" },
  { value: "/images/infinity-sports/court_padel.jpeg", label: "Infinity Sports · padel" },
  { value: "/images/infinity-sports/court_volleyball.jpeg", label: "Infinity Sports · volleyball" },
];

export function ImageField({ defaultValue, idPrefix = "catalogue-image" }: { defaultValue?: string; idPrefix?: string }) {
  const bundled = bundledImages.some(i => i.value === defaultValue);
  return <div className="form-field"><label htmlFor={`${idPrefix}-image-preset`}>Choose a PlayUp image</label>
    <select id={`${idPrefix}-image-preset`} name="imagePreset" defaultValue={bundled ? defaultValue : ""}>
      <option value="">Custom link (below)</option>{bundledImages.map(i => <option value={i.value} key={i.value}>{i.label}</option>)}
    </select>
    <label htmlFor={`${idPrefix}-image-url`} className="admin-image-url-label">Or enter an image link</label>
    <input className="input" id={`${idPrefix}-image-url`} name="imageUrl" defaultValue={bundled ? "" : defaultValue || ""} placeholder="https://images.unsplash.com/…" style={{ marginTop: 8 }}/>
  </div>;
}

export function ActiveToggle({ table, id, active, itemName }: { table: "activities" | "academies" | "venues"; id: string; active: boolean; itemName?: string }) {
  const action = active ? "Hide" : "Show";
  const type = table === "academies" ? "academy" : table === "activities" ? "activity" : "venue";
  return <form action={setCatalogueActiveAction}><input type="hidden" name="table" value={table}/><input type="hidden" name="id" value={id}/><input type="hidden" name="active" value={active ? "0" : "1"}/><button className="text-button" type="submit" aria-label={`${action} ${itemName || type}`}>{action}</button></form>;
}
