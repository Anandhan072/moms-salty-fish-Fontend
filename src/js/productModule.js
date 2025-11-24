import { apiRequest } from "./helper.js";

/**
 * Product Data Store (in-memory)
 */
export const ProductData = {
  offer: [],
  items: [],
  banner: [],
  nav: [],
  html: "",
  filterItems: [],
  CurrentNav: [],
  redirectUrl: null,
  loading: false,
  lastFetched: {},
};

// Maximum cache age (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const LS_KEY = "ProductCache";

/* ========================================================
   🧠 Load LocalStorage Cache (on initialization)
======================================================== */
(function initLocalCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && typeof saved === "object") {
      ProductData.offer = saved.offer || [];
      ProductData.items = saved.items || [];
      ProductData.nav = saved.nav || [];
      ProductData.banner = saved.banner || [];
      ProductData.lastFetched = saved.lastFetched || {};
  
    }
  } catch (err) {
    console.warn("⚠️ Failed to load local cache:", err);
  }
})();

/* ========================================================
   💾 Persist cache to localStorage
======================================================== */
function saveToLocalStorage() {
  try {
    const toSave = {
      offer: ProductData.offer,
      items: ProductData.items,
      nav: ProductData.nav,
      banner: ProductData.banner,
      lastFetched: ProductData.lastFetched,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.warn("⚠️ Failed to save local cache:", err);
  }
}

/* ========================================================
   🧩 Core Fetch Logic (with caching)
======================================================== */
async function fetchData(type, endpoint, { force = false } = {}) {
  const cachedData = ProductData[type];
  const isStale = isDataStale(type);

  // ✅ Use cached data if not stale and not forced
  if (cachedData?.length && !isStale && !force) {

    return cachedData;
  }

  try {
    ProductData.loading = true;
    const response = await apiRequest(endpoint);

    if (!response?.data) throw new Error(`Empty response from ${endpoint}`);

    ProductData[type] = response.data;
    ProductData.lastFetched[type] = Date.now();
    ProductData.loading = false;

    // 🧠 Persist only persistent data (not HTML)
    if (type !== "html") saveToLocalStorage();


    return ProductData[type];
  } catch (err) {
    ProductData.loading = false;
    console.error(`❌ Failed to fetch ${type}:`, err.message);
    return [];
  }
}

/* ========================================================
   ⏳ Helper: check if cache is stale
======================================================== */
function isDataStale(type) {
  const last = ProductData.lastFetched[type];
  if (!last) return true;
  return Date.now() - last > CACHE_TTL;
}

/* ========================================================
   🚀 Public API Functions
======================================================== */

// 1️⃣ Offers — cached for 5 minutes
export const getOffers = async (url = `${API_URL}/offers`) => {
  return await fetchData("offer", url);
};

// 2️⃣ Items — cached for 5 minutes
export const getItems = async (url = `${API_URL}/items`) => {
  return await fetchData("items", url);
};

// 3️⃣ Categories — cached for 5 minutes
export const getCategory = async (url = `${API_URL}/categories`) => {
  return await fetchData("nav", url);
};

// 4️⃣ HTML snippets — always fetch fresh
export const getHtml = async (url) => {
  // force re-fetch every time
  return await fetchData("html", url, { force: true });
};
// 4️⃣ Banner Data — always fetch fresh
export const getBanner = async (url) => {
  return await fetchData("banner", url, { force: true });
};

// 4️⃣ Get Nav — always fetch fresh
export const getNavAPIByID = async function (url) {
  return await fetchData("CurrentNav", url, { force: true });
};

/* ========================================================
   🚀 Public API Functions
======================================================== */

export const findUrlLocation = async function () {
  const location = window.location.pathname.split("/").slice(1);
  return location;
};

/* ========================================================
   Filter-Items
======================================================== */
export const filterAndSortItems = function (items = ProductData.nav, options = {}) {
  const {
    category = null,
    subcategory = null,
    inStock = null, // "in-stock" or "out-of-stock"
    priceMin = 0,
    priceMax = Infinity,
    sortBy = null, // asc"  "desc" or  "AtoZ" "ZtoA"
  } = options;

  let result = [...items];

  let check;
  // ✅ Category filter
  if (category) {


    check = ProductData.nav.find((acc) => acc.url === category);

    result = result.filter((item) => {
      return item.category === check._id;
    });
  }

  // ✅ Subcategory filter
  if (subcategory) {
    const findSubId = check.subCategories.find((acc) => acc.url === subcategory);
    result = result.filter((item) => item.subCategory.includes(findSubId._id));
  }

  // ✅ Stock filter
  if (inStock === "in-stock") {
    result = result.filter((item) => item.stockBalanceWeight.value > 0);
  } else if (inStock === "out-of-stock") {
    result = result.filter((item) => item.stockBalanceWeight.value === 0);
  }

  // ✅ Price filter (check all variants)
  if (priceMin !== 0 || priceMax !== Infinity) {
    result = result.filter((item) =>
      item.variants.some((v) => {
        const price = parseFloat(v.price); // if Decimal128, convert to float
        return price >= priceMin && price <= priceMax;
      })
    );
  }

  // ✅ SortBy Price

  if (sortBy) {

    if (sortBy === "asc") {
      result = result.sort((a, b) => a.variants[0].price - b.variants[0].price);
    }
    if (sortBy === "desc") {
      result = result.sort((a, b) => b.variants[0].price - a.variants[0].price);
    }
    if (sortBy === "AtoZ") {

      result = result.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "ZtoA") {

      result = result.sort((a, b) => b.name.localeCompare(a.name));
    }


  }

  // ✅ Sorting
  if (sortBy === "date") {
    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? da - db : db - da;
    });
  } else if (sortBy === "price") {
    // Sort by lowest variant price
    result.sort((a, b) => {
      const aMin = Math.min(...a.variants.map((v) => parseFloat(v.price)));
      const bMin = Math.min(...b.variants.map((v) => parseFloat(v.price)));
      return sortOrder === "asc" ? aMin - bMin : bMin - aMin;
    });
  }

  ProductData.filterItems = result;
  return ProductData.filterItems;
};

export const getUrl = function () {
  const location = window.location.pathname.split("/").slice(1);

  return location;
};

export const findItemSlug = function (slug) {
  const result = ProductData.items.find((acc) => acc.slug === slug);
  return result;
};


export const findItemByID = function (id) {
  const result = ProductData.items.find((acc) => acc._id === id);
  return result;
}


export const findItemByIDVariants = function(pro_id, vari_id, cart) {
  const findProduct = findItemByID(pro_id)
const resutl = findProduct.variants.find(acc => acc._id == vari_id)
const find_pro_vari = {product: findProduct, variant:resutl, cartItem: cart}

return find_pro_vari;
}