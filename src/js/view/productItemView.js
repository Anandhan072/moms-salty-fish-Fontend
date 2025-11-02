import view from "./view";

class ProductItemView extends view {
  _parentElement;

  _generateMarkup() {
    const page = this._paginateArray(this._data);
    const count = this._getQueryParam("count");

    let markup;
    if (page.length >= 1) {
      markup = page[count - 1]
        .map((acc) => {
          return this._itemCart(acc);
        })
        .join("");
    }

    if (page.length === 0) {
      markup = `<p>No Item Founded </p>`;
    }

    this._setParentElement("#product-containers");

    return markup;
  }
}

export default new ProductItemView();
