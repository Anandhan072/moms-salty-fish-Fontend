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