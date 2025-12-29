const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
let lang = params.get("lang") || "en";

const root = `/articles/${slug}/`;
let toggleBtn = null;

// بررسی وجود فایل
// async function exists(path) {
//   const res = await fetch(path, { method: "HEAD" });
//   return res.ok;
// }

async function exists(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

// خواندن front-matter و markdown content
function parseFrontMatter(mdText) {
  const regex = /^---\n([\s\S]+?)\n---/;
  const match = mdText.match(regex);
  if (!match) return { meta: {}, content: mdText };

  const yamlText = match[1];
  const content = mdText.slice(match[0].length);

  const meta = {};
  yamlText.split("\n").forEach((line) => {
    const [key, ...rest] = line.split(":");
    if (key) meta[key.trim()] = rest.join(":").trim();
  });

  return { meta, content };
}

// load article
async function loadArticle() {
  toggleBtn = document.getElementById("articleLangToggle");

  if (!slug) {
    showError("No article specified.");
    return;
  }

  const enPath = `${root}index-en.md`;
  const faPath = `${root}index-fa.md`;

  const hasEN = await exists(enPath);
  const hasFA = await exists(faPath);

  // انتخاب زبان
  if (!params.get("lang")) {
    if (!hasEN && hasFA) lang = "fa";
  } else {
    if (lang === "en" && !hasEN && hasFA) lang = "fa";
    if (lang === "fa" && !hasFA && hasEN) lang = "en";
  }

  const path = `${root}index-${lang}.md`;
  if (!(await exists(path))) {
    showError("Article not found.");
    return;
  }

  const md = await fetch(path).then((r) => r.text());
  renderArticle(md);
  setupLang(lang);
  setupToggle(hasEN, hasFA);
}

// render article with author card
function renderArticle(mdText) {
  const { meta, content } = parseFrontMatter(mdText);

  const articleContent = document.getElementById("articleContent");
  if (!articleContent) return;

  // ساخت container
  const container = document.createElement("div");
  container.className = "article-container";

  // ساخت article
  const article = document.createElement("article");
  article.className = "article-content prose";
  article.innerHTML = marked.parse(content);
  container.appendChild(article);

  // ساخت author card
  const aside = document.createElement("aside");
  aside.className = "article-meta";

  aside.innerHTML = `
    <div class="author-card">
      <img src="${meta.image || "/assets/images/author.png"}" alt="${
    meta.author || ""
  }" />
      <h3>${meta.author || ""}</h3>
      <div class="author-role">${meta.role || ""}</div>
      <time class="articleDate">${meta.date || ""}</time>
    </div>
  `;
  container.appendChild(aside);

  // پاک کردن content قبلی و اضافه کردن container جدید
  articleContent.innerHTML = "";
  articleContent.appendChild(container);

  // highlight code blocks
  document
    .querySelectorAll("pre code")
    .forEach((block) => hljs.highlightElement(block));
}

// تنظیم زبان و dir
function setupLang(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
}

// toggle زبان فقط وقتی هر دو وجود دارند
function setupToggle(hasEN, hasFA) {
  if (!(hasEN && hasFA)) return;

  toggleBtn.classList.remove("hidden");
  toggleBtn.textContent = lang === "fa" ? "English" : "فارسی";

  toggleBtn.onclick = () => {
    const next = lang === "fa" ? "en" : "fa";
    location.search = `?slug=${slug}&lang=${next}`;
  };
}

// نمایش خطا
function showError(msg) {
  const articleContent = document.getElementById("articleContent");
  if (articleContent) articleContent.innerHTML = `<p>${msg}</p>`;
}
