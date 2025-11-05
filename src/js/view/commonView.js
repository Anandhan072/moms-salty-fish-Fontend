import icons from "../../img/icon.svg";
import view from "./view";

class CommonView extends view {
  _generateMarkup() {
    const markup = this._data.replaceAll("%{icons}%", `${icons}`);
    return `${markup}`;
  }
  _prepperPage() {
    if (!this._subData) return;
    this._offerContainer(this._subData.offerData);
    this._headerNavContainer(this._subData.navData);
  }

  _offerContainer(data) {
    const offer = document.querySelector(".offer-section-ul");
    const targetSize = 20;
    // repeat and trim
    let result = [];
    while (result.length < targetSize) {
      result = result.concat(this._subData.offerData);
    }
    result = result.slice(0, targetSize);

    const markup = result
      .map((acc) => {
        const { id, offerName, offerDetails } = acc;
        const { offerCode } = offerDetails || {}; // safe destructure

        return `
              <li class="offer-section-li">
                <a 
                  href="#" 
                  class="offer-section-a" 
                  data-offer-id="${id}" 
                  ${offerCode ? `data-offer-code="${offerCode}"` : ""}
                >
                  <span class="offer-section-svg">
                    <svg class="icon" width="24" height="24">
                      <use href="${icons}#icon-fish-offer"></use>
                    </svg>
                  </span>&ensp;
    
                  <span class="offer-section-span">${offerName}</span>&ensp;
    
                  <span class="offer-section-svg">
                    <svg class="icon" width="24" height="24">
                      <use href="${icons}#icon-fish-offer"></use>
                    </svg>
                  </span>
                </a>
              </li>`;
      })
      .join("");

    offer.innerHTML = "";
    offer.innerHTML = `${markup}`;
  }
  _headerNavContainer(data) {
    const mainNavEl = document.querySelector(".main-vav-link-ul");
    this.findUrlLocation();

    // ✅ Fix: add classes correctly without duplicate "class="
    const home = `<li class="main-vav-link-li">
      <a href="/home" 
         class="main-vav-link-a ${
           this._lastSegment === "home" || !this._lastSegment ? "main-vav-link-a-active" : ""
         }">
        Home
      </a>
    </li>`;

    // ✅ Fix: category highlighting based on URL

    const markupArray = data.map(
      (acc) => `<li class="main-vav-link-li">
        <a href="/product/${acc.url}" 
           class="main-vav-link-a ${
             this._loc[1] == acc._id || this._loc[1] == this.normalizeText(acc.categoryTitle)
               ? "main-vav-link-a-active"
               : ""
           }">
          ${acc.categoryTitle}
        </a>
      </li>`
    );

    // Put "Home" at the start
    markupArray.unshift(home);

    // ✅ return joined string
    // return markupArray.join("");
    mainNavEl.innerHTML = "";
    mainNavEl.innerHTML = `${markupArray.join("")}`;
  }

  _handelInterSectionObserverEvent() {
    const navContainer = document.querySelector("#header-group-main");
    let product;

    function productFun() {
      return document.querySelector("#product-sample-main");
    }
    window.addEventListener("scroll", () => {
      const scrollEl = window.pageYOffset;
      product = productFun();
      const productRect = product.getBoundingClientRect();

      // Step 1: Original position

      if (scrollEl > 125 && scrollEl < 150) navContainer.classList.add("header-transform");
      if (scrollEl <= 150) {
        navContainer.classList.remove("header-fixed");
        navContainer.style.transform = "none"; // remove any transform
      }
      // Step 2 & 3: Sticky behavior
      else if (scrollEl > 150 && productRect.y >= 200) {
        navContainer.classList.add("header-fixed");
      }
      // Step 3: Product too close → back to normal
      else if (productRect.y < 200) {
        navContainer.classList.remove("header-fixed");
        navContainer.style.transform = "none";
      }
    });
  }
}

export default new CommonView();
