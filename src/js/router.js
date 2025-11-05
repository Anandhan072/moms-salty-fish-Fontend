// router.js
import {
  commonViewControllerHome,
  homePage,
  allProduct,
  singleProduct,
  signupPage,
  otpVerification,
  UserProfileController,
  policesController,
} from "./controller.js";

import { getNavAPIByID } from "./productModule.js";
import { checkUserIsActive } from "./userModule.js";
import { API_Category } from "./config.js";

// 🧭 Define routes
const routes = {
  "": homePage,
  home: homePage,
  product: allProduct,
  fish: allProduct,
  dryfish: allProduct,
  item: singleProduct,
  signup: signupPage,
  otpVerification: otpVerification,
  polices: policesController,
  userProfile: UserProfileController,
  firstRun: async () => await commonViewControllerHome(),
};

let routerInitialized = false;

export const router = async () => {
  try {
    const parts = window.location.pathname.split("/").filter(Boolean);
    let path = parts[0] || "home";

    // Skip firstRun for these pages
    const skipFirstRun = ["signup", "auth", "otpVerification"];
    if (!skipFirstRun.includes(path)) await routes.firstRun();

    // 🧩 Handle /product/:slug
    if (path === "product" && parts[1]) {
      const productData = await getNavAPIByID(`${API_Category}?url=${parts[1]}`);
      if (productData) {
        path = productData?.url?.replace(/-/g, "") || "product";
      }
    }

    // 🧩 Handle /item/:id
    else if (parts.includes("item")) {
      path = "item";
    }

    // 🧩 Handle /auth/otp-verification
    else if (path === "auth" && parts[1] === "otp-verification") {
      path = "otpVerification";
    }

    // 🧩 Handle /policy
    else if (path === "policy") {
      path = parts.length >= 2 ? "privacyPolicy" : "";
    }

    // ✅ Check user login state
    const isLoggedIn = await checkUserIsActive();

    // 🚫 If logged-in → block auth pages
    if (isLoggedIn && ["signup", "otpVerification"].includes(path)) {
      console.info("🔒 Logged-in user redirected to home");
      return navigateTo("/home");
    }

    // 🔒 Protected routes (must be logged in)
    const protectedRoutes = ["cart", "userProfile", "fav"];
    if (!isLoggedIn && protectedRoutes.includes(path)) {
      console.warn("⚠️ User not logged in, redirecting to signup");
      return navigateTo("/signup");
    }

    const page = routes[path] || routes.home;
    await page();
  } catch (err) {
    console.error("❌ Router error:", err);
  }
};

// 🚀 Initialize router
export const initRouter = () => {
  if (routerInitialized) return;
  routerInitialized = true;

  router();

  window.addEventListener("popstate", router);

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#")) return;

    e.preventDefault();
    navigateTo(href);
  });
};

// 🧭 SPA Navigation helper
export const navigateTo = (url) => {
  window.history.pushState({}, "", url);
  router();
};
