import { PAGE_Count, MAX_PRICE } from "../config";
import {optimizeImage} from "../utils/dom"
import icons from "../../img/icon.svg";
import view from "./view";
import productItemView from "./productItemView";

/* ---------------------------------------------------
   🔥 Auto Image Optimizer — Cloudinary
--------------------------------------------------- */


class ProductCartView extends view {
  _parentElement;
  _allItems = [];      // original list from DB
  _filteredItems = []; // after filter
  _filterFn = null;

  /* ---------------------------------------------------
     Build HTML with SVG icons
  --------------------------------------------------- */
  _generateMarkup() {
    return this._data.replaceAll("%{icons}%", `${icons}`);
  }

  /* ---------------------------------------------------
     Main Entry from Controller
  --------------------------------------------------- */
  _prepperPage() {
    if (!this._subData) return;

    this._allItems = this._subData.filteredItems || [];
    this._filteredItems = [...this._allItems];
    this._filterFn = this._subData.filterFun;

    // initialize pages
    this._urlContainer(this._allItems.length);

    this._renderCurrentPage();
    this._pageCount();
    this._filterCont(this._allItems, this._filterFn);
    this._handelPageEvent(this._allItems);
  }

  /* ---------------------------------------------------
     URL Breadcrumb Builder
  --------------------------------------------------- */
  _urlContainer(total) {
    const urlContEl = document.querySelector(".url-page-ul-link");
    this.findUrlLocation();
    const locs = this._loc || [];

    let markup = `
      <li class="url-page-li-link">
        <a href="/home" class="url-page-a-link">Home</a>
      </li>
    `;

    if (locs.length === 1 || !locs[1]) {
      if (locs[0]) {
        markup += `
          <li class="url-page-li-link">
            <a href="/${locs[0]}" class="url-page-a-link">${locs[0]}</a>
          </li>`;
      }
    } else {
      for (let i = 0; i < locs.length; i++) {
        const path = "/" + locs.slice(0, i + 1).join("/");
        markup += `
          <li class="url-page-li-link">
            <a href="${path}" class="url-page-a-link">${locs[i]}</a>
          </li>`;
      }
    }

    const totalPage = Math.ceil(total / PAGE_Count) || 1;
    this._updateQueryParam("count", 1);
    this._updateQueryParam("total", totalPage);

    urlContEl.innerHTML = markup;
  }

  /* ---------------------------------------------------
     Pagination Button Rendering
  --------------------------------------------------- */
  _pageCount() {
    const pageCountEl = document.querySelector(".btn-page-section-count");
    const totalPage = Number(this._getQueryParam("total")) || 1;
    const currentPage = Number(this._getQueryParam("count")) || 1;

    const maxButtons = 10;
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
      const active = i === currentPage ? "active" : "";
      markup += `
        <span class="btn-page-control-btn ${active ? `btn-page-control-btn-active` : ""}" 
              data-count="${i}">
          ${i}
        </span>`;
    }

    pageCountEl.innerHTML = markup;
  }

  /* ---------------------------------------------------
     MAIN — render only CURRENT PAGE Items
  --------------------------------------------------- */
  _renderCurrentPage() {
    const currentPage = Number(this._getQueryParam("count")) || 1;

    const start = (currentPage - 1) * PAGE_Count;
    const end = start + PAGE_Count;

    const pageItems = this._filteredItems.slice(start, end).map(p => ({
      ...p,
      image: optimizeImage(p.image, 300, 300), // 🔥 auto optimize cloudinary image
    }));

    console.log('ksjhdohkdbskjb')
    productItemView.render(pageItems);
  }

  /* ---------------------------------------------------
     Pagination Events (prev, next, number buttons)
  --------------------------------------------------- */
  _handelPageEvent() {
    console.log('kjshiuh')
    const prevBtn = document.querySelector(".btn-page-section-preview-btn");
    const nextBtn = document.querySelector(".btn-page-section-next-btn");

    const updateButtons = () => {
      const current = Number(this._getQueryParam("count"));
      const total = Number(this._getQueryParam("total"));

      prevBtn.style.display = current > 1 ? "inline-block" : "none";
      nextBtn.style.display = current < total ? "inline-block" : "none";
    };

    const changePage = (newPage) => {
      this._updateQueryParam("count", newPage);
      this._pageCount();
      this._renderCurrentPage();
      updateButtons();
    };

    // Number buttons
    this._parentElement = document.querySelector(".btn-page-section-count");
    this._parentElement.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-page-control-btn");
      if (!btn) return;
      changePage(Number(btn.dataset.count));
    });

    // Prev
    prevBtn.addEventListener("click", () => {
      const cur = Number(this._getQueryParam("count"));
      if (cur > 1) changePage(cur - 1);
    });

    // Next
    nextBtn.addEventListener("click", () => {
      const cur = Number(this._getQueryParam("count"));
      const total = Number(this._getQueryParam("total"));
      if (cur < total) changePage(cur + 1);
    });

    updateButtons();
  }

  /* ---------------------------------------------------
     Query Param Helpers
  --------------------------------------------------- */
  _getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  _updateQueryParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, "", url);
  }

  /* ---------------------------------------------------
     Filtering System
  --------------------------------------------------- */
  _filterCont(items, fn) {
    const queryOption = {
      category: null,
      subcategory: null,
      inStock: null,
      priceMin: 0,
      priceMax: MAX_PRICE,
      sortBy: null,
    };

    const applyFilters = () => {
      this._filteredItems = fn(items, queryOption);
      const totalPage = Math.ceil(this._filteredItems.length / PAGE_Count) || 1;
      this._updateQueryParam("total", totalPage);
      this._updateQueryParam("count", 1);

      this._pageCount();
      this._renderCurrentPage();
    };

    /* ------------------------
       Availability Filter
    ------------------------ */
    const sup_availability = document.querySelector(".available-filter-div");
    sup_availability.addEventListener("click", (e) => {
      const clicked = e.target.closest(".available-filter-div-stock");
      if (!clicked) return;

      const val = clicked.dataset.stock;
      queryOption.inStock = val;

      sup_availability.querySelectorAll("use").forEach(el =>
        el.setAttribute("href", "/src/img/icon.svg#icon-radio")
      );

      clicked.querySelector("use").setAttribute("href", "/src/img/icon.svg#icon-radio-check");

      applyFilters();
    });

    /* ------------------------
       Price Filter
    ------------------------ */
    const subPrice = document.querySelector(".filter-price-div");
    subPrice.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;

      const startInput = document.getElementById("filter-price-start");
      const endInput = document.getElementById("filter-price-end");

      const min = Number(startInput.value) || 0;
      const max = Number(endInput.value) || MAX_PRICE;

      queryOption.priceMin = min;
      queryOption.priceMax = max;

      applyFilters();
    });

    /* ------------------------
       Sort Filter
    ------------------------ */
    const subSort = document.querySelector(".filter-sort-by-div");
    subSort.addEventListener("click", (e) => {
      const el = e.target.closest(".filter-sort-by-div-name");
      if (!el) return;

      const sortType = el.dataset.method;
      queryOption.sortBy = sortType;

      subSort.querySelectorAll("use").forEach(el =>
        el.setAttribute("href", "/src/img/icon.svg#icon-radio")
      );
      el.querySelector("use").setAttribute("href", "/src/img/icon.svg#icon-radio-check");

      applyFilters();
    });
  }
}

export default new ProductCartView();



