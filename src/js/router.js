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
import { initSessionWatcher } from "./userModule.js";
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

// 🧩 Main router logic
export const router = async () => {
  try {
    // handel home page
    const parts = window.location.pathname.split("/").filter(Boolean);
    let path = parts[0] || "home";

    // Only run firstRun for main pages
    const skipFirstRunPages = ["signup", "auth", "otpVerification"];
    if (!skipFirstRunPages.includes(path)) {
      await routes.firstRun();
    }

    // Handle /product/:slug
    if (path === "product") {
      const categorySlug = parts[1];
      if (categorySlug) {
        const productData = await getNavAPIByID(`${API_Category}?url=${categorySlug}`);
        if (productData) {
          path =
            productData.url ||
            productData?.data?.url ||
            productData?.category?.url ||
            productData?.[0]?.url ||
            "product";
          if (typeof path === "string") path = path.replace(/-/g, "");
        }
      }
    }

    // Handle /item/:id
    else if (parts.includes("item")) {
      path = "item";
    }

    // Handle /user
    else if (path === "user") {
      path = userInfo?.userActive ? "userProfile" : "signup";
    }

    // Handle /auth/otp-verification
    else if (path === "auth" && parts[1] === "otp-verification") {
      path = "otpVerification";
    }

    // Handle /policy
    else if (path === "policy") {
      path = parts.length >= 2 ? "privacyPolicy" : "";
    }

    // ✅ Resolve route
    const page = routes[path] || routes.home;
    await page();
  } catch (err) {
    console.error("❌ Router error:", err);
  }
};

// 🚀 Initialize SPA router
export const initRouter = () => {
  if (routerInitialized) return;
  routerInitialized = true;

  // Run router once on initial load
  router();

  // Handle back/forward browser navigation
  window.addEventListener("popstate", router);

  // 🧠 Intercept all internal <a> clicks to prevent reload
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#")) return;

    e.preventDefault();
    navigateTo(href);
  });
};

// 🧭 SPA Navigation Helper (no reload)
export const navigateTo = (url) => {
  window.history.pushState({}, "", url);
  router(); // trigger re-render manually
};
