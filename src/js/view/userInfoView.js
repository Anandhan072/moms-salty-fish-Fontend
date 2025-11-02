import icons from "../../img/icon.svg";
import view from "./view";

class UserInfoView extends view {
  _guestUser = `
    <span class="user-profile-name">Hello Guest</span>
    <span class="user-profile-cont">
      To access your Salty Fish account, please Sign Up
    </span>`;

  // ------------------------------------------------
  // MARKUP GENERATION
  // ------------------------------------------------
  _generateMarkup() {
    const data = this._subData?.userDate || {};

    let markup = this._data.replaceAll("%{icons}%", icons);

    console.log("check user mailid:", data.email);

    markup = markup.replace(
      "%{Profile_Url}%",
      data.email
        ? `/user-profile?id=${data._id}`
        : `/signup?redirectUrl=${encodeURIComponent("/user-profile")}`
    );

    markup = markup.replace(
      "%{Order_Url}%",
      data.email
        ? `/user-order?id=${data._id}`
        : `/signup?redirectUrl=${encodeURIComponent("/user-profile")}`
    );

    markup = markup.replace(
      "%{Delete Account}%",
      data.email
        ? `
        <li class="user-profile-li user-delete-li">
          <a href="/user-delete?id=${data._id}" class="user-profile-a user-delete-a">
            Delete Account
          </a>
        </li>`
        : ""
    );

    markup = markup.replace(
      "%{Type_Text}%",
      data.email
        ? `
          <button data-logout="/logout?id=${data._id}" 
                  class="user-profile-a user-log-out-btn">
            LOGOUT
          </button>`
        : `
          <a href="/signup" class="user-profile-a user-log-in-out-a">
            <svg class="icon icon-svg" width="20" height="20">
              <use href="${icons}#icon-log-out"></use>
            </svg>
            SIGNUP
          </a>`
    );

    return markup;
  }

  // ------------------------------------------------
  // INITIALIZATION
  // ------------------------------------------------
  _prepperPage() {
    if (!this._subData) return;
    const { userDate, authLogout } = this._subData;

    this._userNameSet(userDate);
    this._handleLogoutEvents(authLogout);
  }

  // ------------------------------------------------
  // USERNAME DISPLAY
  // ------------------------------------------------
  _userNameSet(data = {}) {
    const userProfileEl = document.querySelector(".user-profile-section-name");
    if (!userProfileEl) return;

    userProfileEl.innerHTML = data.email
      ? `
        <span class="user-profile-name">Hello User</span>
        <span class="user-profile-cont">${data.email}</span>`
      : this._guestUser;

    const loginLink = document.querySelector(".user-log-in-out-a");
    if (loginLink && !data.email) {
      const currentUrl = window.location.href;
      loginLink.setAttribute("href", `/signup?redirectUrl=${encodeURIComponent(currentUrl)}`);
    }
  }

  // ------------------------------------------------
  // LOGOUT MODAL + EVENT HANDLER
  // ------------------------------------------------
  _handleLogoutEvents(fn) {
    const logoutBtn = document.querySelector(".user-log-out-btn");
    if (!logoutBtn) return;

    const newLogoutBtn = document.querySelector(".user-log-out-btn");

    newLogoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("jkhckisjhcksh");
      this._showLogoutModal(fn);
    });
  }

  // ------------------------------------------------
  // SHOW MODAL
  // ------------------------------------------------
  _showLogoutModal(fn) {
    const body = document.body;

    // If modal already exists, remove it first
    const existingModal = document.querySelector("#logout-warning-message");
    if (existingModal) existingModal.remove();

    const warningHtml = `
      <div id="logout-warning-message">
        <div id="logout-warning-message-main">
          <div class="logout-message-cont">
            <p>Are you sure you want to logout?</p>
            <div class="logout-btns">
              <button class="logout-cancel">Cancel</button>
              <button class="logout-process">Proceed</button>
            </div>
          </div>
        </div>
      </div>`;

    body.insertAdjacentHTML("beforeend", warningHtml);
    body.style.overflow = "hidden";

    this._bindLogoutModalEvents(fn);
  }

  // ------------------------------------------------
  // MODAL BUTTON EVENTS
  // ------------------------------------------------
  _bindLogoutModalEvents(fn) {
    const modal = document.querySelector("#logout-warning-message");
    if (!modal) return;

    modal.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      if (btn.classList.contains("logout-process")) {
        document.body.style.overflowY = "scroll";
        modal.remove();
        fn?.(); // Call logout handler
      }

      if (btn.classList.contains("logout-cancel")) {
        document.body.style.overflowY = "scroll";
        modal.remove();
      }
    });
  }
}

export default new UserInfoView();
