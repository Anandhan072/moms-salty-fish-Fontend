import { $, $$ } from "../utils/dom";
import icons from "../../img/icon.svg";
import view from "./view";

class CartView extends view {

  /* -----------------------------
     HTML Templates
  ----------------------------- */

  _itemCartHtml = `
    <section class="cart-item">
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
            <span class="items-content-main-price-mrp">
              <del>Rs. %{MRP}%.00</del> |
            </span>

            <span class="items-content-main-price-selling-price">
              Rs. %{price}%.00 |
            </span>

            <span class="items-content-main-price-offer">
              Offer %{offer}%
            </span>
          </section>
        </span>

        <span class="cart-items-weight">
          %{weight}% g
        </span>

        <span class="cart-item-quantity">
          <label for="quantity">Qty:</label>
          <input 
            type="number" 
            class="cart-qty-input"
            min="1" 
            value="%{qty}%" 
            max="10"
          >
        </span>

        <span class="cart-item-input-change">
          <button class="cart-item-change-input cart-item-decrease" data-decrease="-1">-</button>
          <button class="cart-item-remove">remove</button>
          <button class="cart-item-change-input cart-item-increase" data-increase="1">+</button>
        </span>

        <span class="cart-item-delivery">
          Delivery time: Up to 2 weeks
        </span>
      </div>
    </section>`;

  _priceDetialsHtml = `
    <section class="cart-item-price-detials">
      PRICE DETAILS
    </section>

    <section class="cart-items-nos-and-price">
      <span>Price (%{no's}% items)</span>
      <span>₹%{total-price}%</span>
    </section>

    <section class="cart-items-discount-price">
      <span>Discount</span>
      <span>− ₹%{offer-price}%</span>
    </section>

    <section class="cart-items-courier-fee">
      <span>Courier Fee</span>
      <span>₹100</span>
    </section>

    <section class="cart-items-totel">
      <span>Total Amount</span>
      <span>₹%{price}%</span>
    </section>

    <section class="cart-item-your-saving">
      You will save ₹%{total-offer}% on this order
    </section>
  `;

  _errorMessage = `
    Your cart is currently empty. 
    Please add items to your cart to proceed to checkout.
  `;

  /* -----------------------------
     Main Render Functions
  ----------------------------- */

  _generateMarkup() {
    let markup = this._data;

    // Replace icons
    markup = markup.replaceAll("%{icons}%", icons);

    // Replace empty-cart message
    if (!this._subData?.checkError) {
      markup = markup.replaceAll("%{errorMessage}%", this._errorMessage);
    }

    return markup;
  }

  _prepperPage() {
    if (!this._subData) return;

    const { variants } = this._subData;

    this._nodeDom = {
      cartItemDom: $('.cart-cotainer-1'),
      priceDetialDom: $('.cart-items-price')
    };

    this._renderCarts(variants, this._nodeDom.cartItemDom);
    this._renderTotelAmoount(variants, this._nodeDom.priceDetialDom);
  }

  /* -----------------------------
     Cart Items Rendering
  ----------------------------- */

  _renderCarts(variants, htmlDom) {
    if (!variants?.length) {
      htmlDom.innerHTML = `<p>${this._errorMessage}</p>`;
      return;
    }

    const markup = variants
      .map(item => this._changeCartData(item.product, item.variant, item.cartItem))
      .join("");

    htmlDom.innerHTML = markup;
  }

  _changeCartData(product, variant, cartItem) {
    return this._itemCartHtml
      .replaceAll("%{cart-image}%", product.mainPhoto || "")
      .replaceAll("%{cart-name}%", product.name || "")
      .replaceAll("%{MRP}%", variant.MRP || 0)
      .replaceAll("%{price}%", variant.price || 0)
      .replaceAll("%{offer}%", variant.offerPercentage || 0)
      .replaceAll("%{weight}%", variant.weight?.value || 0)
      .replaceAll("%{qty}%", cartItem.quantity || 1);
  }

  /* -----------------------------
     Price Details Rendering
  ----------------------------- */

  _renderTotelAmoount(carts, dom) {
    if (!carts?.length) return;

    const totals = carts.reduce(
      (acc, item) => {
        acc.mrp += Number(item?.variant?.MRP || 0);
        acc.price += Number(item?.variant?.price || 0);
        return acc;
      },
      { mrp: 0, price: 0 }
    );

    const discount = totals.mrp - totals.price;
    const courierFee = 100;
    const finalAmount = totals.price + courierFee;

    const output = this._priceDetialsHtml
      .replaceAll("%{total-price}%", totals.mrp)
      .replaceAll("%{offer-price}%", discount)
      .replaceAll("%{price}%", finalAmount)
      .replaceAll("%{total-offer}%", discount)
      .replaceAll("%{no's}%", carts.length);

    dom.innerHTML = output;
  }


  /* -----------------------------
     Quantity Change request
  ----------------------------- */



}

export default new CartView();
