import icons from "../../img/icon.svg";
import view from "./view";

class UserProfileView extends view {
  _noAddress = `<section class="address-warning">No Address Available!</section>`;

  // Generates markup by replacing icon placeholders
  _generateMarkup() {
    if (!this._data) return "";
    return this._data.replaceAll("%{icons}%", `${icons}`);
  }

  // Initializes the page with data
  _prepperPage() {
    if (!this._subData || !this._subData.userData) return;

    const data = this._subData.userData;
    this._updateUserInfo(data);
    this._updateUserAddress(data.address);
    this._editUserInfo(data);
    this._handleUserInfoButtons(data);
  }

  // Updates all user info sections with current data
  _updateUserInfo(userData) {
    const sections = document.querySelectorAll(".user-input-section");
    sections.forEach((section) => {
      const dataAttr = section.dataset.userData;
      const span = section.querySelector("span");
      if (!span) return;

      span.innerHTML = userData[dataAttr] ?? "No Data";
    });
  }

  // Updates address section
  _updateUserAddress(address) {
    const addAddress = document.querySelector(".address-section");
    if (!addAddress) return;

    if (!address || !address.length) {
      addAddress.innerHTML = this._noAddress;
      return;
    }

    addAddress.innerHTML = address
      .map(
        (addr) => `
          <div class="user-address">
            <span>${addr.street ?? ""}</span>,
            <span>${addr.city ?? ""}</span>
          </div>`
      )
      .join("");
  }

  // Enables editing of user info
  _editUserInfo(userData) {
    const editBtn = document.querySelector(".user-info-edit");
    if (!editBtn) return;

    editBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const btnSection = document.querySelector(".user-info-btn-section");
      if (btnSection) btnSection.style.display = "block";

      const sections = document.querySelectorAll(".user-input-section");

      sections.forEach((section, i) => {
        const dataAttr = section.dataset.userData;
        const span = section.querySelector("span");

        if (!span) return;

        // First field is non-editable
        if (i === 0) {
          span.style.opacity = 0.5;
          return;
        }

        const inputType = dataAttr === "name" ? "text" : "number";
        const inputAttributes = dataAttr === "phoneNumber" ? 'max="9999999999" min="0"' : "";

        const currentValue = userData[dataAttr] ?? "";

        // Create input with both class and id for easier selection
        span.innerHTML = `<input
          type="${inputType}"
          class="${dataAttr}_input"
          id="${dataAttr}_input"
          name="${dataAttr}"
          placeholder="Enter ${dataAttr}"
          ${inputAttributes}
          value="${currentValue}"
        />`;
      });
    });
  }

  // Handles save and cancel button actions
  _handleUserInfoButtons(userData) {
    const buttons = document.querySelectorAll(".user-info-btn");
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        if (!action) return;

        const btnSection = document.querySelector(".user-info-btn-section");

        if (action === "cancel") {
          // Reset to original data
          this._updateUserInfo(userData);
          if (btnSection) btnSection.style.display = "none";
          return;
        }

        if (action === "update") {
          // Collect new values from inputs
          const updatedData = {};
          document.querySelectorAll(".user-input-section").forEach((section, i) => {
            if (i === 0) return; // skip first field
            const dataAttr = section.dataset.userData;
            const input = section.querySelector("input");
            if (input) updatedData[dataAttr] = input.value.trim();
          });

          // Merge updated fields into the original userData object
          Object.assign(userData, updatedData);

          console.log("✅ Updated User Data:", userData);

          // Refresh UI
          this._updateUserInfo(userData);
          if (btnSection) btnSection.style.display = "none";
        }
      });
    });
  }
}

export default new UserProfileView();
