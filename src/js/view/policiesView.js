import icons from "../../img/icon.svg";
import view from "./view";

class PolicesView extends view {
  _generateMarkup() {
    const markup = this._data.replaceAll("%{icons}%", `${icons}`);
    return `${markup}`;
  }

  _prepperPage() {
    if (!this._subData) return;
    let data = this._subData;
  }
}

export default new PolicesView();
