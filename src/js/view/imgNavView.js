import view from "./view";
class ImgNavView extends view {
  _parentElement = document.querySelector("#header-group");
  _loc;
  _lastSegment;

  _generateMarkup() {
    return this._data;
  }

  _prepperPage() {
    this._categoryView();
  }

  _categoryView() {
    let markup = ``;
    const productEl = document.querySelector("#product-nav");
    this.findUrlLocation();

    const { _subData, _lastSegment } = this;

    // Handle base cases
    if (_lastSegment === "home" || !_lastSegment || _lastSegment === "product") {
      markup = this._renderCategories(_subData);
    }

    // Try to find category by URL slug
    const category = _subData.find((cat) => cat.url === _lastSegment);

    if (!category && !markup) {
      markup = `<p class="not-found">Category not found</p>`;
      console.log("lsknlk");
    }

    if (category && !markup) {
      markup = this._renderSubCategories(category);
    }

    productEl.innerHTML = "";
    productEl.innerHTML = `${markup}`;
  }

  /**
   * Render top-level categories
   */
  _renderCategories(categories) {
    if (!Array.isArray(categories) || categories.length === 0) {
      return `<p class="empty">No categories available</p>`;
    }

    return categories
      .map(
        (cat) => `
          <div class="product-img">
            <a href="/product/${cat.url}" data-category="${cat._id}">
              <img src="${cat.image}" alt="${cat.categoryTitle}" loading="lazy" />
              <span>${cat.categoryTitle}</span>
            </a>
          </div>`
      )
      .join("");
  }

  /**
   * Render subcategories for a given category
   */
  _renderSubCategories(category) {
    const { subCategories } = category;

    if (!Array.isArray(subCategories) || subCategories.length === 0) {
      return `<p class="empty">No subcategories available</p>`;
    }

    return subCategories
      .map(
        (sub) => `
          <div class="product-img">
            <a href="/product/${category.url}/${sub.url}" data-category="${sub._id}">
              <img src="${sub.image}" alt="${sub.title}" loading="lazy" />
              <span>${sub.title}</span>
            </a>
          </div>`
      )
      .join("");
  }
}

export default new ImgNavView();
