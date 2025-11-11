import { PAGE_Count } from "../config";
import icons from "../../img/icon.svg";

export const ProductCard = (cartData) => {
  if (!cartData) return "";

  // Precompute safe variables
  const mainPhoto =
    cartData.photos?.find((p) => p.main)?.url || cartData.photos?.[0]?.url || "img/placeholder.png";

  const productName = runCateText(cartData.name || "Unnamed Product");
  const firstVariant = cartData.variants?.[0] || {};
  const isCustomizable = cartData.variants?.length > 1;
  const offerText = firstVariant.offerPrice ? `₹${firstVariant.offerPrice}.00 Off` : "";

  // keep class names the same — only fix structure + accessibility
  const value = `
    <section class="product-container" aria-label="${productName}">
      <a href="/moms-salty-fish/item/${cartData.slug}" data-id="${cartData._id}">
        <span class="product-img">
          <img 
            src="${mainPhoto}" 
            alt="${productName}" 
            loading="lazy"
          />
        </span>

        ${offerText ? `<span class="product-offer-price">${offerText}</span>` : ""}

        <span class="product-item-trend" aria-label="Trending Product">Trending</span>

        <section class="product-item-name-section">
          <span class="product-item-name">${productName}</span>
          <span class="product-item-rating">
            <svg class="icon" width="24" height="24" aria-hidden="true">
              <use href="${icons}#icon-star"></use>
            </svg>
            Rating 4.7
          </span>
        </section>

        <span class="product-item-details-main">
          <section class="product-itme-details">
            <span class="product-itme-price">
              Starts from ₹${firstVariant.price ?? "0"}
            </span>
          </section>
        </span>
      </a>

      <section class="product-item-action">
        <button 
          class="product-item-btn" 
          data-action="${isCustomizable ? "action" : "add"}"
          aria-label="${isCustomizable ? "Customize Product" : "Add to Cart"}"
        >
          Add
        </button>
        <span class="product-item-add-coust">
          ${isCustomizable ? "Customizable" : ""}
        </span>
      </section>
    </section>
  `;

  return value;
};

// unchanged pagination helper
export const paginateArray = (arr, perPage = PAGE_Count) => {
  if (!Array.isArray(arr)) return [];
  const totalPages = Math.ceil(arr.length / perPage);
  const pages = [];

  for (let i = 0; i < totalPages; i++) {
    const start = i * perPage;
    const end = start + perPage;
    pages.push(arr.slice(start, end));
  }

  return pages;
};

// unchanged truncation helper
function runCateText(text, maxLength = 19) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
