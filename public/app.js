document.addEventListener("DOMContentLoaded", () => {
  const currentPath = location.pathname === "/account" ? "/account.html" : location.pathname;
  document.querySelectorAll(".nav-inner").forEach(header => {
    const nav = header.querySelector(".nav-links");
    if (!nav) return;
    if (!nav.id) nav.id = "primary-navigation";

    let button = header.querySelector(".menu-btn");
    if (!button) {
      button = document.createElement("button");
      button.className = "menu-btn";
      button.type = "button";
      button.innerHTML = '<span aria-hidden="true">☰</span>';
      const actions = header.querySelector(".nav-actions");
      if (actions) actions.append(button);
      else header.append(button);
    }
    button.setAttribute("aria-controls", nav.id);
    if (!button.hasAttribute("aria-expanded")) button.setAttribute("aria-expanded", "false");
    if (!button.hasAttribute("aria-label")) button.setAttribute("aria-label", "Open navigation");

    nav.querySelectorAll("a").forEach(link => {
      const path = new URL(link.href, location.origin).pathname;
      if (path === currentPath) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    const close = (restoreFocus = false) => {
      nav.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation");
      button.innerHTML = '<span aria-hidden="true">☰</span>';
      if (restoreFocus && window.matchMedia("(max-width: 1100px)").matches) button.focus();
    };

    button.addEventListener("click", () => {
      const open = !nav.classList.contains("open");
      nav.classList.toggle("open", open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      button.innerHTML = open ? '<span aria-hidden="true">✕</span>' : '<span aria-hidden="true">☰</span>';
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => close()));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && nav.classList.contains("open")) close(true);
    });
    document.addEventListener("click", event => {
      if (!header.contains(event.target)) close();
    });
  });
  document.querySelectorAll("[data-year]").forEach(element => {
    element.textContent = String(new Date().getFullYear());
  });
});