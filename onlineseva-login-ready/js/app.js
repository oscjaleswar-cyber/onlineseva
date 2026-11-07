const APP = {
  data: null,
  modal: null,
  allServices: [],
  elements: {}
};

document.addEventListener("DOMContentLoaded", async () => {
  APP.elements = {
    html: document.documentElement,
    serviceContainer: document.getElementById("serviceContainer"),
    categoryNav: document.getElementById("categoryNav"),
    search: document.getElementById("serviceSearch"),
    clearSearch: document.getElementById("clearSearch"),
    searchResultText: document.getElementById("searchResultText"),
    noResults: document.getElementById("noResults"),
    serviceCount: document.getElementById("serviceCount"),
    backToTop: document.getElementById("backToTop"),
    progress: document.getElementById("topProgress")
  };

  initTheme();
  bindGlobalEvents();

  try {
    const response = await fetch("data/services.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    APP.data = await response.json();
    renderApp(APP.data);
  } catch (error) {
    console.error(error);
    showLoadError();
  }
});

function initTheme() {
  const saved = localStorage.getItem("row-theme");
  const theme = saved || "light";
  APP.elements.html.setAttribute("data-theme", theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = APP.elements.html.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  APP.elements.html.setAttribute("data-theme", next);
  localStorage.setItem("row-theme", next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const button = document.getElementById("themeToggle");
  if (!button) return;
  button.innerHTML = theme === "dark"
    ? '<i class="bi bi-sun-fill"></i>'
    : '<i class="bi bi-moon-stars-fill"></i>';
  button.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
}

function bindGlobalEvents() {
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);

  APP.elements.search.addEventListener("input", debounce(() => {
    const query = APP.elements.search.value.trim();
    APP.elements.clearSearch.classList.toggle("d-none", !query);
    filterServices(query);
  }, 120));

  APP.elements.clearSearch.addEventListener("click", () => {
    APP.elements.search.value = "";
    APP.elements.clearSearch.classList.add("d-none");
    filterServices("");
    APP.elements.search.focus();
  });

  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? (scrollTop / height) * 100 : 0;
    APP.elements.progress.style.width = `${progress}%`;
    APP.elements.backToTop.classList.toggle("show", scrollTop > 500);
  }, { passive: true });

  APP.elements.backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function renderApp(data) {
  const { config, categories } = data;
  const total = categories.reduce((sum, cat) => sum + cat.services.filter(s => s.enabled !== false).length, 0);
  APP.allServices = categories.flatMap(category => category.services.map(service => ({
    ...service,
    categoryId: category.id,
    categoryTitle: category.title
  })));

  document.title = `${config.brand.name} | Digital Service Portal`;
  setText("brandName", config.brand.name);
  setText("brandTagline", config.brand.tagline);
  setText("brandMark", config.brand.logoText);
  setText("footerMark", config.brand.logoText);
  setText("footerName", config.brand.name);
  setText("copyrightName", config.brand.name);
  setText("footerPhone", config.contact.phone);
  setText("footerEmail", config.contact.email);
  setText("footerNote", config.footer.note);
  setText("heroTitle", config.hero.title);
  setText("heroSubtitle", config.hero.subtitle);
  APP.elements.search.placeholder = config.hero.searchPlaceholder;
  APP.elements.serviceCount.textContent = `${total}+`;

  const wa = makeWhatsAppLink(config.contact.whatsappNumber, `Hello ${config.brand.name}, I want help with your digital services.`);
  ["topWhatsapp", "heroWhatsapp", "footerWhatsapp", "emptyWhatsapp"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = wa;
  });

  setText("year", new Date().getFullYear());
  renderCategoryNav(categories);
  renderCategories(categories);
}

function renderCategoryNav(categories) {
  APP.elements.categoryNav.innerHTML = categories.map((cat, index) => `
    <button class="category-tab ${index === 0 ? "active" : ""}" data-category="${escapeAttr(cat.id)}">
      ${escapeHtml(cat.title)}
    </button>
  `).join("");

  APP.elements.categoryNav.querySelectorAll(".category-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      APP.elements.categoryNav.querySelectorAll(".category-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`cat-${tab.dataset.category}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderCategories(categories, query = "") {
  const normalized = query.toLowerCase();
  let visibleCount = 0;

  APP.elements.serviceContainer.innerHTML = categories.map(category => {
    const services = category.services.filter(service => {
      if (service.enabled === false) return false;
      if (!normalized) return true;
      const haystack = `${service.id} ${service.name} ${service.description} ${(service.tags || []).join(" ")} ${category.title}`.toLowerCase();
      return haystack.includes(normalized);
    });

    visibleCount += services.length;
    if (!services.length) return "";

    return `
      <section class="category-block fade-in" id="cat-${escapeAttr(category.id)}" style="--accent:${escapeAttr(categoryColor(category))}">
        <div class="category-heading">
          <span class="category-line"></span>
          <div>
            <h2>${escapeHtml(category.title)}</h2>
            <p>${escapeHtml(category.subtitle || "")}</p>
          </div>
          <span class="category-count">${services.length} services</span>
        </div>
        <div class="service-grid">
          ${services.map(service => serviceCard(service)).join("")}
        </div>
      </section>
    `;
  }).join("");

  APP.elements.serviceContainer.querySelectorAll(".service-card").forEach(card => {
    card.addEventListener("click", () => {
      const service = APP.allServices.find(item => item.id === card.dataset.id);
      if (service) openService(service);
    });
  });

  APP.elements.noResults.classList.toggle("d-none", visibleCount > 0);
  APP.elements.searchResultText.textContent = query
    ? `${visibleCount} matching service${visibleCount === 1 ? "" : "s"} — search by name, category or keyword`
    : `Browse ${visibleCount} services — use search to find anything quickly`;
}

function serviceCard(service) {
  const badge = service.badge
    ? `<span class="service-badge badge-${escapeAttr(service.badge)}">${escapeHtml(service.badge)}</span>`
    : "";

  const icon = service.image
    ? `<img src="${escapeAttr(service.image)}" alt="" style="width:36px;height:36px;object-fit:contain">`
    : `<span aria-hidden="true">${service.icon || "🔧"}</span>`;

  return `
    <article class="service-card" data-id="${escapeAttr(service.id)}" style="--accent:${escapeAttr(service.accent || "#2563eb")}">
      ${badge}
      <div class="service-icon">${icon}</div>
      <div class="service-name">${escapeHtml(service.name)}</div>
      <div class="service-desc">${escapeHtml(service.description || "")}</div>
      <i class="bi bi-arrow-right service-arrow"></i>
    </article>
  `;
}

function openService(service) {
  if (!APP.modal) {
    const modalEl = document.getElementById("serviceModal");
    APP.modal = new bootstrap.Modal(modalEl);
  }

  const category = service.categoryTitle || "Service";
  setText("modalIcon", service.icon || "🔧");
  setText("modalTitle", service.name);
  setText("modalCategory", category);
  setText("modalDescription", service.description || "Online service assistance available.");

  const official = document.getElementById("modalOfficial");
  const whatsapp = document.getElementById("modalWhatsapp");

  if (service.officialUrl && service.officialUrl !== "#") {
    official.href = service.officialUrl;
    official.classList.remove("disabled");
  } else {
    official.href = "#";
    official.classList.add("disabled");
  }

  whatsapp.href = makeWhatsAppLink(
    APP.data.config.contact.whatsappNumber,
    service.whatsappMessage || `Hello ${APP.data.config.brand.name}, I want help with ${service.name}.`
  );

  APP.modal.show();
}

function filterServices(query) {
  renderCategories(APP.data.categories, query);
}

function categoryColor(category) {
  const map = {
    blue: "#0d6efd",
    pink: "#d63384",
    orange: "#fd7e14",
    green: "#20c997",
    purple: "#6f42c1"
  };
  return map[category.accent] || category.accent || "#2563eb";
}

function makeWhatsAppLink(number, message) {
  const clean = String(number || "").replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function showLoadError() {
  APP.elements.serviceContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon"><i class="bi bi-exclamation-triangle"></i></div>
      <h3>Services could not be loaded</h3>
      <p>Please run this website through a web server/hosting. The JSON file is loaded with fetch().</p>
    </div>
  `;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}



document.addEventListener("mousemove", (event) => {
  const card = event.target.closest(".service-card");

  if (!card) return;

  const rect = card.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  card.style.setProperty("--mouse-x", `${x}px`);
  card.style.setProperty("--mouse-y", `${y}px`);
});
