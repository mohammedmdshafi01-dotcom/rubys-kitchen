/* Ruby's Cloud Kitchen – application logic */

// ---------- Menu data (edit prices and dishes here) ----------
// To use a real photo, change `img` to your file, e.g. img: "images/chicken-biryani.jpg"
const MENU = [
  { id: 1, img: "dish-1.svg",  cat: "Biryani",  name: "Chicken Dum Biryani",  desc: "Basmati rice slow-cooked with marinated chicken, served with raita.", price: 289, veg: false },
  { id: 2, img: "dish-2.svg",  cat: "Biryani",  name: "Mutton Biryani",        desc: "Tender mutton layered with saffron rice and fried onions.",          price: 369, veg: false },
  { id: 3, img: "dish-3.svg",  cat: "Biryani",  name: "Paneer Biryani",        desc: "Spiced paneer and vegetables dum-cooked with basmati.",              price: 249, veg: true  },
  { id: 4, img: "dish-4.svg",  cat: "Meals",    name: "Karnataka Meals",       desc: "Rice, sambar, rasam, two palyas, curd and a sweet.",                 price: 179, veg: true  },
  { id: 5, img: "dish-5.svg",  cat: "Meals",    name: "Chicken Curry Meal",    desc: "Homestyle chicken curry with rice, chapati and salad.",              price: 229, veg: false },
  { id: 6, img: "dish-6.svg",  cat: "Meals",    name: "Dal Tadka Combo",       desc: "Yellow dal tadka, jeera rice, roti and pickle.",                     price: 169, veg: true  },
  { id: 7, img: "dish-7.svg",  cat: "Starters", name: "Chicken 65",            desc: "Crisp, spicy fried chicken with curry leaf.",                        price: 219, veg: false },
  { id: 8, img: "dish-8.svg",  cat: "Starters", name: "Paneer Tikka",          desc: "Charred paneer cubes marinated in yogurt and spices.",               price: 209, veg: true  },
  { id: 9, img: "dish-9.svg",  cat: "Starters", name: "Gobi Manchurian",       desc: "Crispy cauliflower tossed in a tangy soy-garlic sauce.",             price: 169, veg: true  },
  { id: 10, img: "dish-10.svg", cat: "Desserts", name: "Gulab Jamun (2 pcs)",   desc: "Warm milk dumplings in cardamom syrup.",                             price: 69,  veg: true  },
  { id: 11, img: "dish-11.svg", cat: "Desserts", name: "Double Ka Meetha",      desc: "Hyderabadi bread pudding with nuts and rabri.",                      price: 99,  veg: true  },
  { id: 12, img: "dish-12.svg", cat: "Drinks",   name: "Sweet Lassi",           desc: "Thick chilled yogurt drink.",                                        price: 79,  veg: true  },
  { id: 13, img: "dish-13.svg", cat: "Drinks",   name: "Filter Coffee",         desc: "Strong South Indian decoction coffee.",                              price: 49,  veg: true  }
];

const GST_RATE = 0.05;
const DELIVERY_FEE = 40;
const FREE_DELIVERY_ABOVE = 499;
const STORAGE_KEY = "rubys-cart-v1";

// ---------- State ----------
let cart = loadCart();           // { dishId: quantity }
let activeCat = "All";

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const rupee = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
}
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- Menu rendering ----------
function renderTabs() {
  const cats = ["All", ...new Set(MENU.map((d) => d.cat))];
  $("tabs").innerHTML = cats.map((c) =>
    `<button class="tab" role="tab" aria-selected="${c === activeCat}" data-cat="${c}">${c}</button>`
  ).join("");
}

function renderMenu() {
  const q = $("search").value.trim().toLowerCase();
  const vegOnly = $("vegOnly").checked;
  const items = MENU.filter((d) =>
    (activeCat === "All" || d.cat === activeCat) &&
    (!vegOnly || d.veg) &&
    (!q || d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q))
  );

  $("menuGrid").innerHTML = items.map((d) => `
    <article class="dish">
      <img class="dish-img" src="${d.img}" alt="${d.name}" loading="lazy" width="600" height="400">
      <div class="dish-top">
        <h3>${d.name}</h3>
        <span class="diet ${d.veg ? "" : "nonveg"}" title="${d.veg ? "Vegetarian" : "Non-vegetarian"}"></span>
      </div>
      <p>${d.desc}</p>
      <div class="dish-foot">
        <span class="price">${rupee(d.price)}</span>
        ${cart[d.id] ? qtyControl(d.id) : `<button class="add-btn" data-add="${d.id}">Add</button>`}
      </div>
    </article>`).join("");

  $("emptyMsg").hidden = items.length > 0;
}

function qtyControl(id) {
  return `<div class="qty">
    <button data-dec="${id}" aria-label="Remove one">−</button>
    <span>${cart[id]}</span>
    <button data-inc="${id}" aria-label="Add one">+</button>
  </div>`;
}

// ---------- Cart ----------
function changeQty(id, delta) {
  const next = (cart[id] || 0) + delta;
  if (next <= 0) delete cart[id]; else cart[id] = next;
  saveCart();
  renderMenu();
  renderCart();
}

function calcTotals() {
  const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const dish = MENU.find((d) => d.id === Number(id));
    return dish ? sum + dish.price * qty : sum;
  }, 0);
  const tax = subtotal * GST_RATE;
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  return { subtotal, tax, delivery, total: subtotal + tax + delivery };
}

function renderCart() {
  const entries = Object.entries(cart).filter(([id]) => MENU.some((d) => d.id === Number(id)));
  const count = entries.reduce((n, [, q]) => n + q, 0);
  $("cartCount").textContent = count;
  $("cartEmpty").hidden = count > 0;

  $("cartList").innerHTML = entries.map(([id, qty]) => {
    const d = MENU.find((m) => m.id === Number(id));
    return `<li class="cart-item">
      <span class="name">${d.name}</span>
      <span class="line">${rupee(d.price * qty)}</span>
      ${qtyControl(d.id)}
    </li>`;
  }).join("");

  const t = calcTotals();
  $("subtotal").textContent = rupee(t.subtotal);
  $("tax").textContent = rupee(t.tax);
  $("delivery").textContent = t.delivery ? rupee(t.delivery) : (t.subtotal ? "Free" : "₹0");
  $("total").textContent = rupee(t.total);
  $("payTotal").textContent = rupee(t.total);
  $("toCheckout").disabled = count === 0;
}

// ---------- Drawer views ----------
function showView(view) {
  $("cartView").hidden = view !== "cart";
  $("cartFoot").hidden = view !== "cart";
  $("checkoutForm").hidden = view !== "checkout";
  $("confirmView").hidden = view !== "confirm";
}
function openDrawer() {
  $("drawer").classList.add("open");
  $("drawer").setAttribute("aria-hidden", "false");
  $("overlay").hidden = false;
  showView("cart");
  $("closeCart").focus();
}
function closeDrawer() {
  $("drawer").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
  $("overlay").hidden = true;
  $("openCart").focus();
}

// ---------- Checkout validation ----------
const RULES = {
  name:    (v) => v.length >= 2 || "Enter your name.",
  phone:   (v) => /^[6-9]\d{9}$/.test(v) || "Enter a valid 10-digit mobile number.",
  address: (v) => v.length >= 10 || "Enter your full address, including a landmark.",
  pincode: (v) => /^560\d{3}$/.test(v) || "We deliver within Bangalore only (pincode starting 560)."
};

function validate(form) {
  let ok = true;
  Object.entries(RULES).forEach(([field, rule]) => {
    const input = form.elements[field];
    const result = rule(input.value.trim());
    const msg = result === true ? "" : result;
    input.classList.toggle("invalid", !!msg);
    input.parentElement.querySelector(".err").textContent = msg;
    if (msg) ok = false;
  });
  return ok;
}

function placeOrder(form) {
  const orderId = "RCK" + Date.now().toString().slice(-6);
  const order = {
    id: orderId,
    placedAt: new Date().toISOString(),
    customer: {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      pincode: form.pincode.value.trim(),
      notes: form.notes.value.trim()
    },
    payment: form.pay.value,
    items: Object.entries(cart).map(([id, qty]) => ({ id: Number(id), qty })),
    totals: calcTotals()
  };

  // Demo only: keeps orders in this browser. Replace with a fetch() POST to your server.
  try {
    const history = JSON.parse(localStorage.getItem("rubys-orders") || "[]");
    history.push(order);
    localStorage.setItem("rubys-orders", JSON.stringify(history));
  } catch {}

  $("cName").textContent = order.customer.name;
  $("cId").textContent = order.id;
  $("cPhone").textContent = "+91 " + order.customer.phone;

  cart = {};
  saveCart();
  renderMenu();
  renderCart();
  form.reset();
  showView("confirm");
}

// ---------- Events ----------
$("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cat]");
  if (!btn) return;
  activeCat = btn.dataset.cat;
  renderTabs();
  renderMenu();
});

$("menuGrid").addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) {
    changeQty(Number(add.dataset.add), 1);
    toast("Added to your order");
    return;
  }
  const inc = e.target.closest("[data-inc]");
  if (inc) changeQty(Number(inc.dataset.inc), 1);
  const dec = e.target.closest("[data-dec]");
  if (dec) changeQty(Number(dec.dataset.dec), -1);
});

$("cartList").addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  if (inc) changeQty(Number(inc.dataset.inc), 1);
  const dec = e.target.closest("[data-dec]");
  if (dec) changeQty(Number(dec.dataset.dec), -1);
});

$("search").addEventListener("input", renderMenu);
$("vegOnly").addEventListener("change", renderMenu);
$("openCart").addEventListener("click", openDrawer);
$("closeCart").addEventListener("click", closeDrawer);
$("overlay").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

$("toCheckout").addEventListener("click", () => showView("checkout"));
$("backToCart").addEventListener("click", () => showView("cart"));
$("newOrder").addEventListener("click", () => { closeDrawer(); location.hash = "#menu"; });

$("checkoutForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (Object.keys(cart).length === 0) return showView("cart");
  if (validate(e.target)) placeOrder(e.target);
});

// ---------- Init ----------
$("year").textContent = new Date().getFullYear();
renderTabs();
renderMenu();
renderCart();
