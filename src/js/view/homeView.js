import icons from "../../img/icon.svg";
import view from "./view";

class HomeView extends view {
  _transformValue = 0;
  _currentIndex = 0;
  _interval;
  _parentElement;
  _generateMarkup() {
    this._parentElement = document.querySelector("#main");
    const markup = this._data.replaceAll("%{icons}%", `${icons}`);
    return `${markup}`;
  }

  _prepperPage() {
    const { bannerList, nav, items } = this._subData;
    this._bannerList(bannerList);
    this._bannerClick();
    this._itemsView(nav, items);
    this._handleClickEvent();
  }
  /// banner //
  _bannerList(banner) {
    const bannerEl = document.querySelector(".video-banner");

    const markup = banner
      .map((acc) => {
        return `<div class="banner-cont" data-banner-id="${acc._id}">
            <video
              src="${acc.video}"
              width="100%"
              autoplay
              loop
              muted
              playsinline
              class="video-banner-cont"
            >
              <img src="${acc.image}" alt="Fallback image" />
            </video>

            <div class="video-descriptions">
              <div class="video-descriptions-cont">
                <mark
                  >My ${acc.title} &ensp; ${
          acc.map
            ? `  <a
                    href="${acc.map}"
                    target="_parent"
                  >
                    <svg class="icon" width="20" height="24">
                      <use href="./src/img/icon.svg#icon-map"></use>
                    </svg> </a
                >`
            : ""
        }
                </mark>
                <code
                  >${acc.descriptions}</code
                >
                ${
                  acc.button
                    ? ` <a href="#" class="visit-more" data-banner-id="${acc._id}">${acc.button}</a>`
                    : ""
                }
               
              </div>
            </div>
          </div>`;
      })
      .join("");

    bannerEl.innerHTML = "";
    bannerEl.innerHTML = `${markup}`;
  }

  _bannerClick() {
    const slides = document.querySelectorAll(".banner-cont");
    const total = slides.length;

    const show = () =>
      slides.forEach((s, i) => {
        s.style.transform = `translateX(${(i - this._currentIndex) * 100}%)`;
      });

    show();

    const next = () => {
      this._currentIndex = (this._currentIndex + 1) % total;
      show();
    };

    const prev = () => {
      this._currentIndex = (this._currentIndex - 1 + total) % total;
      show();
    };

    document.querySelector(".banner-btn-right").onclick = () => {
      next();
      this._restart(next);
    };

    document.querySelector(".banner-btn-left").onclick = () => {
      prev();
      this._restart(next);
    };

    this._interval = setInterval(next, 5000);
  }

  _restart(fn) {
    clearInterval(this._interval);
    this._interval = setInterval(fn, 5000);
  }

  /// banner //

  // items //

  _itemsView(nav, items) {
    const productView = document.querySelector(".product-containers");
    const parentElement = document.querySelector(".product-sample-items");

    const markup = nav
      .map((acc) => {
        const val = this.normalizeText(acc.categoryTitle);
        const subElement = this._subGenerateMarkup(items, acc._id);

        if (!subElement) return;

        return `<section class="product-section product-section-${val}">
              <header class="product-variates"><a href="/product/${acc._id}" data-id="${acc._id}">${acc.categoryTitle} Product</a></header>
              <div class="product-container-btn">
                <div class="product-container-left-btn">
                  <button class="product-btn product-btn-${val}" data-move="-">
                    <svg class="icon" width="10" height="15">
                      <use href="./src/img/icon.svg#icon-left-arrow"></use>
                    </svg>
                  </button>
                </div>
                <div class="product-container-right-btn">
                  <button class="product-btn product-btn-${val} " data-move="+">
                    <svg class="icon" width="10" height="15">
                      <use href="./src/img/icon.svg#icon-right-arrow"></use>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="product-containers" data-transform="0">
             ${subElement}
              </div>
            </section>`;
      })
      .join("");

    parentElement.innerHTML = "";
    parentElement.innerHTML = `${markup}`;
  }

  _subGenerateMarkup(value, id) {
    const markup = value
      .filter((val) => val.category == id) // keep only matching category
      .map((acc) => {
        return this._itemCart(acc);
      })
      .join("");

    return markup;
  }

  _handleClickEvent() {
    document.querySelectorAll(".product-section").forEach((section) => {
      const container = section.querySelector(".product-containers");
      const btnLeft = section.querySelector(".product-container-left-btn button");
      const btnRight = section.querySelector(".product-container-right-btn button");

      // Initially hide left button
      btnLeft.style.display = "none";

      const updateButtons = () => {
        const containerWidth = container.clientWidth;
        const contentWidth = Array.from(container.children).reduce(
          (sum, child) => sum + child.offsetWidth + parseInt(getComputedStyle(child).marginRight),
          0
        );

        const transformX = Number(container.dataset.transform) || 0;

        // Show/hide left button
        btnLeft.style.display = transformX < 0 ? "block" : "none";

        // Show/hide right button
        btnRight.style.display =
          Math.abs(transformX) + containerWidth < contentWidth ? "block" : "none";
      };

      const moveContainer = (direction) => {
        const containerWidth = container.clientWidth;
        const contentWidth = Array.from(container.children).reduce(
          (sum, child) => sum + child.offsetWidth + parseInt(getComputedStyle(child).marginRight),
          0
        );

        let transformX = Number(container.dataset.transform) || 0;

        if (direction === "+") {
          // Calculate max possible move
          const maxMove = contentWidth - containerWidth + transformX;
          const move = Math.min(containerWidth, maxMove);
          transformX -= move; // move left
        } else {
          // move right
          transformX = Math.min(transformX + containerWidth, 0); // cannot go beyond 0
        }

        container.dataset.transform = transformX;
        container.style.transform = `translateX(${transformX}px)`;
        updateButtons();
      };

      btnLeft.addEventListener("click", (e) => {
        e.preventDefault();
        moveContainer("-");
      });

      btnRight.addEventListener("click", (e) => {
        e.preventDefault();
        moveContainer("+");
      });

      // Initial check
      updateButtons();
    });
  }
}

export default new HomeView();
