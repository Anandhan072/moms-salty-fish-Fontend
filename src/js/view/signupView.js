import icons from "../../img/icon.svg";
import view from "./view";

class SignupView extends view {
  _generateMarkup() {
    const markup = this._data.replaceAll("%{icons}%", `${icons}`);
    return `${markup}`;
  }
  _prepperPage() {
    if (!this._subData) return;

    const data = this._subData;

    this._signUpHandler(this._subData.AuthUrl, this._subData.userAPI);
  }

  _signUpHandler(url, fn) {
    const formEl = document.querySelector(".login-page-input-form-cont");

    formEl.addEventListener("submit", async (a) => {
      a.preventDefault();

      const emailId = document.querySelector("#email_id").value.trim();
      const payload = {
        email: emailId,
      };
      const options = {
        method: "POST",
        body: payload,
      };

      const val = await fn(`${url}request-otp`, options);

      console.log("OTP Request Response:", val);

      const getRedirectUrl = this._getQueryParam("redirectUrl");
      console.log("redirectUrl:", getRedirectUrl);

      this._changeUrl(
        `${
          this._originUrl
        }auth/otp-verification?userEmail=${emailId}&redirectUrl=${encodeURIComponent(
          getRedirectUrl || this._originUrl
        )}`
      );
      location.reload();
    });
  }
}

export default new SignupView();
