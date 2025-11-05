// src/js/utils/seo.js
export function updateSEO({ title, description }) {
  if (title) document.title = `${title} | ShopSmart`;
  if (description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
  }
}
