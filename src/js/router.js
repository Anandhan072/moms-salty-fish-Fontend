// router.js — Production-Ready Version (Enhanced)

import {
  commonViewControllerHome,
  homePage,
  allProduct,
  singleProduct,
  signupPage,
  otpVerification,
  UserProfileController,
  policesController,
  cartController
} from "./controller.js";

import { getNavAPIByID } from "./productModule.js";
import { checkUserIsActive } from "./userModule.js";
import { API_Category } from "./config.js";
import { errorMessage } from "./utils/error.js";

/* ----------------------------------------------------
   ROUTE TABLE — All pages registered here
----------------------------------------------------- */
const routes = {
  home: homePage,
  product: allProduct,
  fish: allProduct,
  dryfish: allProduct,
  item: singleProduct,
  signup: signupPage,
  otpVerification: otpVerification,
  userProfile: UserProfileController,
  polices: policesController,
  cart: cartController,

  /* 404 Page */
  error: async () => {
    await errorMessage();
  },

  /* Common layout UI (nav, footer, global UI)... */
  firstRun: async () => {
    await commonViewControllerHome();
  }
};

/* ----------------------------------------------------
   Router State
----------------------------------------------------- */
let routerInitialized = false;
let lastURL = window.location.pathname;

/* ----------------------------------------------------
   MAIN ROUTER FUNCTION
----------------------------------------------------- */
export const router = async () => {
  try {
    const parts = window.location.pathname.split("/").filter(Boolean);
    let path = parts[0] || "home";

    /* -----------------------------------------------
       1️⃣ Run Common Layout
       ----------------------------------------------- */
    const skipFirstRun = ["signup", "otpVerification", "auth"];
    if (!skipFirstRun.includes(path)) {
      await routes.firstRun();
    }

    /* -----------------------------------------------
       2️⃣ Dynamic Route Handling 
       ----------------------------------------------- */

    // /product/:slug
    if (path === "product" && parts[1]) {
      const categorySlug = parts[1];
      const productData = await getNavAPIByID(`${API_Category}?url=${categorySlug}`);

      if (productData?.url) {
        path = productData.url.replace(/-/g, "");
      }
    }

    // /item/:id
    if (parts.includes("item")) {
      path = "item";
    }

    // /auth/otp-verification
    if (path === "auth" && parts[1] === "otp-verification") {
      path = "otpVerification";
    }

    // /policy
    if (path === "policy") {
      path = "polices"; // <— mapped to controller
    }

    // /cart
    if (path === "cart") {
      path = "cart";
    }

    /* -----------------------------------------------
       3️⃣ Auth Handling
       ----------------------------------------------- */
    const isLoggedIn = await checkUserIsActive();

    // Logged in → block signup pages
    if (isLoggedIn && ["signup", "otpVerification"].includes(path)) {
      return navigateTo("/home");
    }

    // Not logged in → block protected routes
    const protectedRoutes = ["cart", "userProfile", "fav"];
    if (!isLoggedIn && protectedRoutes.includes(path)) {
      return navigateTo("/signup");
    }

    /* -----------------------------------------------
       4️⃣ Execute Page Controller
       ----------------------------------------------- */
    const page = routes[path];

    if (!page) {
      console.warn("⚠ Invalid Route:", path);
      await routes.firstRun();
      return await routes.error();
    }

    await page();
  } catch (err) {
    console.error("❌ Router Error:", err);
    await routes.firstRun();
    await routes.error();
  }
};

/* ----------------------------------------------------
   Router Initialization
----------------------------------------------------- */
export const initRouter = () => {
  if (routerInitialized) return; // Prevent double init
  routerInitialized = true;

  router();

  // SPA back/forward
  window.addEventListener("popstate", () => {
    if (lastURL !== window.location.pathname) {
      lastURL = window.location.pathname;
      router();
    }
  });

  // Intercept internal <a> clicks
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");

    if (!href || href.startsWith("http") || href.startsWith("#")) return;

    e.preventDefault();
    navigateTo(href);
  });
};

/* ----------------------------------------------------
   SPA Navigation Helper
----------------------------------------------------- */
export const navigateTo = (url) => {
  if (url === lastURL) return;
  lastURL = url;
  window.history.pushState({}, "", url);
  router();
};
