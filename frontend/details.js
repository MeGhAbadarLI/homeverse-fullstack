const API_BASE_URL = window.__ENV__?.API_BASE_URL ?? "";

function currency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

async function loadDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const root = document.getElementById("detail");

  if (!id) {
    root.innerHTML = "<p>Missing property id.</p>";
    return;
  }

  const res = await fetch(`${API_BASE_URL}/api/properties/${id}`);
  const payload = await res.json();

  if (!res.ok) {
    root.innerHTML = `<p>${payload.error || "Failed to load property"}</p>`;
    return;
  }

  const p = payload.data;
  root.innerHTML = `
    <h1>${p.title}</h1>
    <img src="${p.image_url}" alt="${p.title}" style="width:100%;max-height:420px;object-fit:cover;border-radius:12px" />
    <p><strong>${currency(p.price)}</strong></p>
    <p>${p.city}, ${p.address}</p>
    <p>${p.bedrooms} bedrooms | ${p.bathrooms} bathrooms | ${p.area_sqft} sqft</p>
    <p>${p.description}</p>
  `;
}

loadDetail();