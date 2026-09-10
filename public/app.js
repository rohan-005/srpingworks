let catalog = [];
let liveSubtotal = 0;

function formatCurrency(val) {
  return `₹${Number(val || 0).toFixed(2)}`;
}

async function loadCatalog() {
  const res = await fetch("/api/checks-catalog");
  catalog = await res.json();
  const list = document.getElementById("checks-list");
  list.innerHTML = "";
  catalog.forEach((check) => {
    const row = document.createElement("div");
    row.className = "check-row";
    row.innerHTML = `
      <input type="checkbox" id="check-${check.id}" value="${check.id}" data-price="${check.price}" />
      <label for="check-${check.id}">${check.name}</label>
      <span>${formatCurrency(check.price)}</span>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", onCheckToggle);
  });
  updateLiveSubtotal();
}

function updateLiveSubtotal() {
  liveSubtotal = Array.from(document.querySelectorAll("input[type=checkbox]:checked")).reduce(
    (sum, cb) => sum + Number(cb.dataset.price),
    0
  );
  document.getElementById("live-subtotal").textContent = formatCurrency(liveSubtotal);
}

function onCheckToggle() {
  updateLiveSubtotal();
}

function getSelectedCheckIds() {
  return Array.from(document.querySelectorAll("input[type=checkbox]:checked")).map(
    (cb) => cb.value
  );
}

function validateDiscountInput() {
  const rawVal = document.getElementById("discount-input").value.trim();
  const errorEl = document.getElementById("discount-error");
  if (rawVal === "") {
    errorEl.textContent = "";
    return true;
  }
  const val = Number(rawVal);
  if (isNaN(val) || val < 0 || val > 100) {
    errorEl.textContent = "Discount must be between 0 and 100.";
    return false;
  }
  errorEl.textContent = "";
  return true;
}

document.getElementById("discount-input").addEventListener("input", validateDiscountInput);
document.getElementById("discount-input").addEventListener("change", validateDiscountInput);

async function getQuote() {
  const messageEl = document.getElementById("message");
  const isValidDiscount = validateDiscountInput();

  const rawDiscount = document.getElementById("discount-input").value.trim();
  const discountVal = Number(rawDiscount);
  if (!isValidDiscount || (rawDiscount !== "" && (isNaN(discountVal) || discountVal < 0 || discountVal > 100))) {
    messageEl.textContent = "Discount must be between 0 and 100.";
    messageEl.className = "message error";
    return;
  }

  const checkIds = getSelectedCheckIds();
  const discountPercent = rawDiscount === "" ? 0 : discountVal;

  try {
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIds, discountPercent })
    });
    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent = data.error || "Failed to generate quote.";
      messageEl.className = "message error";
      return;
    }

    document.getElementById("result-subtotal").textContent = formatCurrency(data.subtotal);
    document.getElementById("result-discount").textContent = formatCurrency(data.discount);
    document.getElementById("result-gst").textContent = formatCurrency(data.gst);
    document.getElementById("result-total").textContent = formatCurrency(data.total);

    messageEl.textContent = "Quote generated successfully!";
    messageEl.className = "message success";
  } catch (err) {
    messageEl.textContent = "An error occurred while generating the quote.";
    messageEl.className = "message error";
  }
}

document.getElementById("quote-btn").addEventListener("click", getQuote);

// --- Tooling: reset button (utility only, not part of the app under test) ---
function showToast(msg) {
  let toast = document.getElementById("__toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "__toast";
    toast.style.cssText =
      "position:fixed;bottom:20px;right:20px;background:#333;color:#fff;padding:10px 16px;" +
      "border-radius:4px;font-family:sans-serif;z-index:9999;opacity:0;transition:opacity .2s;";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  clearTimeout(toast.__timer);
  toast.__timer = setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}

document.getElementById("reset-btn").addEventListener("click", async () => {
  await fetch("/api/reset", { method: "POST" });
  liveSubtotal = 0;
  document.getElementById("discount-input").value = "";
  document.getElementById("discount-error").textContent = "";
  document.getElementById("live-subtotal").textContent = "₹0.00";
  document.getElementById("result-subtotal").textContent = "-";
  document.getElementById("result-discount").textContent = "-";
  document.getElementById("result-gst").textContent = "-";
  document.getElementById("result-total").textContent = "-";
  document.getElementById("message").textContent = "";
  await loadCatalog();
  showToast("Data reset");
});

loadCatalog();
