import { PAGE_Count, MAX_PRICE } from "../config";
import icons from "../../img/icon.svg";
import view from "./view";
import productItemView from "./productItemView";

class ProductCartView extends view {
  _parentElement;
  _generateMarkup() {
    const markup = this._data.replaceAll("%{icons}%", `${icons}`);
    return `${markup}`;
  }

  _prepperPage() {
    if (!this._subData) return;

    this._urlContainer(this._subData.filterLength);
    this._pageCount(this._subData.filteredItems);
    this._filterCont(this._subData.filteredItems, this._subData.filterFun);
    this._handelPageEvent(this._subData.filteredItems);
  }

  _urlContainer(page) {
    const urlContEl = document.querySelector(".url-page-ul-link");

    this.findUrlLocation();

    const locs = this._loc || [];
    let markup = "";

    // Always add default Home
    markup += `
          <li class="url-page-li-link">
            <a href="/home" class="url-page-a-link">Home</a>
          </li>`;

    // Case: only one value or second value empty
    if (locs.length === 1 || !locs[1]) {
      if (locs[0]) {
        markup += `
              <li class="url-page-li-link">
                <a href="/${locs[0]}" class="url-page-a-link">${locs[0]}</a>
              </li>`;
      }
    } else {
      // Otherwise loop all segments
      for (let i = 0; i < locs.length; i++) {
        const path = "/" + locs.slice(0, i + 1).join("/");

        markup += `
              <li class="url-page-li-link">
                <a href="${path}" class="url-page-a-link">${locs[i]}</a>
              </li>`;
      }
    }
    this._updateQueryParam("count", 1);
    this._updateQueryParam("total", page / PAGE_Count > 1 ? Math.ceil(page / PAGE_Count) : 1);
    urlContEl.innerHTML = "";
    urlContEl.innerHTML = `${markup}`;
  }

  //pageCount

  _pageCount() {
    const pageCountEl = document.querySelector(".btn-page-section-count");
    const totalPage = Number(this._getQueryParam("total")) || 1;
    const currentPage = Number(this._getQueryParam("count")) || 1;
    const maxButtons = 10; // max visible buttons
    let startPage = 1;
    let endPage = totalPage;

    if (totalPage > maxButtons) {
      startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      endPage = startPage + maxButtons - 1;

      if (endPage > totalPage) {
        endPage = totalPage;
        startPage = endPage - maxButtons + 1;
      }
    }

    let markup = "";

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? "active" : "";
      markup += `
        <span class="btn-page-control-btn  ${
          activeClass ? `btn-page-control-btn-${activeClass}` : ""
        }" data-count="${i}">
          ${i}
        </span>`;
    }

    pageCountEl.innerHTML = "";
    pageCountEl.innerHTML = `${markup}`;
  }

  _handelPageEvent(data) {
    const prevBtn = document.querySelector(".btn-page-section-preview-btn");
    const nextBtn = document.querySelector(".btn-page-section-next-btn");

    if (!prevBtn || !nextBtn) return;

    const updateButtons = () => {
      const currentPage = Number(this._getQueryParam("count")) || 1;
      const totalPage = Number(this._getQueryParam("total")) || 1;

      // Hide both buttons if no page or only 1 page
      if (currentPage === "No Page" || totalPage <= 1) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        return;
      }

      prevBtn.style.display = currentPage > 1 ? "inline-block" : "none";
      nextBtn.style.display = currentPage < totalPage ? "inline-block" : "none";
    };

    const changePage = (newPage) => {
      this._updateQueryParam("count", newPage);

      this._pageCount(); // re-render page buttons (sliding window)

      updateButtons();

      // Re-render products
      if (data) productItemView.render(data);
    };

    // Initial render
    const currentPage = Number(this._getQueryParam("count")) || 1;
    updateButtons();
    productItemView.render(data);

    // Browser back/forward
    window.addEventListener("popstate", () => {
      const currentPage = Number(this._getQueryParam("count")) || 1;
      this.render();
      updateButtons();
      productItemView.render(data);
    });

    // Page buttons click
    this._parentElement = document.querySelector(".btn-page-section-count");
    this._parentElement.addEventListener("click", (e) => {
      const target = e.target.closest(".btn-page-control-btn");
      if (!target) return;
      changePage(Number(target.dataset.count));
    });

    // Previous button
    prevBtn.addEventListener("click", () => {
      const currentPage = Number(this._getQueryParam("count")) || 1;
      if (currentPage > 1) changePage(currentPage - 1);
    });

    // Next button
    nextBtn.addEventListener("click", () => {
      const currentPage = Number(this._getQueryParam("count")) || 1;
      const totalPage = Number(this._getQueryParam("total")) || 1;
      if (currentPage < totalPage) changePage(currentPage + 1);
    });
  }
  _getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }
  _updateQueryParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, "", url);
  }

  //filter option
  _filterCont(val, fn) {
    const queryOption = {
      category: null,
      subcategory: null,
      inStock: null, // "in-stock", "out-of-stock", or null
      priceMin: 0,
      priceMax: MAX_PRICE,
      sortBy: null, // "date", "price", "a-z", "z-a"
    };

    let data = fn(val, queryOption);

    /* ------------------------------
           🔹 Helper: reset radio icons
        -------------------------------*/
    const resetIcons = (selector) => {
      document.querySelectorAll(`${selector} use`).forEach((useEl) => {
        useEl.setAttribute("href", "/src/img/icon.svg#icon-radio");
      });
    };

    /* ------------------------------
           🔹 Availability Filter
        -------------------------------*/
    const sup_availability = document.querySelector(".available-filter-div");
    const availability = document.querySelector(".filter-availability");
    let activeStock = "all-item";

    sup_availability.addEventListener("click", (e) => {
      const clicked = e.target.closest(".available-filter-div-stock");
      if (!clicked) return;

      const stockValue = clicked.dataset.stock;
      if (stockValue === activeStock) return; // no change

      resetIcons(".available-filter-div-stock");

      const useIcon = clicked.querySelector("use");
      if (useIcon) useIcon.setAttribute("href", "/src/img/icon.svg#icon-radio-check");

      availability.dataset.stock = stockValue;
      queryOption.inStock = stockValue;

      data = fn(val, queryOption);
      productItemView.render(data);

      activeStock = stockValue;
    });

    /* ------------------------------
           🔹 Price Filter
        -------------------------------*/
    const sub_Price = document.querySelector(".filter-price-div");

    sub_Price.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;

      let startVal = 0;
      let endVal = MAX_PRICE;

      document.querySelectorAll(".filter-price-div input").forEach((input) => {
        if (input.id === "filter-price-start") {
          startVal = parseInt(input.value, 10) || 0;
          endVal = parseInt(document.getElementById("filter-price-end")?.value, 10) || MAX_PRICE;

          if (startVal > endVal) input.value = endVal;
          if (startVal < 0) input.value = 0;

          startVal = parseInt(input.value, 10);
        }

        if (input.id === "filter-price-end") {
          endVal = parseInt(input.value, 10) || MAX_PRICE;

          if (endVal > MAX_PRICE) input.value = MAX_PRICE;

          const startInput = document.getElementById("filter-price-start");
          const startValCheck = parseInt(startInput?.value, 10) || 0;

          if (endVal < startValCheck) input.value = startValCheck;

          endVal = parseInt(input.value, 10);
        }
      });

      queryOption.priceMin = startVal || 0;
      queryOption.priceMax = endVal;

      data = fn(val, queryOption);
      productItemView.render(data);
    });

    /* ------------------------------
           🔹 Sort Filter
        -------------------------------*/
    const sub_Sort = document.querySelector(".filter-sort-by-div");
    const sort = document.querySelector(".filter-sort-by");

    sub_Sort.addEventListener("click", (e) => {
      const el = e.target.closest(".filter-sort-by-div-name");
      if (!el) return;

      const sortType = el.dataset.method;

      resetIcons(".filter-sort-by-div-name");

      const useIcon = el.querySelector("use");
      if (useIcon) useIcon.setAttribute("href", "/src/img/icon.svg#icon-radio-check");

      queryOption.sortBy = sortType;
      sort.dataset.method = sortType;

      data = fn(val, queryOption);
      productItemView.render(data);
    });
  }
}

export default new ProductCartView();
