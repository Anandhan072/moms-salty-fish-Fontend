// OtpVerification.js
import icons from "../../img/icon.svg";
import view from "./view";
import { Serret_Code } from "../config";

class OtpVerification extends view {
  /* =======================================================
     🧩 Generate Markup
  ======================================================= */
  _generateMarkup() {
    return this._data.replaceAll("%{icons}%", icons);
  }

  /* =======================================================
     🚀 Initialize page behavior
  ======================================================= */
  _prepperPage() {
    if (!this._subData) return;
    const { AuthUrl, userAPI, getDeviceIdFn } = this._subData;

    this._setupChangeEmail();
    this._setupOtpVerification(AuthUrl, userAPI, getDeviceIdFn);
    this._resendOtp({ AuthUrl, userAPI });
  }

  /* =======================================================
     🔁 Handle change email click
  ======================================================= */
  _setupChangeEmail() {
    const btn = document.querySelector(".otp-verification-change-email");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const previous = sessionStorage.getItem("previousPage");
      if (previous) {
        window.location.href = previous;
      } else {
        window.location.href = `${this._originUrl}?redirectUrl=${encodeURIComponent(
          this._originUrl
        )}`;
      }
    });
  }

  /* =======================================================
     🔐 Handle OTP verification
  ======================================================= */
  _setupOtpVerification(url, userAPI, getDeviceId) {
    const otpInputs = document.querySelectorAll(".otp-verification-input");
    const verifyBtn = document.querySelector(".otp-verification-otp-verify");
    if (!otpInputs.length || !verifyBtn) return;

    // 🧩 OTP input behavior
    otpInputs.forEach((input, index) => {
      input.addEventListener("input", (e) => {
        const value = e.target.value;
        if (!/^[0-9]$/.test(value)) {
          e.target.value = "";
          return;
        }
        if (value && index < otpInputs.length - 1) otpInputs[index + 1].focus();
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && index > 0) otpInputs[index - 1].focus();
      });
    });

    // 🧩 Verify OTP
    verifyBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const email = this._getQueryParam("userEmail");
      const redirectUrl = this._getQueryParam("redirectUrl") || this._originUrl;
      const otp = Array.from(otpInputs)
        .map((i) => i.value.trim())
        .join("");

      if (otp.length < otpInputs.length) {
        alert("Please enter full OTP");
        return;
      }

      const payload = {
        email,
        otp,
        deviceId: getDeviceId(),
      };

      try {
        const response = await userAPI(`${url}verify-otp`, {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
        });

        if (response.status !== "success") throw new Error("Invalid OTP");

        // Token handling
        const accessTokenValidity = 15 * 60 * 1000; // 7 days
        const access = {
          accessToken: response.accessToken,
          expireAt: Date.now() + accessTokenValidity,
        };

        localStorage.setItem("access_token", JSON.stringify(access));
        localStorage.setItem("refresh_token", JSON.stringify(response.refreshToken));
        localStorage.setItem("user_info", JSON.stringify(response.user));

        console.log("✅ OTP verified successfully");

        // Redirect quickly
        setTimeout(() => {
          window.location.assign(redirectUrl);
        }, 1500);
      } catch (err) {
        console.error("❌ OTP verification error:", err);
        alert("Invalid or expired OTP. Please try again.");
      }
    });
  }

  /* =======================================================
     🔁 Handle resend OTP
  ======================================================= */
  _resendOtp(data) {
    const reSendOtpBtn = document.querySelector(".otp-verification-resend-otp");
    if (!reSendOtpBtn) return;

    reSendOtpBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const emailId = this._getQueryParam("userEmail");
      const getRedirectUrl = this._getQueryParam("redirectUrl") || this._originUrl;

      const payload = { email: emailId };

      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      };

      console.log(options);
      try {
        const response = await data.userAPI(`${data.AuthUrl}request-otp`, options);

        if (response.status !== "success") {
          throw new Error("Failed to resend OTP. Please try again.");
        }

        const access_token = {
          accessToken: response.accessToken,
          expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
        };

        localStorage.setItem("access_token", JSON.stringify(access_token));
        localStorage.setItem("refresh_token", JSON.stringify(response.refreshToken));

        // redirect to OTP page again
        const newUrl = `${
          this._originUrl
        }auth/otp-verification?userEmail=${emailId}&redirectUrl=${encodeURIComponent(
          getRedirectUrl
        )}`;

        this._changeUrl(newUrl);
        window.location.reload();
      } catch (err) {
        console.error("❌ Resend OTP Error:", err);
        alert("Something went wrong while resending OTP.");
      }
    });
  }
}

export default new OtpVerification();
