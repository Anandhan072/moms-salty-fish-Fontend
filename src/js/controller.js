import { defautlErrorEl } from "./utils/dom";
import * as ProductModule from "./productModule";
import * as userProfile from "./userModule";
import * as config from "./config";
import commonView from "./view/commonView";
import userInfoView from "./view/userInfoView";
import imgNavView from "./view/imgNavView";
import homeView from "./view/homeView";
import productCartView from "./view/productCartView";
import singleProductView from "./view/singleProductView";
import signupView from "./view/signupView";
import otpVerificationView from "./view/otpVerificationView";
import userProfileView from "./view/userProfileView";
import policiesView from "./view/policiesView";
import cartView from "./view/cartView";
import productItemView from "./view/productItemView";

/**
 * User-Profile Page (banner + default items)
 */

export const user_Profile = async () => {
  const htmlEl = await ProductModule.getHtml(`${config.API_HTML}?page=user-option`);
 
  const data = {
    userDate: userProfile.userInfo.userDetails,
    urlChange: ProductModule.setRedirectUrl,
    authLogout: userProfile.logoutFn,
  };
  userInfoView.render(htmlEl, ".user-profile-option", data);

  // Fetch items and cache internally for reuse
  await ProductModule.getItems(config.API_ITEMS);
};


export const commonViewControllerHome = async () => {
  try {
   
    const [offerData, navData] = await Promise.all([
      ProductModule.getOffers(config.API_OFFER),
      ProductModule.getCategory(config.API_Category),
    ]);

    const data = { offerData: offerData, navData: navData };
    const htmlEl = await ProductModule.getHtml(`${config.API_HTML}?page=main`);
    commonView.render(htmlEl, "body", data);
    await user_Profile();
    // Fetch items and cache internally for reuse
    await ProductModule.getItems(config.API_ITEMS);

    commonView._handelInterSectionObserverEvent();
  } catch (err) {
    console.error("[Common Controller] Failed to initialize:", err);
  }
};

/**
 * Renders the default category/product navigation
 */
export const defaultProdNav = async () => {
  try {
    const data = ProductModule.ProductData.nav || "";

    const htmlEl = `<div id="product">
      <div id="product-nav">
     
      </div>
    </div>`;
    imgNavView.render(htmlEl, "#header-group", data, "afterend", false);
  } catch (err) {
    console.error("[Default Product Nav] Error:", err);
  }
};

/**
 * home page View
 */

export const homePage = async () => {
  try {
    await defaultProdNav();
    const [htmlEl, bannerList] = await Promise.all([
      ProductModule.getHtml(`${config.API_HTML}?page=home`),
      ProductModule.getBanner(config.API_BANNER),
    ]);
    const { nav, items } = ProductModule.ProductData;

    if (!nav || !items) throw new Error("Product data missing.");

    const data = { bannerList: bannerList, nav: nav, items: items };

    homeView.render(htmlEl, "#main", data);
  } catch (err) {
    console.error("[Home Page] Initialization failed:", err);
  }
};

/**
 * Product / Category / Subcategory Page
 */
export const allProduct = async () => {
  try {
    const loc = await ProductModule.findUrlLocation(); // e.g. ["", "fish", "salmon"]
    if (!loc || !Array.isArray(loc)) throw new Error("Invalid URL structure.");

    if (loc.length <= 2) await defaultProdNav();

    const filterCriteria = {
      category: loc[1] || null,
      subcategory: loc[2] || null,
    };

    const filteredItems = ProductModule.filterAndSortItems(
      ProductModule.ProductData.items,
      filterCriteria
    );

    const htmlEl = await ProductModule.getHtml(`${config.API_HTML}?page=product`);

    const data = {
      filterLength: filteredItems.length,
      filteredItems: filteredItems,
      filterFun: ProductModule.filterAndSortItems,
    };

    productCartView.render(htmlEl, "#main", data);
  } catch (err) {
    console.error("[Product Page] Error:", err);
  }
};

/**
 * Single Product
 */
export const singleProduct = async () => {
  try {
    const htmlEl = await ProductModule.getHtml(`${config.API_HTML}?page=items`);
    const url = ProductModule.getUrl();
    const items = ProductModule.findItemSlug(url[url.length - 1]);

    const cartFind = userProfile.userInfo?.userDetails?.userProductInfo?.cart?.filter(
      (cartItem) => cartItem.itemId === items._id 
    );



    const data = {
      productInfo: items,
      apiUrl: config.API_USER,
      callFn: userProfile.addCartItem,
      cartAdded: cartFind   // convert to true/false
    };

    await singleProductView.render(htmlEl, "#main", data);
  } catch (err) {
    console.error("[Product Page] Error:", err);
  }
};


/**
 * Single Product
 */

export const signupPage = async () => {
  try {
    const htmlEl = await ProductModule.getHtml(`${config.API_HTML}?page=signup`);
    const data = {
      AuthUrl: config.API_AUTH,
      userAPI: userProfile.getUserAPI,
      redirectUrl: ProductModule.setRedirectUrl,
    };

    signupView.render(htmlEl, "body", data);
  } catch (err) {
    console.error("[Product Page] Error:", err);
  }
};

/**
 * Verify OTP
 */

export const otpVerification = async () => {
  try {
    const htmlEl = await ProductModule.getHtml(`${config.API_HTML}?page=otpVerification`);
    const data = {
      AuthUrl: config.API_AUTH,
      userAPI: userProfile.getUserAPI,
      getDeviceIdFn: userProfile.getDeviceId,
    };

    await otpVerificationView.render(htmlEl, "body", data);
  } catch (err) {
    console.error("[Product Page] Error:", err);
  }
};

/**
 * User View Profile
 */

export const UserProfileController = async () => {
  try {
    const htmlEl = await ProductModule.getHtml(`${config.API_HTML}?page=user-profile`);
    const data = { userData: userProfile.userInfo.userDetails };
    userProfileView.render(htmlEl, "#main", data);
  } catch (err) {
    console.error("[Product Page] Error:", err);
  }
};

/**
 * Policy View
 */
export const policesController = async () => {
  try {
    const url = ProductModule.getUrl();

    const htmlEl = await ProductModule.getHtml(`${config.API_HTML}?page=${url[url.length - 1]}`);

    policiesView.render(htmlEl, "#main");
  } catch (err) {
    console.error("[Product Page] Error:", err);
  }
};

// Cart View
export const cartController = async () => {
  try {

    let htmlEl = await ProductModule.getHtml(`${config.API_HTML}?page=cart`);

    const getCart =  userProfile.userInfo.userDetails.userProductInfo.cart;


    const cartOnly = getCart.map(cart => {
      const variants = ProductModule.findItemByIDVariants(cart.itemId, cart.variantId, cart) 
      return variants;
    })

    if(cartOnly.length === 0)  htmlEl = defautlErrorEl
    

    const data = {
      variants: cartOnly,
      APIurl: config.API_USER,
      updateCart: userProfile.updateUserCarts,
      deleteCart: userProfile.deletCart,
      checkError: cartOnly.length === 0 ? false : true
    };



    console.log(data)

    cartView.render(htmlEl, "#main", data);
  } catch (error) {}
};
