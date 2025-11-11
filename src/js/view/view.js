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

  _truncateToOneDecimal(num) {
    return Math.floor(num * 10) / 10;
  }

  _changeUrl(url) {
    history.pushState({}, "", `${url}`);
  }
}
