const PROD_DEFAULTS = {
  SUPABASE_URL: "https://ftrrrbptkzinirtqvfxg.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cnJyYnB0a3ppbmlydHF2ZnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODc3OTEsImV4cCI6MjA5NDg2Mzc5MX0.JSLiWNEIm7f0dNpt8Ik3F66jUiDGOUqBnw8Dj27NvHA",
  API_BASE_URL: "https://homeverse-hu2r.onrender.com"
};

function pickValue(value, fallback) {
  if (!value || value.includes("YOUR_") || value.includes("your_project_ref")) return fallback;
  return value;
}

const SUPABASE_URL = pickValue(window.__ENV__?.SUPABASE_URL, PROD_DEFAULTS.SUPABASE_URL);
const SUPABASE_ANON_KEY = pickValue(window.__ENV__?.SUPABASE_ANON_KEY, PROD_DEFAULTS.SUPABASE_ANON_KEY);
const API_BASE_URL = pickValue(window.__ENV__?.API_BASE_URL, PROD_DEFAULTS.API_BASE_URL);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !API_BASE_URL) {
  alert("Missing frontend env values. Set window.__ENV__ in env.js.");
}

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authControls = document.getElementById("authControls");
const propertyForm = document.getElementById("propertyForm");
const formMessage = document.getElementById("formMessage");
const propertyList = document.getElementById("propertyList");
const searchForm = document.getElementById("searchForm");

let currentSession = null;

function currency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function renderAuth() {
  if (!currentSession) {
    authControls.innerHTML = `<button id="googleSignIn">Sign in with Google</button>`;
    document.getElementById("googleSignIn").onclick = async () => {
      await supabase.auth.signInWithOAuth({ provider: "google" });
    };
    return;
  }

  authControls.innerHTML = `
    <div class="authRow">
      <span>${currentSession.user.email}</span>
      <button id="logoutBtn">Logout</button>
    </div>`;
  document.getElementById("logoutBtn").onclick = async () => {
    await supabase.auth.signOut();
    currentSession = null;
    renderAuth();
  };
}

async function loadProperties(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== "" && val !== undefined && val !== null) qs.set(key, val);
  }

  const res = await fetch(`${API_BASE_URL}/api/properties?${qs.toString()}`);
  const payload = await res.json();
  const rows = payload.data ?? [];

  propertyList.innerHTML = rows.map((row) => `
    <article class="card">
      <img src="${row.image_url}" alt="${row.title}" />
      <div class="content">
        <h3>${row.title}</h3>
        <p class="meta">${row.city} | ${row.bedrooms} bed | ${row.bathrooms} bath | ${row.area_sqft} sqft</p>
        <p><strong>${currency(row.price)}</strong></p>
        <a href="./details.html?id=${row.id}">View details</a>
      </div>
    </article>
  `).join("");

  if (!rows.length) propertyList.innerHTML = "<p class='muted'>No properties found.</p>";
}

propertyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.textContent = "";

  if (!currentSession) {
    formMessage.textContent = "Please sign in first.";
    return;
  }

  const formData = new FormData(propertyForm);
  const body = Object.fromEntries(formData.entries());

  const token = currentSession.access_token;
  const res = await fetch(`${API_BASE_URL}/api/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const payload = await res.json();
  if (!res.ok) {
    formMessage.textContent = payload.error || "Failed to create property";
    return;
  }

  formMessage.textContent = "Property added successfully.";
  propertyForm.reset();
  await loadProperties();
});

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(searchForm);
  await loadProperties(Object.fromEntries(fd.entries()));
});

async function init() {
  const { data } = await supabase.auth.getSession();
  currentSession = data.session;
  renderAuth();
  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
    renderAuth();
  });
  await loadProperties();
}

init();
