function includeHeaderAndFooter() {
  // پیدا کردن body
  const body = document.body;

  // ساخت page-wrapper
  const wrapper = document.getElementsByClassName("page-wrapper")[0];

  // --- Header ---
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="header-left">
      <a href="/">
        <img src="assets/images/logo-header.png" alt="hassanBake logo" class="header-logo" />
      </a>
      <button class="lang-switch hidden" id="articleLangToggle">فارسی</button>
    </div>
    <nav class="header-nav">
        <!-- <a href="#">Posts</a>
        <a href="#">About</a> -->
    </nav>
  `;
  wrapper.prepend(header);

  // --- Footer ---
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `<p>© 2025 hassanBake. All rights reserved.</p>`;
  wrapper.appendChild(footer);

  // اضافه کردن wrapper به body
  body.appendChild(wrapper);
}

// وقتی صفحه آماده شد اجرا می‌کنیم
window.addEventListener("DOMContentLoaded", () => {
  includeHeaderAndFooter();
  // for articles
  if (window.location.pathname.includes("article")) loadArticle();
});
