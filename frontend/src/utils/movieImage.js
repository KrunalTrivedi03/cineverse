const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "duhc0vvqz";
const cloudImages = `https://res.cloudinary.com/${cloud}/image/upload/`;

export function movieImage(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const relative = path.replace(/^\/+/, "");
  // The old update endpoint prefixed Cloudinary public IDs with /uploads/.
  if (relative.startsWith("uploads/cineverse/")) {
    return cloudImages + relative.slice("uploads/".length);
  }
  if (relative.startsWith("uploads/")) {
    const apiOrigin = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
    return `${apiOrigin}/${relative}`;
  }
  return cloudImages + relative;
}
