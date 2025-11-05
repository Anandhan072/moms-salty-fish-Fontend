import icons from "../../img/icon.svg";
import view from "./view";

class SingleProductView extends view {
  _generateMarkup() {
    const markup = this._data.replaceAll("%{icons}%", `${icons}`);
    return `${markup}`;
  }

  _prepperPage() {
    if (!this._subData) return;
    let { productInfo, apiUrl, callFn } = this._subData;

    this._setMainImage(productInfo);
    this._renderSmallImages(productInfo);
    this._renderText(".items-content-main-header h1", productInfo.name);
    this._renderPrice(productInfo.variants?.[0]);
    this._renderVariantButtons(productInfo.variants);
    this._renderDescription(productInfo.description);
    this._renderReviewSummary(productInfo.userReviews);
    this._renderReviewGraph(productInfo.userReviews);
    this._renderUserComments(productInfo.userReviews);
    this._renderAllUserReview(productInfo.userReviews);
    this._handelClickWeightQuantity();
    this._handelClickAddCart(productInfo.id, productInfo.variants, apiUrl, callFn);
  }

  _setMainImage({ photos, sortName }) {
    const img = document.querySelector(".items-main-image-big img");
    if (img && photos?.length) {
      let mainImage;

      photos.some((acc) => {
        if (acc.main === true) mainImage = acc.url;
      });
      img.src = mainImage;
      img.alt = sortName || "Product image";
    }
  }

  _renderSmallImages({ photos }) {
    const ul = document.querySelector(".items-main-image-small-ul");
    if (!ul || !photos?.length) return;
    ul.innerHTML = photos
      .map(
        (src, i) => `<li class="items-main-image-small-li">
          <img class="items-main-image-small-img ${src.main === true ? "active" : ""}" src="${
          src.url
        }" alt="Thumbnail ${i + 1}"/>
        </li>`
      )
      .join("");
  }

  _renderText(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text || "";
  }

  _renderPrice(variant) {
    if (!variant) return;
    const priceEl = document.querySelector(".items-content-main-price");
    if (!priceEl) return;
    const { MRP, price } = variant;
    const offer = this._findPercentageOffer(MRP, price);
    priceEl.innerHTML = `
      <span class="items-content-main-price-mrp"><del>Rs. ${MRP}.00</del> |</span>
      <span class="items-content-main-price-selling-price"><b>Rs. ${price}.00</b> |</span>
      <span class="items-content-main-price-offer">Offer ${offer}%</span>`;
  }

  _renderVariantButtons(variants = []) {
    const container = document.querySelector(".items-content-main-grams-btn");
    if (!container || !variants.length) return;
    container.innerHTML = variants
      .map(
        ({ weight, price, MRP }, i) =>
          `<button class="items-content-main-grams-btn-variant" data-quantity="${weight.value}" data-price="${price}" data-mrp="${MRP}">${weight.value} grams</button>`
      )
      .join("");

    this._updateQueryParam("weight", variants[0].weight.value);
    this._updateQueryParam("quantity", 1);
  }

  _renderDescription(descriptions = []) {
    const container = document.querySelector(".items-content-main-product-container");
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
    const el = document.querySelector(".items-reviews-container-rating");
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
    if (!reviews.length) return;
    const count = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(({ rating }) => count[rating]++);
    const total = reviews.length;

    for (const r in count) {
      const el = document.querySelector(`.reviews-container-graf-sec-span-${r}`);
      if (el) el.style.width = `${((count[r] / total) * 100).toFixed(1)}%`;
    }
  }

  _renderUserComments(reviews = []) {
    const container = document.querySelector(".items-reviews-users");
    if (!container) return;

    reviews
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 2)
      .forEach(({ id, userProfile, userName, rating, updatedAt, comment, commentImage }) => {
        const images = Array.isArray(commentImage) ? commentImage : [commentImage];
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

  _renderAllUserReview(reviews) {
    const container = document.querySelector(".user-review-container");
    container.innerHTML = "";
    if (!container) return;

    reviews
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .forEach(({ id, userProfile, userName, rating, updatedAt, comment, commentImage }) => {
        const images = Array.isArray(commentImage) ? commentImage : [commentImage];
        const date = new Date(updatedAt);
        const options = { day: "2-digit", month: "short", year: "numeric" };
        const formattedDate = date.toLocaleDateString("en-GB", options).replace(",", "");
        const markup = `<div class="items-reviews-user-reviews">
            <section class="items-reviews-user-reviews-img-span">
              <img
                src="${userProfile}"
                alt=""
                class="items-reviews-user-reviews-img"
              />
              <span class="items-reviews-user-reviews-name">Anandhan</span>
              <span class="items-reviews-user-reviews-name-verified"
                >Verified
                <svg class="icon" width="20" height="24">
                  <use href="${icons}#icon-tick"></use>
                </svg>
              </span>
            </section>
            <section class="items-reviews-user-rating">
              <span class="items-reviews-user-rating-value">
                ${rating}
                <svg class="icon" width="20" height="24">
                  <use href="${icons}#icon-star"></use>
                </svg>
              </span>
              <span class="items-reviews-user-rating-dot"></span>
              <span class="items-reviews-user-rating-date"
                >Posted on ${formattedDate}</span
              >
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

  _handelClickWeightQuantity() {
    const fullImage = document.querySelector(".items-main-image-big img");
    const thumbs = document.querySelectorAll(".items-main-image-small-li img");
    const reviewBtn = document.querySelector(".items-reviews-users-btn");
    const reviewPanel = document.querySelector("#user-review");
    const closeBtn = document.querySelector(".user-review-close-btn");
    const overlay = document.querySelector("#reviews-container");
    const body = document.body;

    thumbs.forEach((img) =>
      img.addEventListener("click", () => {
        fullImage.src = img.src;
        thumbs.forEach((i) => {
          i.classList.remove("active");
        });
        img.classList.add("active");
      })
    );

    const toggleReview = (show) => {
      overlay.style.display = show ? "block" : "none";
      reviewPanel.style.right = show ? "0" : "-100%";
      body.style.overflowY = show ? "hidden" : "auto";
    };

    reviewBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      toggleReview(true);
    });
    closeBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      toggleReview(false);
    });
    overlay?.addEventListener("click", (e) => e.target === overlay && toggleReview(false));

    /* =====================================================
  Set current weight 
===================================================== */

    const priceVariants = document.querySelectorAll(".items-content-main-grams-btn-variant");
    const quantityValue = document.querySelector(".items-content-main-quantity-value");
    const quantityBtns = document.querySelectorAll(".items-content-main-quantity-btn-less-add");
    let value = Number(quantityValue.textContent);

    // ✅ Get the current query value
    const params = this._getQueryParam("weight");

    // ✅ Set the active class based on query param
    priceVariants.forEach((variant) => {
      variant.classList.toggle(
        "items-content-main-grams-btn-variant-active",
        variant.dataset.quantity === params
      );
    });

    // ✅ Add click listeners to update query & active class
    priceVariants.forEach((variant) => {
      variant.addEventListener("click", () => {
        if (variant.classList.contains("items-content-main-grams-btn-variant-active")) return;
        // Remove active class from all
        priceVariants.forEach((acc) =>
          acc.classList.remove("items-content-main-grams-btn-variant-active")
        );

        // Add to clicked
        variant.classList.add("items-content-main-grams-btn-variant-active");

        // ✅ Update URL query param
        value = 1;
        quantityValue.innerHTML = value;

        this._updateQueryParam("weight", variant.dataset.quantity);
        this._updateQueryParam("quantity", 1);
      });
    });

    /* =====================================================
  Set current quantity 
===================================================== */

    // ✅ Add event listeners for + and - buttons
    quantityBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const change = Number(btn.dataset.value); // typically -1 or +1

        // ✅ Prevent going below 1
        if (value + change >= 1) {
          value += change;
          quantityValue.textContent = value;
          this._updateQueryParam("quantity", value);

          // Optional: log or update query param
          // this._updateQueryParam("quantity", value);
        }
      });
    });
  }

  _handelClickAddCart(id, variants, apiUrl, callFn) {
    console.log(variants);

    const addCartBtn = document.querySelector(".items-content-main-btn-addcart");

    addCartBtn.addEventListener("click", async (el) => {
      console.log("jhgfuchgchchc");
      const getWeight = this._getQueryParam("weight");
      const getQuantity = this._getQueryParam("quantity");

      // Find the variant that matches the selected weight
      const selectedVariant = variants.find((variant) => variant.weight.value == getWeight);

      if (!selectedVariant) {
        console.warn("No variant found for weight:", getWeight);
        return;
      }

      const cartItem = {
        itemId: id,
        variantId: selectedVariant.id,
        quantity: getQuantity || 1, // default to 1 if quantity is missing
      };

      console.log("Cart Item:", cartItem);

      // Simulate adding to cart (you can replace with your real API or logic)

      try {
        const res = await callFn({ url: `${apiUrl}updateCart`, body: cartItem });
        console.log(res);
      } catch (error) {
        console.log(error);
      }
      addCartBtn.textContent = "Adding...";
      addCartBtn.disabled = true;

      // Example async call or local storage add
      setTimeout(() => {
        console.log("Item added to cart successfully:", cartItem);
        addCartBtn.textContent = "Added to Cart";
        addCartBtn.disabled = false;
      }, 1000);
    });
  }
}

export default new SingleProductView();
