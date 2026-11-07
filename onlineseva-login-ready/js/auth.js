(() => {
  const $ = (id) => document.getElementById(id);
  const authScreen = $("authScreen");
  const portalApp = $("portalApp");
  const message = $("authMessage");
  let supabaseClient = null;

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
  }
  function setMode(mode) {
    $("loginForm").hidden = mode !== "login";
    $("signupForm").hidden = mode !== "signup";
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.mode === mode);
    });
    showMessage("");
  }
  function showPortal(user) {
    authScreen.hidden = true;
    portalApp.hidden = false;
    $("signedInAs").textContent = `Logged in: ${user.email || "Customer"}`;
  }
  function showLogin() {
    portalApp.hidden = true;
    authScreen.hidden = false;
    setMode("login");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll(".auth-tab").forEach((tab) =>
      tab.addEventListener("click", () => setMode(tab.dataset.mode))
    );

    const cfg = window.SUPABASE_CONFIG || {};
    const configured = cfg.url && cfg.anonKey &&
      !cfg.url.includes("PASTE_") && !cfg.anonKey.includes("PASTE_");

    if (!window.supabase || !configured) {
      showLogin();
      showMessage("Setup required: js/supabase-config.js ରେ Supabase URL ଓ anon key ଯୋଡ଼ନ୍ତୁ।", true);
      return;
    }

    supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) showMessage(error.message, true);
    if (session?.user) showPortal(session.user);
    else showLogin();

    supabaseClient.auth.onAuthStateChange((_event, sessionNow) => {
      if (sessionNow?.user) showPortal(sessionNow.user);
      else showLogin();
    });

    $("loginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = $("loginEmail").value.trim();
      const password = $("loginPassword").value;
      const button = $("loginForm").querySelector(".auth-submit");
      button.disabled = true; button.textContent = "Please wait...";
      const { data, error: loginError } = await supabaseClient.auth.signInWithPassword({ email, password });
      button.disabled = false; button.textContent = "Login Securely";
      if (loginError) return showMessage(loginError.message, true);
      if (data.user) showPortal(data.user);
    });

    $("signupForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = $("signupName").value.trim();
      const email = $("signupEmail").value.trim();
      const password = $("signupPassword").value;
      const button = $("signupForm").querySelector(".auth-submit");
      button.disabled = true; button.textContent = "Creating account...";
      const { data, error: signupError } = await supabaseClient.auth.signUp({
        email, password, options: { data: { full_name: name } }
      });
      button.disabled = false; button.textContent = "Create My Account";
      if (signupError) return showMessage(signupError.message, true);
      if (data.session && data.user) showPortal(data.user);
      else showMessage("Account request ସଫଳ। ଆପଣଙ୍କ Email ରେ confirmation link ଯାଇଛି। Email verify କରି Login କରନ୍ତୁ।");
    });

    $("forgotPassword").addEventListener("click", async () => {
      const email = $("loginEmail").value.trim();
      if (!email) return showMessage("ପ୍ରଥମେ Email ID ଲେଖନ୍ତୁ।", true);
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (resetError) showMessage(resetError.message, true);
      else showMessage("Password reset link ଆପଣଙ୍କ Email କୁ ପଠାଯାଇଛି।");
    });

    $("logoutButton").addEventListener("click", async () => {
      const { error: logoutError } = await supabaseClient.auth.signOut();
      if (logoutError) showMessage(logoutError.message, true);
      else showLogin();
    });
  });
})();
