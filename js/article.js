const params = new URLSearchParams(window.location.search);

const slug = params.get("slug");
let lang = params.get("lang") || "en";

const root = `/articles/${slug}/`;

let toggleBtn = null;

async function exists(path) {
  const res = await fetch(path, { method: "HEAD" });
  return res.ok;
}

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
  renderMarkdown(md);
  setupLang(lang);
  setupToggle(hasEN, hasFA);
}

function renderMarkdown(md) {
  const html = marked.parse(md, {
    highlight: (code, lang) => hljs.highlightAuto(code, [lang]).value,
  });

  document.getElementById("articleContent").innerHTML = html;
  hljs.highlightAll();
}

function setupLang(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
}

function setupToggle(hasEN, hasFA) {
  if (!(hasEN && hasFA)) return;

  toggleBtn.classList.remove("hidden");
  toggleBtn.textContent = lang === "fa" ? "English" : "فارسی";

  toggleBtn.onclick = () => {
    if (!slug) return;
    const next = lang === "fa" ? "en" : "fa";
    location.search = `?slug=${slug}&lang=${next}`;
  };
}

function showError(msg) {
  document.getElementById("articleContent").innerHTML = `<p>${msg}</p>`;
}
