const APP = { data: null, modal: null, allServices: [], elements: {}, supabase: null, profile: null, user: null };

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
  bindAuthForms();
  const cfg = window.SUPABASE_CONFIG || {};
  if (!window.supabase || !cfg.url || !cfg.anonKey || cfg.url.includes("YOUR_") || cfg.anonKey.includes("YOUR_")) {
    document.getElementById("supabaseSetupWarning")?.classList.remove("d-none");
    showAuthNotice("Supabase configuration ଏପର୍ଯ୍ୟନ୍ତ ହୋଇନାହିଁ। README ର Setup Guide ଦେଖନ୍ତୁ।", "error");
    return;
  }
  APP.supabase = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  APP.supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      document.getElementById("authGate")?.classList.remove("d-none");
      document.getElementById("portalApp")?.classList.add("d-none");
      setTimeout(() => showAuthForm("updatePassword"), 0);
    } else if (session?.user) setTimeout(() => enterPortal(session.user), 0);
    else showAuthGate();
  });
  const { data: { session } } = await APP.supabase.auth.getSession();
  if (session?.user) await enterPortal(session.user); else showAuthGate();
});

function bindAuthForms() {
  document.getElementById("showRegister")?.addEventListener("click", () => showAuthForm("register"));
  document.getElementById("showForgot")?.addEventListener("click", () => showAuthForm("forgot"));
  document.getElementById("showLoginFromRegister")?.addEventListener("click", () => showAuthForm("login"));
  document.getElementById("showLoginFromForgot")?.addEventListener("click", () => showAuthForm("login"));
  document.getElementById("loginForm")?.addEventListener("submit", loginCustomer);
  document.getElementById("registerForm")?.addEventListener("submit", registerCustomer);
  document.getElementById("forgotForm")?.addEventListener("submit", sendPasswordReset);
  document.getElementById("updatePasswordForm")?.addEventListener("submit", updatePassword);
  document.getElementById("logoutButton")?.addEventListener("click", async () => { await APP.supabase?.auth.signOut(); });
  document.getElementById("refreshCustomers")?.addEventListener("click", loadCustomers);
}

function showAuthForm(name) {
  ["loginForm", "registerForm", "forgotForm", "updatePasswordForm"].forEach(id => document.getElementById(id)?.classList.toggle("d-none", id !== `${name}Form`));
  const headings = { login: ["Welcome Back", "Username ଓ Password ଦେଇ ଆପଣଙ୍କ Online Services ଖୋଲନ୍ତୁ।"], register: ["Create Customer Account", "ନିଜର Customer ID ତିଆରି କରି ସମସ୍ତ Service ବ୍ୟବହାର କରନ୍ତୁ।"], forgot: ["Password Help", "Password Reset ପାଇଁ Admin ଙ୍କ ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।"], updatePassword: ["Choose New Password", "ଆପଣଙ୍କ Account ପାଇଁ ନୂଆ Password ସେଟ୍ କରନ୍ତୁ।"] };
  setText("authHeading", headings[name][0]); setText("authSubheading", headings[name][1]); showAuthNotice("");
}

function showAuthNotice(message, type = "success") {
  const box = document.getElementById("authNotice"); if (!box) return;
  box.textContent = message; box.className = message ? `auth-notice ${type}` : "auth-notice d-none";
}

function setFormBusy(form, busy, label) {
  const button = form?.querySelector('button[type="submit"]'); if (!button) return;
  button.disabled = busy; if (busy) { button.dataset.oldText = button.innerHTML; button.textContent = label || "Please wait..."; }
  else if (button.dataset.oldText) { button.innerHTML = button.dataset.oldText; delete button.dataset.oldText; }
}

async function loginCustomer(event) {
  event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true, "Logging in..."); showAuthNotice("");
  try {
    const loginValue = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginValue);
    const username = normalizeUsername(loginValue);
    if (!isEmail && !isValidUsername(username)) throw new Error("Username କିମ୍ବା Admin Email ID ଠିକ୍ ଭାବେ ଲେଖନ୍ତୁ।");
    const loginEmail = isEmail ? loginValue.toLowerCase() : usernameToAuthEmail(username);
    const { error } = await APP.supabase.auth.signInWithPassword({ email: loginEmail, password }); if (error) throw error;
  } catch (e) { showAuthNotice(authError(e), "error"); }
  finally { setFormBusy(form, false); }
}

async function registerCustomer(event) {
  event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true, "Creating account..."); showAuthNotice("");
  try {
    const full_name = document.getElementById("registerName").value.trim(); const username = normalizeUsername(document.getElementById("registerUsername").value); const contact_email = document.getElementById("registerContactEmail").value.trim(); const password = document.getElementById("registerPassword").value;
    if (!isValidUsername(username)) throw new Error("Username 4-30 ଅକ୍ଷର ହେବା ଦରକାର। କେବଳ English letter, number, dot, underscore, hyphen ବ୍ୟବହାର କରନ୍ତୁ।");
    if (password.length < 8) throw new Error("Password ଅତିକମରେ 8 ଅକ୍ଷର ରଖନ୍ତୁ।");
    const { data, error } = await APP.supabase.auth.signUp({ email: usernameToAuthEmail(username), password, options: { data: { full_name, username, contact_email } } });
    if (error) throw error;
    if (data.session) showAuthNotice(`Registration ସଫଳ! ଆପଣଙ୍କ Customer ID: ${username} । ଏହାକୁ ସୁରକ୍ଷିତ ରଖନ୍ତୁ।`);
    else showAuthNotice("Account ତିଆରି ହୋଇଛି। Supabase Email Confirmation OFF କରିଛନ୍ତି କି ଯାଞ୍ଚ କରନ୍ତୁ; Admin ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।");
  } catch (e) { showAuthNotice(authError(e), "error"); }
  finally { setFormBusy(form, false); }
}

async function sendPasswordReset(event) {
  event.preventDefault();
  showAuthNotice("Username-based Login ରେ self-service Email Reset ଉପଲବ୍ଧ ନାହିଁ। ଆପଣଙ୍କ Customer ID କହି Admin ଙ୍କଠାରୁ Password Reset କରାନ୍ତୁ।", "error");
}

async function updatePassword(event) {
  event.preventDefault(); const form = event.currentTarget; setFormBusy(form, true, "Updating..."); showAuthNotice("");
  try {
    const password = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmNewPassword").value;
    if (password !== confirm) throw new Error("ଦୁଇଟି Password ମେଳ ଖାଉନାହିଁ।");
    const { error } = await APP.supabase.auth.updateUser({ password }); if (error) throw error;
    showAuthNotice("Password ସଫଳତାର ସହିତ ବଦଳିଗଲା। ଏବେ Login କରନ୍ତୁ।");
    await APP.supabase.auth.signOut(); showAuthForm("login"); showAuthNotice("Password ସଫଳତାର ସହିତ ବଦଳିଗଲା। ନୂଆ Password ଦେଇ Login କରନ୍ତୁ।");
  } catch (e) { showAuthNotice(authError(e), "error"); }
  finally { setFormBusy(form, false); }
}

function normalizeUsername(value) { return String(value || "").trim().toLowerCase(); }
function isValidUsername(value) { return /^[a-z0-9._-]{4,30}$/.test(value); }
// Supabase Auth accepts email/password. A reserved synthetic address maps each username to a unique Auth identity.
// Email confirmation MUST be disabled for this username-only login design.
function usernameToAuthEmail(username) { return `${username}@login.onlinesevajls.com`; }

function authError(error) {
  const msg = String(error?.message || "Something went wrong");
  if (/invalid login credentials/i.test(msg)) return "Username କିମ୍ବା Password ଠିକ୍ ନୁହେଁ। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।";
  if (/email not confirmed/i.test(msg)) return "Supabase ର Email Confirmation OFF କରନ୍ତୁ। Username Login ପାଇଁ ଏହା ଆବଶ୍ୟକ।";
  if (/already registered/i.test(msg)) return "ଏହି Username ପୂର୍ବରୁ ବ୍ୟବହୃତ ହୋଇଛି। ଅନ୍ୟ Username ବାଛନ୍ତୁ।";
  return msg;
}

function showAuthGate() {
  document.getElementById("authGate")?.classList.remove("d-none"); document.getElementById("portalApp")?.classList.add("d-none");
  document.getElementById("adminPanel")?.classList.add("d-none"); showAuthForm("login");
}

async function enterPortal(user) {
  if (!APP.supabase || !user) return;
  try {
    const { data: profile, error } = await APP.supabase.from("profiles").select("id, full_name, username, contact_email, role, is_active").eq("id", user.id).single();
    if (error) throw error;
    if (!profile.is_active) { await APP.supabase.auth.signOut(); setTimeout(() => showAuthNotice("ଆପଣଙ୍କ Account ବର୍ତ୍ତମାନ Inactive ଅଛି। Admin ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।", "error"), 100); return; }
    APP.user = user; APP.profile = profile;
    document.getElementById("authGate")?.classList.add("d-none"); document.getElementById("portalApp")?.classList.remove("d-none");
    setText("signedInName", profile.username ? `${profile.full_name || "Customer"} (${profile.username})` : (profile.full_name || user.email || "Customer")); setText("signedInRole", profile.role === "admin" ? "ADMIN" : "CUSTOMER");
    document.getElementById("adminPanel")?.classList.toggle("d-none", profile.role !== "admin");
    if (profile.role === "admin") await loadCustomers();
    if (!APP.data) {
      const response = await fetch("data/services.json", { cache: "no-store" }); if (!response.ok) throw new Error(`HTTP ${response.status}`);
      APP.data = await response.json(); renderApp(APP.data);
    }
  } catch (e) {
    console.error(e); await APP.supabase.auth.signOut(); showAuthNotice("Customer Profile ମିଳିଲା ନାହିଁ। Supabase SQL Setup ସଠିକ୍ କରନ୍ତୁ।", "error");
  }
}

async function loadCustomers() {
  const body = document.getElementById("customerRows"); const msg = document.getElementById("adminMessage"); if (!body || APP.profile?.role !== "admin") return;
  body.innerHTML = '<tr><td colspan="4">Loading...</td></tr>'; msg.textContent = "";
  const { data, error } = await APP.supabase.from("profiles").select("id, full_name, username, contact_email, role, is_active, created_at").order("created_at", { ascending: false });
  if (error) { body.innerHTML = '<tr><td colspan="4">Customer list ଖୋଲିହେଲା ନାହିଁ। RLS Policy ଯାଞ୍ଚ କରନ୍ତୁ।</td></tr>'; return; }
  if (!data?.length) { body.innerHTML = '<tr><td colspan="4">କୌଣସି Customer ନାହାନ୍ତି।</td></tr>'; return; }
  body.innerHTML = data.map(c => `<tr><td>${escapeHtml(c.full_name || "Customer")}${c.role === "admin" ? ' <span class="admin-tag">ADMIN</span>' : ""}</td><td>${escapeHtml(c.username || "")}</td><td><span class="status-pill ${c.is_active ? "active" : "inactive"}">${c.is_active ? "Active" : "Inactive"}</span></td><td>${c.role === "admin" ? "—" : `<div class="customer-actions"><button class="customer-toggle ${c.is_active ? "disable" : "enable"}" data-id="${escapeAttr(c.id)}" data-active="${c.is_active ? "true" : "false"}">${c.is_active ? "Deactivate" : "Activate"}</button><button class="customer-delete" data-id="${escapeAttr(c.id)}" data-name="${escapeAttr(c.full_name || c.username || "Customer")}">Delete</button></div>`}</td></tr>`).join("");
  body.querySelectorAll(".customer-toggle").forEach(button => button.addEventListener("click", () => updateCustomerStatus(button.dataset.id, button.dataset.active !== "true")));
  body.querySelectorAll(".customer-delete").forEach(button => button.addEventListener("click", () => deleteCustomer(button.dataset.id, button.dataset.name)));
}

async function updateCustomerStatus(id, is_active) {
  const { error } = await APP.supabase.from("profiles").update({ is_active }).eq("id", id);
  const msg = document.getElementById("adminMessage"); msg.textContent = error ? `Update failed: ${error.message}` : `Customer account ${is_active ? "Activated" : "Deactivated"}.`;
  if (!error) await loadCustomers();
}

async function deleteCustomer(id, customerName) {
  if (APP.profile?.role !== "admin") return;
  const confirmed = window.confirm(`"${customerName}" ଙ୍କ Customer Account ସ୍ଥାୟୀ ଭାବେ Delete କରିବେ କି? ଏହା ପୁଣି ଫେରାଇ ଆଣିହେବ ନାହିଁ।`);
  if (!confirmed) return;
  const msg = document.getElementById("adminMessage");
  msg.textContent = "Deleting customer account...";
  const { error } = await APP.supabase.rpc("admin_delete_customer", { target_user_id: id });
  if (error) {
    msg.textContent = `Delete failed: ${error.message}. Supabase ର customer-delete-function.sql migration ଚଲାଇଛନ୍ତି କି ଯାଞ୍ଚ କରନ୍ତୁ।`;
    return;
  }
  msg.textContent = `Customer "${customerName}" ସଫଳତାର ସହିତ Delete ହୋଇଛନ୍ତି।`;
  await loadCustomers();
}

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
