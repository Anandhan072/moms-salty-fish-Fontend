import { ProductCard } from "../components/components.js";
import {optimizeImage} from "../utils/dom"
import icons from "../../img/icon.svg";
import view from "./view";

class HomeView extends view {
  _currentIndex = 0;
  _interval;

  _generateMarkup() {
    const markup = this._data.replaceAll("%{icons}%", icons);
    this._parentElement = document.querySelector("#main");
    return markup;
  }

  _prepperPage() {
    const { bannerList, nav, items } = this._subData;

    this._renderBannerList(bannerList);
    this._initBannerSlider();
    this._renderProductSections(nav, items);
    this._initProductScroll();
  }

  /* -----------------------------------------
       BANNERS
  ------------------------------------------ */

  _renderBannerList(list) {
    const bannerEl = document.querySelector(".video-banner");
    if (!bannerEl || !list?.length) return;

    bannerEl.innerHTML = list
      .map((item) => {
    console.log(item)
        const hasMap = item.map
          ? `
            <a href="${item.map}" target="_parent">
              <svg class="icon" width="20" height="24">
                <use href="${icons}#icon-map"></use>
              </svg>
            </a>`
          : "";

        const button = item.button
          ? `<a href="#" class="visit-more" data-banner-id="${item._id}">${item.button}</a>`
          : "";

        return `
        <div class="banner-cont" data-banner-id="${item._id}">
          <video src="${item.video}" autoplay loop muted playsinline class="video-banner-cont">
            <img src="${item.image}" alt="Fallback image" />
          </video>

          <div class="video-descriptions">
            <div class="video-descriptions-cont">
              <mark>My ${item.title} &ensp; ${hasMap}</mark>
              <code>${item.descriptions}</code>
              ${button}
            </div>
          </div>
        </div>`;
      })
      .join("");
  }

  _initBannerSlider() {
    const slides = document.querySelectorAll(".banner-cont");
    const total = slides.length;
    if (!total) return;

    const updatePosition = () => {
      slides.forEach((slide, i) => {
        slide.style.transform = `translateX(${(i - this._currentIndex) * 100}%)`;
      });
    };

    const next = () => {
      this._currentIndex = (this._currentIndex + 1) % total;
      updatePosition();
    };

    const prev = () => {
      this._currentIndex = (this._currentIndex - 1 + total) % total;
      updatePosition();
    };

    document.querySelector(".banner-btn-right")?.addEventListener("click", () => {
      next();
      this._restartSlider(next);
    });

    document.querySelector(".banner-btn-left")?.addEventListener("click", () => {
      prev();
      this._restartSlider(next);
    });

    updatePosition();
    this._interval = setInterval(next, 5000);
  }

  _restartSlider(fn) {
    clearInterval(this._interval);
    this._interval = setInterval(fn, 5000);
  }

  /* -----------------------------------------
       PRODUCTS
  ------------------------------------------ */

  _renderProductSections(nav, items) {
    const parent = document.querySelector(".product-sample-items");
    if (!parent) return;

    parent.innerHTML = nav
      .map((cat) => {
        const categoryKey = this.normalizeText(cat.categoryTitle);
        const productCards = this._buildProductCards(items, cat._id);

        if (!productCards) return "";

        return `
        <section class="product-section product-section-${categoryKey}">
          <header class="product-variates">
            <a href="/product/${cat._id}" data-id="${cat._id}">
              ${cat.categoryTitle} Product
            </a>
          </header>

          <div class="product-container-btn">
            <div class="product-container-left-btn">
              <button class="product-btn product-btn-${categoryKey}" data-move="-">
                <svg class="icon" width="10" height="15">
                  <use href="${icons}#icon-left-arrow"></use>
                </svg>
              </button>
            </div>

            <div class="product-container-right-btn">
              <button class="product-btn product-btn-${categoryKey}" data-move="+">
                <svg class="icon" width="10" height="15">
                  <use href="${icons}#icon-right-arrow"></use>
                </svg>
              </button>
            </div>
          </div>

          <div class="product-containers" data-transform="0">
            ${productCards}
          </div>
        </section>`;
      })
      .join("");
  }

  _buildProductCards(items, categoryId) {

    const itemsEl = items.map(acc => {
      acc.mainPhoto = optimizeImage(acc.mainPhoto, 300, 200)
      return acc
    })

    console.log(itemsEl)
  
    return items
      .filter((i) => i.category == categoryId)
      .map((item) => ProductCard(item))
      .join("");
  }

  /* -----------------------------------------
       PRODUCT SCROLL
  ------------------------------------------ */

  _initProductScroll() {
    document.querySelectorAll(".product-section").forEach((section) => {
      const container = section.querySelector(".product-containers");
      const btnLeft = section.querySelector(".product-container-left-btn button");
      const btnRight = section.querySelector(".product-container-right-btn button");

      if (!container) return;

      btnLeft.style.display = "none"; // hide left initially

      const computeWidths = () => {
        const containerWidth = container.clientWidth;
        const contentWidth = [...container.children].reduce((sum, el) => {
          const margin = parseInt(getComputedStyle(el).marginRight) || 0;
          return sum + el.offsetWidth + margin;
        }, 0);

        return { containerWidth, contentWidth };
      };

      const updateButtons = () => {
        const { containerWidth, contentWidth } = computeWidths();
        const transform = Number(container.dataset.transform) || 0;

        btnLeft.style.display = transform < 0 ? "block" : "none";
        btnRight.style.display =
          Math.abs(transform) + containerWidth < contentWidth ? "block" : "none";
      };

      const slide = (dir) => {
        const { containerWidth, contentWidth } = computeWidths();
        let transform = Number(container.dataset.transform) || 0;

        if (dir === "+") {
          const maxMove = contentWidth - containerWidth + transform;
          transform -= Math.min(containerWidth, maxMove);
        } else {
          transform = Math.min(transform + containerWidth, 0);
        }

        container.dataset.transform = transform;
        container.style.transform = `translateX(${transform}px)`;
        updateButtons();
      };

      btnLeft?.addEventListener("click", () => slide("-"));
      btnRight?.addEventListener("click", () => slide("+"));

      updateButtons(); // initial check
    });
  }
}

export default new HomeView();
