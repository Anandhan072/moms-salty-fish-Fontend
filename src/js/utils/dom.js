export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => scope.querySelectorAll(selector);

export const renderHTML = (container, html, replace = true) => {
  if (!container) return;
  if (replace) container.innerHTML = html;
  else container.insertAdjacentHTML("beforeend", html);
};

export const showError = (msg, container) => {
  renderHTML(container, `<p class="error">${msg}</p>`);
};



export const  optimizeImage = (url, w = 300, h = 300) => {
  if (!url || typeof url !== "string") return url;
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + marker.length);
  const suffix = url.slice(idx + marker.length);

  return `${prefix}f_auto,q_auto,w_${w},h_${h},c_fill/${suffix}`;
}



export const defautlErrorEl = `<div id="main-error">
    <div class="error-container">
    <div class="error-content">
        <section class="error-img"> <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                   <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                   <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                   <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                   <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  <svg class="icon" width="24" height="24">
                    <use href="%{icons}%#icon-fish-offer"></use>
                  </svg>
                  </section>
          <section class="error-message">%{errorMessage}%</section>
          </div>
    </div>
</div>`