import icons from "../../img/icon.svg";
import view from "./view";

class CartView extends view {
  _generateMarkup() {
    const markup = this._data.replaceAll("%{icons}%", `${icons}`);
    return `${markup}`;
  }
  _prepperPage() {
    if (!this._subData) return;
  }

  _handleCli;
}

export default new CartView();
