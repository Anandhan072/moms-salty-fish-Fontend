import { ProductCard, paginateArray } from "../components/components";

import view from "./view";

class ProductItemView extends view {
  _parentElement;

  _generateMarkup() {
      console.log('kjhshjssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssskjhsk')

    const page = paginateArray(this._data);
    console.log(page)
    const count = this._getQueryParam("count");

    let markup;
    if (page.length >= 1) {
      markup = page[count - 1]
        .map((acc) => {
          return ProductCard(acc);
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
