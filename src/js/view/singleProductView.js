// singleProductView.optimized.js
import { $, $$ } from "../utils/dom.js";
import icons from "../../img/icon.svg";
import view from "./view";

class SingleProductView extends view {
  constructor() {
    super();
    // Cache for frequently used selector strings (avoid typos)
    this.selectors = {
      mainImage: ".items-main-image-big img",
      thumbsLi: ".items-main-image-small-li img",
      reviewBtn: ".items-reviews-users-btn",
      reviewPanel: "#user-review",
      closeBtn: ".user-review-close-btn",
      overlay: "#reviews-container",
      priceVariantsContainer: ".items-content-main-grams-btn",
      variantButton: ".items-content-main-grams-btn-variant",
      quantityValue: ".items-content-main-quantity-value",
      quantityBtns: ".items-content-main-quantity-btn-less-add",
      addCartBtn: ".items-content-main-btn-addcart",
      quantityContainer: ".items-content-main-quantity",
      priceEl: ".items-content-main-price",
      productHeader: ".items-content-main-header h1",
      descContainer: ".items-content-main-product-container",
      reviewSummary: ".items-reviews-container-rating",
      userComments: ".items-reviews-users",
      allReviews: ".user-review-container",
      smallImagesUl: ".items-main-image-small-ul",
    };
  }

  /* -------------------------
     Public API (rendering)
     ------------------------- */

  _generateMarkup() {
    return (this._data || "").replaceAll("%{icons}%", icons);
  }

  // backward compatible (keep old name pointing to new)
  _prepperPage() {
    return this._preparePage();
  }

  _preparePage() {
    if (!this._subData) return;
    const { productInfo = {}, apiUrl, callFn, cartAdded = [],  payment, } = this._subData;

    // render static parts
    this._setMainImage(productInfo);
    this._renderSmallImages(productInfo);
    this._renderText(this.selectors.productHeader, productInfo.name);
    this._renderPrice(productInfo.variants?.[0]);
    this._renderVariantButtons(productInfo.variants || [], productInfo.id, cartAdded);
    this._renderDescription(productInfo.description || []);
    this._renderReviewSummary(productInfo.userReviews || []);
    this._renderReviewGraph(productInfo.userReviews || []);
    this._renderUserComments(productInfo.userReviews || []);
    this._renderAllUserReview(productInfo.userReviews || []);

    // init interactions once
    this._initInteractionHandlers(productInfo.id, productInfo.variants || [], apiUrl, callFn, cartAdded);
    this._handleOrderClick(payment);
  }

  /* -------------------------
     Helpers: rendering small parts
     ------------------------- */

  _setMainImage({ photos = [], sortName } = {}) {
    const img = $(this.selectors.mainImage);
    if (!img || !photos.length) return;
    const main = photos.find((p) => p.main) ?? photos[0];
    img.src = main?.url || "";
    img.alt = sortName || "Product image";
  }

  _renderSmallImages({ photos = [] } = {}) {
    const ul = $(this.selectors.smallImagesUl);
    if (!ul) return;
    ul.innerHTML = ""; // clear

    if (!photos.length) return;

    const frag = document.createDocumentFragment();
    photos.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "items-main-image-small-li";
      li.innerHTML = `<img class="items-main-image-small-img ${p.main === true ? "active" : ""}" src="${p.url}" alt="Thumbnail ${i + 1}" />`;
      frag.appendChild(li);
    });
    ul.appendChild(frag);
  }

  _renderText(selector, text) {
    const el = $(selector);
    if (el) el.textContent = text ?? "";
  }

  _renderPrice(variant) {
    const priceEl = $(this.selectors.priceEl);
    if (!priceEl || !variant) return;
    const { MRP = 0, price = 0 } = variant;
    const offer = this._findPercentageOffer(MRP, price);
    priceEl.innerHTML = `
      <span class="items-content-main-price-mrp"><del>Rs. ${MRP}.00</del> |</span>
      <span class="items-content-main-price-selling-price"><b>Rs. ${price}.00</b> |</span>
      <span class="items-content-main-price-offer">Offer ${offer}%</span>`;
  }

  _renderVariantButtons(variants = [],  id) {
    console.log(id)

    const container = $(this.selectors.priceVariantsContainer);
    console.log(container)
    if (!container) return;

    // Build markup with fragment for safety
    container.innerHTML = "";
    if (!variants.length) return;

    const frag = document.createDocumentFragment();
    variants.forEach((v) => {

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "items-content-main-grams-btn-variant";
      btn.dataset.itemid = id ?? v.itemId ?? "";
      btn.dataset.variantid = v.id ?? v.variantId ?? "";
      btn.dataset.quantity = String(v.weight?.value ?? "");
      btn.dataset.price = String(v.price ?? "");
      btn.dataset.mrp = String(v.MRP ?? "");
      btn.textContent = `${v.weight?.value ?? ""} grams`;
      frag.appendChild(btn);
    });
    container.appendChild(frag);
    
  }

  _renderDescription(descriptions = []) {
    const container = $(this.selectors.descContainer);
    if (!container) return;
    container.innerHTML = "";

    if (!descriptions.length) return;

    const frag = document.createDocumentFragment();
    descriptions.forEach(({ header, content = "" }) => {
      const section = document.createElement("section");
      section.className = "items-content-main-product";

      const items = content.split("%{li}%").map((s) => s.trim()).filter(Boolean);
      if (items.length > 1) {
        if (header) {
          const h3 = document.createElement("h3");
          h3.className = "items-content-main-product-header";
          h3.textContent = header;
          section.appendChild(h3);
        }
        const ul = document.createElement("ul");
        ul.className = "items-content-main-product-para-ul";
        items.forEach((liText) => {
          const li = document.createElement("li");
          li.textContent = liText;
          ul.appendChild(li);
        });
        section.appendChild(ul);
      } else {
        if (header) {
          const h3 = document.createElement("h3");
          h3.className = "items-content-main-product-header";
          h3.textContent = header;
          section.appendChild(h3);
        }
        const block = document.createElement("blockquote");
        block.className = "items-content-main-product-para";
        block.textContent = content;
        section.appendChild(block);
      }
      frag.appendChild(section);
    });

    // add "more details" always
    const more = document.createElement("section");
    more.className = "items-content-main-product";
    more.innerHTML = `<blockquote class="items-content-main-product-para"><b>More details and recipe ideas:</b> <a href="">Visit this link →</a></blockquote>`;
    frag.appendChild(more);

    container.appendChild(frag);
  }

  _renderReviewSummary(reviews = []) {
    const el = $(this.selectors.reviewSummary);
    if (!el) return;
    if (!reviews.length) return (el.innerHTML = "<span>No reviews yet</span>");
    const total = reviews.reduce((s, r) => s + (r.rating || 0), 0);
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
    Object.keys(count).forEach((r) => {
      const el = $(`.reviews-container-graf-sec-span-${r}`);
      if (el) el.style.width = `${((count[r] / total) * 100).toFixed(1)}%`;
    });
  }

  _renderUserComments(reviews = []) {
    const container = $(this.selectors.userComments);
    if (!container) return;
    container.innerHTML = "";
    reviews
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 2)
      .forEach((r) => {
        const markup = this._buildReviewMarkup(r);
        container.insertAdjacentHTML("beforeend", markup);
      });
  }

  _renderAllUserReview(reviews = []) {
    const container = $(this.selectors.allReviews);
    if (!container) return;
    container.innerHTML = "";
    reviews
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .forEach((r) => {
        const markup = this._buildReviewMarkup(r);
        container.insertAdjacentHTML("beforeend", markup);
      });
  }

  _buildReviewMarkup({ id, userProfile, userName, rating, updatedAt, comment, commentImage } = {}) {
    const images = Array.isArray(commentImage) ? commentImage : commentImage ? [commentImage] : [];
    const date = new Date(updatedAt || Date.now());
    const formattedDate = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(",", "");
    return `<div class="items-reviews-user-reviews" data-user-comment-id="${id || ""}">
      <section class="items-reviews-user-reviews-img-span">
        <img src="${userProfile || ""}" alt="User Profile Image" class="items-reviews-user-reviews-img"/>
        <span class="items-reviews-user-reviews-name">${userName || "Anonymous"}</span>
        <span class="items-reviews-user-reviews-name-verified">Verified
          <svg class="icon" width="20" height="24"><use href="${icons}#icon-tick"></use></svg>
        </span>
      </section>
      <section class="items-reviews-user-rating">
        <span class="items-reviews-user-rating-value">${rating || 0}<svg class="icon" width="20" height="24"><use href="${icons}#icon-star"></use></svg></span>
        <span class="items-reviews-user-rating-dot"></span>
        <span class="items-reviews-user-rating-date">Posted on ${formattedDate}</span>
      </section>
      <section class="items-reviews-user-rating-message">
        <p>${comment || ""}</p>
        <span class="items-reviews-user-rating-message-img">
          ${images.map((img) => `<img src="${img}" alt="user-comment-img"/>`).join("")}
        </span>
      </section>
    </div>`;
  }

  /* -------------------------
     Interaction wiring (single place)
     ------------------------- */
 /* -------------------------
     Interaction wiring (single place) -- helepr 
     ------------------------- */

     _getQuey(){

      return {
        weight: this._getQueryParam('weight') || 0,
        quantity: this._getQueryParam('quantity') || 1,
        productId: this._getQueryParam('productId') || null,
        variantId: this._getQueryParam('variantId') || null

        
      }
     }

    _getQuery() {
  return {
    weight: Number(this._getQueryParam('weight')) || 0,
    quantity: Number(this._getQueryParam('quantity')) || 1,
    productId: this._getQueryParam('productId') || null,
    variantId: this._getQueryParam('variantId') || null
  };
}

_setQuery(weight, quantity, pId, vId) {
  // Update values in URL
  if (weight !== undefined) this._updateQueryParam('weight', weight);
  if (quantity !== undefined) this._updateQueryParam('quantity', quantity);
  if (pId !== undefined) this._updateQueryParam('productId', pId);
  if (vId !== undefined) this._updateQueryParam('variantId', vId);
  // Return updated query object
  return this._getQuery();
}


  _initInteractionHandlers(id, variants = [], apiUrl, callFn, cartAdded = []) {
    // cache nodes once (safe fallbacks)
    this._nodes = {
      fullImage: $(this.selectors.mainImage),
      thumbs: Array.from($$(this.selectors.thumbsLi) || []),
      reviewBtn: $(this.selectors.reviewBtn),
      reviewPanel: $(this.selectors.reviewPanel),
      closeBtn: $(this.selectors.closeBtn),
      overlay: $(this.selectors.overlay),
      priceVariantsContainer: $(this.selectors.priceVariantsContainer),
      priceVariantButtons: Array.from($$(this.selectors.variantButton) || []),
      quantityValue: $(this.selectors.quantityValue),
      quantityBtns: Array.from($$(this.selectors.quantityBtns) || []),
      addCartBtn: $(this.selectors.addCartBtn),
      quantityContainer: $(this.selectors.quantityContainer),
    };

    // thumbs click Image 
    this._nodes.thumbs.forEach((img) => {
      img.addEventListener("click", () => {
        if (!this._nodes.fullImage) return;
        this._nodes.fullImage.src = img.src;
        this._nodes.thumbs.forEach((t) => t.classList.remove("active"));
        img.classList.add("active");
      });
    });

    // review overlay toggles
    const toggleReview = (show) => {
      if (!this._nodes.overlay || !this._nodes.reviewPanel) return;
      this._nodes.overlay.style.display = show ? "block" : "none";
      this._nodes.reviewPanel.style.right = show ? "0" : "-100%";
      document.body.style.overflowY = show ? "hidden" : "auto";
    };
    this._nodes.reviewBtn?.addEventListener("click", (e) => { e.preventDefault(); toggleReview(true); });
    this._nodes.closeBtn?.addEventListener("click", (e) => { e.preventDefault(); toggleReview(false); });
    this._nodes.overlay?.addEventListener("click", (e) => e.target === this._nodes.overlay && toggleReview(false));

    // set default variant active based on query params
    const weightParam = this._getQueryParam("weight");
    const quantityParam = this._getQueryParam("quantity") || "1";

    if (this._nodes.priceVariantButtons.length > 0) {
      const defaultBtn = this._nodes.priceVariantButtons.find((b) => b.dataset.quantity === weightParam);
      const chosen = defaultBtn || this._nodes.priceVariantButtons[0];
      chosen.classList.add("items-content-main-grams-btn-variant-active");

      if (this._nodes.quantityValue) this._nodes.quantityValue.textContent = quantityParam;

        this._setQuery(weightParam, quantityParam, chosen.dataset.itemid, chosen.dataset.variantid)
      // if (!defaultBtn) this._updateQueryParam("weight", chosen.dataset.quantity);
    }

    // variant selection (delegation)
    const container = this._nodes.priceVariantsContainer;
    if (container) {
      container.addEventListener("click", (e) => {
        const btn = e.target.closest(".items-content-main-grams-btn-variant");
        if (!btn) return;
        const active = container.querySelector(".items-content-main-grams-btn-variant-active");
        if (active === btn) return;
        active?.classList.remove("items-content-main-grams-btn-variant-active");
        btn.classList.add("items-content-main-grams-btn-variant-active");
        this._updateQueryParam("variantId", btn.dataset.variantid);

        // reset quantity and update url param
        if (this._nodes.quantityValue) {
          this._nodes.quantityValue.textContent = "1";
          this._updateQueryParam("quantity", 1);
        }
        this._updateQueryParam("weight", btn.dataset.quantity);

        // update add-to-cart button state
        this._helperFindAlreadyInCart(cartAdded, this._nodes.addCartBtn, btn.dataset.quantity);
      });
    }

    // quantity buttons
    this._nodes.quantityBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._nodes.quantityValue) return;
        const change = Number(btn.dataset.value) || 0;
        let value = Number(this._nodes.quantityValue.textContent) || 1;
        if (value + change >= 1) {
          value += change;
          this._nodes.quantityValue.textContent = value;
          this._updateQueryParam("quantity", value);
        }
      });
    });

    // add-to-cart
    this._setupAddToCart(id, variants, apiUrl, callFn, cartAdded);
  }

  _helperFindAlreadyInCart(cartAdded = [], btn, weight) {
    if (!btn) return false;
    const quantityContainer = this._nodes?.quantityContainer;
    const alreadyInCart = Array.isArray(cartAdded) && cartAdded.some((item) => {
      // normalize both to string to be safe
      //check weight i already selected 
      let check = String(item.weight) === String(weight);
      // if already slect the weight then need to add quntiry in params 
      if( check) this._updateQueryParam("quantity", item.quantity)

      return check;

    });

    if (alreadyInCart) {
      btn.textContent = "GO TO CART";
      btn.dataset.checkBtn = "true";

      if (quantityContainer) quantityContainer.style.display = "none";
      return true;
    } else {
      btn.textContent = "ADD TO CART";
      btn.dataset.checkBtn = "false";
      if (quantityContainer) quantityContainer.style.display = "block";
      return false;
    }
  }

  _setupAddToCart(id, variants = [], apiUrl, callFn, cartAdded = []) {
    const btn = this._nodes?.addCartBtn;
    const quantityContainer = this._nodes?.quantityContainer;
    if (!btn) return;

    // Initialize state depending on URL or cart
    const currentWeight = this._getQueryParam("weight");
    this._helperFindAlreadyInCart(cartAdded, btn, currentWeight);

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      // read current state fresh
      const weight = this._getQueryParam("weight");
      const quantity = Number(this._getQueryParam("quantity") || (this._nodes?.quantityValue?.textContent) || 1);
      const isInCart = btn.dataset.checkBtn === "true";

      if (isInCart) {
        window.location.href = "/cart";
        return;
      }

      if (btn.disabled) return;
      btn.disabled = true;
      const origText = btn.textContent;
      btn.textContent = "Adding...";

      // find selected variant by matching weight
      const selectedVariant = variants.find((v) => String(v.weight?.value) === String(weight)) || variants[0];
      if (!selectedVariant) {
        console.warn("No variant found for weight:", weight);
        btn.disabled = false;
        btn.textContent = origText;
        return;
      }

      const cartItem = {
        itemId: id,
        variantId: selectedVariant.id || selectedVariant.variantId,
        quantity,
        weight: String(weight),
      };

      try {
        const res = await callFn({ url: `${apiUrl}add-cart`, body: cartItem });
        // assume success shape; update UI
        btn.textContent = "GO TO CART";
        btn.dataset.checkBtn = "true";
        if (quantityContainer) quantityContainer.style.display = "none";
      } catch (err) {
        console.error("Add to cart failed", err);
        btn.textContent = "Add failed. Try again";
        setTimeout(() => (btn.textContent = origText), 1500);
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ============================================
     Order button
  ============================================= */

   _handleOrderClick(paymentFn) {
    const orderBtn = $(".items-content-main-btn-buyit");
    if (!orderBtn) return;
    orderBtn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      // Placeholder: implement buy-now flow
      console.log("Buy it clicked - implement buy flow");
      const res = await paymentFn(`http://localhost:3000/api/v1/payment/order-create`)
      console.log("Buy it clicked - implement ")
    });
  }

  /* ============================
     Utility helpers (assumed present)
     ============================ */


 _findPercentageOffer(MRP = 0, price = 0) {
    if (!MRP || !price || MRP <= 0) return 0;
    return Math.round(((MRP - price) / MRP) * 100);
  }

  _truncateToOneDecimal(num) {
    return Math.round((num + Number.EPSILON) * 10) / 10;
  }
}

export default new SingleProductView();



