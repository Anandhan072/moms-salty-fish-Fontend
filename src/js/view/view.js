import icons from "../../img/icon.svg";
import { PAGE_Count } from "../config";
import { Origin_Url } from "../config";
import { renderHTML } from "../utils/dom";
export default class view {
  _originUrl = Origin_Url;
  _data;
  _subData;
  _loc;
  _parentElement;
  _lastSegment;
  _htmlPage;

  render(data, parentEl, subData, element = "afterbegin", clear = true) {
    this._data = data;
    this._subData = subData;
    this._parentElement = document.querySelector(`${parentEl}`);
    const markup = this._generateMarkup();
    if (clear) this._clear();
    this._parentElement.insertAdjacentHTML(element, markup);
    // Call _prepperPage if it exists
    if (typeof this._prepperPage === "function") {
      this._prepperPage();
    }
  }

  renderError(message = "Something went wrong.") {
    renderHTML(this._parentEl, `<div class="error"><p>${message}</p></div>`);
  }

  _clear() {
    this._parentElement.innerHTML = "";
  }
  normalizeText(text) {
    if (typeof text !== "string") return "";
    return text.toLowerCase().replace(/\s+/g, "");
  }

  findUrlLocation() {
    const location = window.location.pathname.split("/").slice(1);

    this._loc = location;
    this._lastSegment = this._loc[this._loc.length - 1];
  }

  runCateText(text, maxLength = 19) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  _setParentElement(val) {
    this._parentElement = document.querySelector(val);
  }

  _updateQueryParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value); // add or update ?count=1
    window.history.pushState({}, "", url); // updates the URL without reload
  }

  _getQueryParam(key) {
    const url = new URL(window.location);
    return url.searchParams.get(key);
  }

  _findPercentageOffer(originalPrice, offerPrice) {
    if (!originalPrice || originalPrice <= 0 || offerPrice < 0) return 0;
    const discount = ((originalPrice - offerPrice) / originalPrice) * 100;
    return Math.round(discount); // rounded to nearest whole number
  }

  _itemCart(acc) {
    const value = `<section class="product-container">
                <a href="/moms-salty-fish/item/${acc.slug}" data-id="${acc._id}">
                  <span class="product-img">
                   <img
  src="${acc.photos.find((p) => p.main)?.url || acc.photos[0]?.url || ""}"
  alt="#"
/>
                  </span>
                  <span class="product-offer-price">₹${acc.variants[0].offerPrice}.00 Off</span>
                  <span class="product-item-trend">Trending</span>
                  <section class="product-item-name-section">
                    <span class="product-item-name">${
                      this.runCateText(acc.name) ?? "Unknown"
                    }</span>
                    <span class="product-item-rating">
                      <svg class="icon" width="24" height="24">
                        <use href="${icons}#icon-star"></use>
                      </svg>
                      Rating 4.7</span>
                  </section>
                  <span class="product-item-details-main">
                    <section class="product-itme-details">
                      <span class="product-itme-price">Starts from ₹${
                        acc.variants[0].price ?? "0"
                      }</span>
                    </section>
                    <section class="product-item-action">
                      <button class="product-item-btn " data-action="${
                        acc.variants.length > 1 ? "action" : "add"
                      }">Add</button>
                      <span class="product-item-add-coust"> ${
                        acc.variants.length > 1 ? "Customizable" : ""
                      }</span>
                    </section>
                  </span>
                </a>
              </section>`;

    return value;
  }

  _paginateArray(arr, perPage = PAGE_Count) {
    const totalPages = Math.ceil(arr.length / perPage); // always round up
    const pages = [];

    for (let i = 0; i < totalPages; i++) {
      const start = i * perPage;
      const end = start + perPage;
      pages.push(arr.slice(start, end));
    }

    return pages;
  }
  _truncateToOneDecimal(num) {
    return Math.floor(num * 10) / 10;
  }

  _changeUrl(url) {
    history.pushState({}, "", `${url}`);
  }
}
