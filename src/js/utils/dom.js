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
