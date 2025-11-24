import { $, $$ } from "../utils/dom.js";
import icons from "../../img/icon.svg";
import view from "./view";

class SingleProductView extends view {
  /* -------------------------
     Public API (rendering)
     ------------------------- */

  _generateMarkup() {
    return this._data.replaceAll("%{icons}%", icons);
  }

  /* Backwards-compatible name + new preferred name */
  _prepperPage() {
    return this._preparePage();
  }

  _preparePage() {
    if (!this._subData) return;
    const { productInfo, apiUrl, callFn, cartAdded } = this._subData;

    // Render static parts
    this._setMainImage(productInfo);
    this._renderSmallImages(productInfo);
    this._renderText(".items-content-main-header h1", productInfo.name);
    this._renderPrice(productInfo.variants?.[0]);
    this._renderVariantButtons(productInfo.variants || []);
    this._renderDescription(productInfo.description);
    this._renderReviewSummary(productInfo.userReviews);
    this._renderReviewGraph(productInfo.userReviews);
    this._renderUserComments(productInfo.userReviews);
    this._renderAllUserReview(productInfo.userReviews);

    // Wire up interactive behavior (single-time init)
    this._initInteractionHandlers(productInfo.id, productInfo.variants, apiUrl, callFn, cartAdded);
  }

  /* -------------------------
     Helpers: rendering small parts
     ------------------------- */

  _setMainImage({ photos, sortName } = {}) {
    const img = $(".items-main-image-big img");
    if (!img || !photos?.length) return;
    const main = photos.find((p) => p.main) ?? photos[0];
    img.src = main.url;
    img.alt = sortName || "Product image";
  }

  _renderSmallImages({ photos } = {}) {
    const ul = $(".items-main-image-small-ul");
    if (!ul || !photos?.length) return;
    ul.innerHTML = photos
      .map(
        (src, i) => `<li class="items-main-image-small-li">
          <img class="items-main-image-small-img ${src.main === true ? "active" : ""}" src="${src.url}" alt="Thumbnail ${i + 1}"/>
        </li>`
      )
      .join("");
  }

  _renderText(selector, text) {
    const el = $(selector);
    if (el) el.textContent = text ?? "";
  }

  _renderPrice(variant) {
    if (!variant) return;
    const priceEl = $(".items-content-main-price");
    if (!priceEl) return;
    const { MRP, price } = variant;
    const offer = this._findPercentageOffer(MRP, price);
    priceEl.innerHTML = `
      <span class="items-content-main-price-mrp"><del>Rs. ${MRP}.00</del> |</span>
      <span class="items-content-main-price-selling-price"><b>Rs. ${price}.00</b> |</span>
      <span class="items-content-main-price-offer">Offer ${offer}%</span>`;
  }

  _renderVariantButtons(variants = []) {
    const container = $(".items-content-main-grams-btn");
    if (!container || !variants.length) return;

    // use dataset weight on each button (string)
    container.innerHTML = variants
      .map(
        ({ weight, price, MRP }) =>
          `<button type="button" class="items-content-main-grams-btn-variant" data-quantity="${weight.value}" data-price="${price}" data-mrp="${MRP}">${weight.value} grams</button>`
      )
      .join("");

    // Initialize query params (first variant and quantity)
    this._updateQueryParam("weight", String(variants[0].weight.value));
    this._updateQueryParam("quantity", 1);
  }

  _renderDescription(descriptions = []) {
    const container = $(".items-content-main-product-container");
    if (!container || !descriptions.length) return;

    const markup = descriptions
      .map(({ header, content }) => {
        const items = content?.split("%{li}%").filter((txt) => txt.trim().length > 2);
        return items?.length > 1
          ? `<section class="items-content-main-product">
              <h3 class="items-content-main-product-header">${header}</h3>
              <ul class="items-content-main-product-para-ul">
                ${items.map((li) => `<li>${li.trim()}</li>`).join("")}
              </ul>
            </section>`
          : `<section class="items-content-main-product">
              ${header ? `<h3 class="items-content-main-product-header">${header}</h3>` : ""}
              <blockquote class="items-content-main-product-para">${content}</blockquote>
            </section>`;
      })
      .join("");

    container.innerHTML = `${markup}
      <section class="items-content-main-product">
        <blockquote class="items-content-main-product-para">
          <b>More details and recipe ideas:</b>
          <a href="">Visit this link →</a>
        </blockquote>
      </section>`;
  }

  _renderReviewSummary(reviews = []) {
    const el = $(".items-reviews-container-rating");
    if (!el) return;
    if (!reviews.length) return (el.innerHTML = "<span>No reviews yet</span>");

    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avg = this._truncateToOneDecimal(total / reviews.length);
    const withComment = reviews.filter((r) => r.comment?.trim()).length;

    el.innerHTML = `
      <span class="items-reviews-container-rating-value">
        ${avg}
        <sup>
          <svg class="icon" width="20" height="24">
            <use href="${icons}#icon-star"></use>
          </svg>
        </sup>
      </span>
      <span class="items-reviews-container-rating-total">${reviews.length} Ratings,</span>
      <span class="items-reviews-container-total-reviews">${withComment} Reviews</span>`;
  }

  _renderReviewGraph(reviews = []) {
    if (!reviews?.length) return;
    const count = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(({ rating }) => (count[rating] = (count[rating] || 0) + 1));
    const total = reviews.length || 1;

    for (const r in count) {
      const el = $(`.reviews-container-graf-sec-span-${r}`);
      if (el) el.style.width = `${((count[r] / total) * 100).toFixed(1)}%`;
    }
  }

  _renderUserComments(reviews = []) {
    const container = $(".items-reviews-users");
    if (!container) return;

    container.innerHTML = ""; // clear first
    reviews
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 2)
      .forEach(({ id, userProfile, userName, rating, updatedAt, comment, commentImage }) => {
        const images = Array.isArray(commentImage) ? commentImage : commentImage ? [commentImage] : [];
        const date = new Date(updatedAt);
        const options = { day: "2-digit", month: "short", year: "numeric" };
        const formattedDate = date.toLocaleDateString("en-GB", options).replace(",", "");
        const markup = `<div class="items-reviews-user-reviews" data-user-comment-id="${id}">
          <section class="items-reviews-user-reviews-img-span">
            <img src="${userProfile}" alt="User Profile Image" class="items-reviews-user-reviews-img"/>
            <span class="items-reviews-user-reviews-name">${userName}</span>
            <span class="items-reviews-user-reviews-name-verified">Verified
              <svg class="icon" width="20" height="24">
                <use href="${icons}#icon-tick"></use>
              </svg>
            </span>
          </section>
          <section class="items-reviews-user-rating">
            <span class="items-reviews-user-rating-value">${rating}
              <svg class="icon" width="20" height="24"><use href="${icons}#icon-star"></use></svg>
            </span>
            <span class="items-reviews-user-rating-dot"></span>
            <span class="items-reviews-user-rating-date">Posted on ${formattedDate}</span>
          </section>
          <section class="items-reviews-user-rating-message">
            <p>${comment}</p>
            <span class="items-reviews-user-rating-message-img">
              ${images.map((img) => `<img src="${img}" alt="user-comment-img"/>`).join("")}
            </span>
          </section>
        </div>`;
        container.insertAdjacentHTML("beforeend", markup);
      });
  }

  _renderAllUserReview(reviews = []) {
    const container = $(".user-review-container");
    if (!container) return;
    container.innerHTML = "";

    reviews
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .forEach(({ id, userProfile, userName, rating, updatedAt, comment, commentImage }) => {
        const images = Array.isArray(commentImage) ? commentImage : commentImage ? [commentImage] : [];
        const date = new Date(updatedAt);
        const options = { day: "2-digit", month: "short", year: "numeric" };
        const formattedDate = date.toLocaleDateString("en-GB", options).replace(",", "");
        const markup = `<div class="items-reviews-user-reviews">
            <section class="items-reviews-user-reviews-img-span">
              <img src="${userProfile}" alt="${userName}" class="items-reviews-user-reviews-img"/>
              <span class="items-reviews-user-reviews-name">${userName}</span>
              <span class="items-reviews-user-reviews-name-verified">Verified
                <svg class="icon" width="20" height="24"><use href="${icons}#icon-tick"></use></svg>
              </span>
            </section>
            <section class="items-reviews-user-rating">
              <span class="items-reviews-user-rating-value">${rating}<svg class="icon" width="20" height="24"><use href="${icons}#icon-star"></use></svg></span>
              <span class="items-reviews-user-rating-dot"></span>
              <span class="items-reviews-user-rating-date">Posted on ${formattedDate}</span>
            </section>
            <section class="items-reviews-user-rating-message">
              <p>${comment}</p>
              <span class="items-reviews-user-rating-message-img">
                ${images.map((img) => `<img src="${img}" alt="user-comment-img"/>`).join("")}
              </span>
            </section>
          </div>`;
        container.insertAdjacentHTML("beforeend", markup);
      });
  }



   _helperFindAlreadyInCart(cartAdded = [], btn, weight) {

    const quantityContainer = this._nodes.quantityContainer;

  const alreadyInCart = cartAdded.some(
    (item) => {
      console.log("Comparing cart item weight:", item.weight, weight);
      return String(item.weight) === String(weight)}
  );

  console.log("Already in cart check:", alreadyInCart, weight);
  if (alreadyInCart) {
    btn.textContent = "GO TO CART";
    btn.checkBtn = "true";
    if (quantityContainer) quantityContainer.style.display = "none";
    return true;
  } else {
    btn.textContent = "ADD TO CART";
      btn.checkBtn = "false";
    if (quantityContainer) quantityContainer.style.display = "block";
    
    return false;
  }
}


  /* -------------------------
     Interaction wiring (single place)
     ------------------------- */

  _initInteractionHandlers(id, variants = [], apiUrl, callFn, cartAdded) {

    console.log("Init interaction handlers for single product view", cartAdded);
    // Cache DOM nodes we need
    this._nodes = {
      fullImage: $(".items-main-image-big img"),
      thumbs: $$(".items-main-image-small-li img"),
      reviewBtn: $(".items-reviews-users-btn"),
      reviewPanel: $("#user-review"),
      closeBtn: $(".user-review-close-btn"),
      overlay: $("#reviews-container"),
      priceVariantsContainer: $(".items-content-main-grams-btn"),
      priceVariantButtons: $$(".items-content-main-grams-btn-variant"),
      quantityValue: $(".items-content-main-quantity-value"),
      quantityBtns: $$(".items-content-main-quantity-btn-less-add"),
      addCartBtn: $(".items-content-main-btn-addcart"),
      quantityContainer: $(".items-content-main-quantity"),
    };

    // Setup thumbs click (if present)
    this._nodes.thumbs.forEach((img) =>
      img.addEventListener("click", () => {
        if (!this._nodes.fullImage) return;
        this._nodes.fullImage.src = img.src;
        this._nodes.thumbs.forEach((t) => t.classList.remove("active"));
        img.classList.add("active");
      })
    );

    // Review overlay toggles
    const toggleReview = (show) => {
      if (!this._nodes.overlay || !this._nodes.reviewPanel) return;
      this._nodes.overlay.style.display = show ? "block" : "none";
      this._nodes.reviewPanel.style.right = show ? "0" : "-100%";
      document.body.style.overflowY = show ? "hidden" : "auto";
    };
    this._nodes.reviewBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      toggleReview(true);
    });
    this._nodes.closeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      toggleReview(false);
    });
    this._nodes.overlay?.addEventListener("click", (e) => e.target === this._nodes.overlay && toggleReview(false));


    // varitate default selection

    let weightParam = this._getQueryParam("weight");
    let quantityParam = this._getQueryParam("quantity");


    if (this._nodes.priceVariantButtons.length > 0) {
      const defaultVariantBtn = Array.from(this._nodes.priceVariantButtons).find((btn => btn.dataset.quantity === weightParam))

      if (defaultVariantBtn) {
        defaultVariantBtn.classList.add("items-content-main-grams-btn-variant-active");
        this._nodes.quantityValue.textContent = quantityParam || "1";
      } else {
        this._nodes.priceVariantButtons[0].classList.add("items-content-main-grams-btn-variant-active");
        this._updateQueryParam("weight", this._nodes.priceVariantButtons[0].dataset.quantity);
      }
    }

    // Variant click handling (delegation: one listener on container)
    const container = this._nodes.priceVariantsContainer;
    if (container) {
      container.addEventListener("click", (e) => {
        const btn = e.target.closest(".items-content-main-grams-btn-variant");
        if (!btn) return;
        const currentActive = container.querySelector(".items-content-main-grams-btn-variant-active");
        if (currentActive === btn) return;
        currentActive?.classList.remove("items-content-main-grams-btn-variant-active");
        btn.classList.add("items-content-main-grams-btn-variant-active");
        

        // reset quantity to 1 when variant changes
        if (this._nodes.quantityValue) {
          this._nodes.quantityValue.textContent = "1";
          this._updateQueryParam("quantity", 1);
        }
        this._updateQueryParam("weight", btn.dataset.quantity);

        this._helperFindAlreadyInCart(cartAdded, this._nodes.addCartBtn, btn.dataset.quantity)
      });
    }

    // Quantity buttons (delegation)
    this._nodes.quantityBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const change = Number(btn.dataset.value) || 0;
        if (!this._nodes.quantityValue) return;
        let value = Number(this._nodes.quantityValue.textContent) || 1;
        if (value + change >= 1) {
          value += change;
          this._nodes.quantityValue.textContent = value;
          this._updateQueryParam("quantity", value);
        }
      });
    });

    // Setup Add-to-cart logic
    this._setupAddToCart(id, variants, apiUrl, callFn, cartAdded);
  }


  
  



  _setupAddToCart(id, variants = [], apiUrl, callFn, cartAdded) {
    const btn = this._nodes.addCartBtn;
    const quantityContainer = this._nodes.quantityContainer;
  let getWeight = this._getQueryParam("weight");
  let getQuantity = this._getQueryParam("quantity") || "1";


    if (!btn) return;

    // Setup dataset checkBtn based on cartAdded

    const allreadyInCart = this._helperFindAlreadyInCart(cartAdded, btn, getWeight, quantityContainer);



    // Normalize dataset.checkBtn to string 'true'/'false'
    // HTML attribute should be data-check-btn="true" (recommended). But we accept either.
    // If cartAdded true, user should be taken to cart — so set dataset to "false" meaning "no add action".
 

    // Single click handler: always read current dataset inside handler (avoid stale closure)
    btn.addEventListener("click", async (e) => {

         getWeight = this._getQueryParam("weight");
   getQuantity = this._getQueryParam("quantity") || "1";

      console.log("Add to cart clicked");
      e.preventDefault();



      const currentCheck = btn.checkBtn === "true"; // boolean
      // If checkBtn is false -> treat as "go to cart" action
      if (currentCheck) {
        // redirect immediately
        window.location.href = "/cart";
        return;
      }

      // Prevent double-clicks
      if (btn.disabled) return;
      btn.disabled = true;
      const origText = btn.textContent;
      btn.textContent = "Adding...";

      // Resolve selected weight and quantity (from URL query params)
    
            // Find variant
      const selectedVariant = variants.find((v) => String(v.weight?.value) === String(getWeight)) || variants[0];
      if (!selectedVariant) {
        console.warn("No variant found for weight:", getWeight);
        // restore state and return
        btn.disabled = false;
        btn.textContent = origText;
        return;
      }

      console.log("Selected variant for add to cart:", selectedVariant, getWeight, getQuantity);

      const cartItem = {
        itemId: id,
        variantId: selectedVariant.id,
        quantity: getQuantity || 1,
        weight: this._getQueryParam("weight"),
      };

      try {
        // Prefer await and handle errors
        const res = await callFn({ url: `${apiUrl}updateCart`, body: cartItem });
        console.log("Add-to-cart response:", res);

        // If API says success, update UI to "GO TO CART"
        btn.textContent = "GO TO CART";
        if (quantityContainer) quantityContainer.style.display = "none";
      } catch (err) {
        console.error("Failed to add to cart:", err);
        // Provide retry option — show informative text
        btn.textContent = "Add failed. Try again";
        setTimeout(() => (btn.textContent = origText), 1600);
      } finally {
        btn.disabled = false;
      }
    });
  }

}

export default new SingleProductView();
