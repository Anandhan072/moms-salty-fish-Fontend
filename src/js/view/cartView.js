import { $, $$ } from "../utils/dom";
import icons from "../../img/icon.svg";
import view from "./view";

class CartView extends view {
  /* -----------------------------
     Templates
  ----------------------------- */

  _itemCartHtml = `
    <section class="cart-item" data-cart-id="%{_id}%">
      <div class="cart-item-img">
        <img src="%{cart-image}%" alt="%{cart-name}%">
      </div>

      <div class="cart-item-details">
        <span class="cart-item-header">
          <header>%{cart-name}%</header>
          <p class="cart-item-Vendor">Moms-Salty-Fish</p>
        </span>

        <span class="cart-priceContainer">
          <section class="items-content-main-price">
            <span><del>Rs. %{MRP}%.00</del> |</span>
            <span>Rs. %{price}%.00 |</span>
            <span>Offer %{offer}%</span>
          </section>
        </span>

        <span class="cart-items-weight">%{weight}% g</span>

        <span class="cart-item-quantity">
          <label>Qty:</label>
          <span class="cart-qty-input" data-value="%{qty}%">%{qty}%</span>
        </span>

        <span class="cart-item-input-change">
          <button data-action="dec">-</button>
          <button data-action="remove">remove</button>
          <button data-action="inc">+</button>
        </span>

        <span class="cart-item-delivery">
          Delivery time: Up to 2 weeks
        </span>
      </div>
    </section>
  `;

  _priceDetialsHtml = `
    <section class="cart-item-price-detials">PRICE DETAILS</section>

    <section>
      <span>Price (%{count}% items)</span>
      <span>₹%{total-mrp}%</span>
    </section>

    <section>
      <span>Discount</span>
      <span>− ₹%{discount}%</span>
    </section>

    <section>
      <span>Courier Fee</span>
      <span>₹%{courier}%</span>
    </section>

    <section>
      <span>Total Amount</span>
      <span>₹%{final}%</span>
    </section>

    <section>
      You will save ₹%{discount}% on this order
    </section>
  `;

  _errorMessage = `Your cart is currently empty.`;
  _courierFee = 100;

  /* -----------------------------
     Render
  ----------------------------- */

  _generateMarkup() {
    let markup = this._data.replaceAll("%{icons}%", icons);

    if (!this._subData?.checkError) {
      markup = markup.replaceAll("%{errorMessage}%", this._errorMessage);
    }

    return markup;
  }

  _prepperPage() {
    if (!this._subData) return;

    this._dom = {
      cartList: $(".cart-cotainer-1"),
      priceBox: $(".cart-items-price"),
    };

    this._render();
    this._bindEvents();
  }

  /* -----------------------------
     Render Functions
  ----------------------------- */

  _render() {
    this._renderCartItems();
    this._renderPriceDetails();
  }

  _renderCartItems() {
    const { variants } = this._subData;

    if (!variants?.length) {
      this._dom.cartList.innerHTML = `<p>${this._errorMessage}</p>`;
      return;
    }

    this._dom.cartList.innerHTML = variants
      .map((v) => this._buildCartItem(v))
      .join("");
  }

  _buildCartItem({ product, variant, cartItem }) {
    return this._itemCartHtml
      .replaceAll("%{cart-image}%", product.mainPhoto || "")
      .replaceAll("%{cart-name}%", product.name || "")
      .replaceAll("%{MRP}%", variant.MRP || 0)
      .replaceAll("%{price}%", variant.price || 0)
      .replaceAll("%{offer}%", variant.offerPercentage || 0)
      .replaceAll("%{weight}%", variant.weight?.value || 0)
      .replaceAll("%{qty}%", cartItem.quantity || 1)
      .replaceAll("%{_id}%", cartItem._id || "");
  }

  _renderPriceDetails() {
    const carts = this._subData.variants;

    const totals = carts.reduce(
      (acc, { cartItem, variant }) => {
        acc.mrp += Number(variant.MRP) * Number(cartItem.quantity);
        acc.price += Number(variant.price) * Number(cartItem.quantity);
        return acc;
      },
      { mrp: 0, price: 0 }
    );

    const discount = totals.mrp - totals.price;

    this._dom.priceBox.innerHTML = this._priceDetialsHtml
      .replaceAll("%{total-mrp}%", totals.mrp)
      .replaceAll("%{discount}%", discount)
      .replaceAll("%{courier}%", this._courierFee)
      .replaceAll("%{final}%", totals.price + this._courierFee)
      .replaceAll("%{count}%", carts.length);
  }

  /* -----------------------------
     Events
  ----------------------------- */

  _bindEvents() {
    this._dom.cartList.addEventListener(
      "click",
      this._handleCartActions.bind(this)
    );
  }

  /* -----------------------------
     API Helpers
  ----------------------------- */

  async _helperCartUpdate(url, id, qty) {
    const payload = {
      url: `${url}update-cart`,
      body: { updateQty: qty, cartId: id },
    };

    try {
      return await this._subData.updateCart(payload);
    } catch (err) {
      console.error("Cart update failed:", err);
    }
  }

  async _helperRemoveCart(url, id) {
    const payload = {
      url: `${url}update-cart/${id}`,
    };

    try {
      return await this._subData.deleteCart(payload);
    } catch (err) {
      console.error("Cart remove failed:", err);
    }
  }

  /* -----------------------------
     Action Handler
  ----------------------------- */

  async _handleCartActions(e) {
    const button = e.target.closest("button");
    if (!button) return;

    const cartItem = button.closest(".cart-item");
    if (!cartItem) return;

    const cartId = cartItem.dataset.cartId;
    const qtyEl = cartItem.querySelector(".cart-qty-input");

    if (!cartId || !qtyEl) return;

    const action = button.dataset.action;

    /* === REMOVE === */
    if (action === "remove") {
      // UI + State
      this._removeItem(cartId, cartItem);

      // Backend sync
      await this._helperRemoveCart(this._subData.APIurl, cartId);
      return;
    }

    /* === INC / DEC === */
    let qty = Number(qtyEl.dataset.value);

    if (action === "inc") {
      if (qty >= 10) return console.warn("Max quantity reached");
      qty++;
    }

    if (action === "dec") {
      qty = Math.max(1, qty - 1);
    }

    // UI
    qtyEl.dataset.value = qty;
    qtyEl.textContent = qty;

    // Local data
    const item = this._subData.variants.find(
      (v) => v.cartItem._id === cartId
    );

    if (item) {
      item.cartItem.quantity = qty;
    }

    // Recalculate totals
    this._renderPriceDetails();

    // Backend sync
    await this._helperCartUpdate(this._subData.APIurl, cartId, qty);
  }

  /* -----------------------------
     Remove Item
  ----------------------------- */

  _removeItem(cartId, cartDom) {
    cartDom.remove();

    this._subData.variants = this._subData.variants.filter(
      (v) => v.cartItem._id !== cartId
    );

    this._renderPriceDetails();
  }
}

export default new CartView();
