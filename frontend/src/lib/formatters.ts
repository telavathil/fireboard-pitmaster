export function getMeatLabel(meat: string) {
  if (!meat) return "";
  return meat.charAt(0).toUpperCase() + meat.slice(1).toLowerCase();
}
