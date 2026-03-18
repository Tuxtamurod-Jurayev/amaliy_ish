export function formatDate(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function relativeDeadline(value: string) {
  const target = new Date(value).getTime();
  const now = Date.now();
  const diff = target - now;
  const day = 1000 * 60 * 60 * 24;
  const days = Math.round(diff / day);

  if (days === 0) return "Bugun";
  if (days > 0) return `${days} kun qoldi`;
  return `${Math.abs(days)} kun o'tgan`;
}

export function generateId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

export function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
