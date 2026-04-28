// ── State ──
let allCuisines = [];
let currentItem = null;
let isSpeaking = false;

// ── 1. Load data.json and build the menu ──
async function loadData() {
  try {
    const res = await fetch("./data.json");
    const data = await res.json();
    allCuisines = data.cuisines;
    buildMenu(allCuisines);
  } catch (e) {
    console.error("Could not load data.json:", e);
  }
}

// ── 2. Build sidebar menu dynamically from the JSON array ──
function buildMenu(cuisines) {
  const list = document.getElementById("menuList");
  list.innerHTML = "";

  if (!cuisines.length) {
    list.innerHTML =
      '<li style="padding:0.75rem 1.1rem;font-size:13px;color:var(--muted);">No results found.</li>';
    return;
  }

  cuisines.forEach((item) => {
    const li = document.createElement("li");
    li.className = "menu-item";
    li.innerHTML = `
          <a href="#" data-id="${item.id}">
            <span class="menu-flag">${item.flag}</span>
            <span>
              <span class="menu-name">${item.title}</span>
              <span class="menu-country">${item.country}</span>
            </span>
          </a>`;

    li.querySelector("a").addEventListener("click", (e) => {
      e.preventDefault();
      selectItem(item, li.querySelector("a"));
      // Close sidebar on mobile after selection
      document.getElementById("sidebar").classList.remove("open");
    });

    list.appendChild(li);
  });
}

// ── 3. Filter menu based on search input ──
function filterMenu(query) {
  const q = query.toLowerCase().trim();
  buildMenu(
    q
      ? allCuisines.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.country.toLowerCase().includes(q),
        )
      : allCuisines,
  );
}

// ── 4. Select a cuisine and populate the food card ──
function selectItem(item, linkEl) {
  // Update active link
  document
    .querySelectorAll("#menuList a")
    .forEach((a) => a.classList.remove("active"));
  linkEl.classList.add("active");

  // Stop any current speech
  window.speechSynthesis.cancel();
  isSpeaking = false;
  currentItem = item;
  resetSpeakBtn();

  // Populate image
  const img = document.getElementById("foodImg");
  img.src = item.image;
  img.alt = item.title;
  img.onerror = () => {
    img.src = `https://via.placeholder.com/800x280/fff8e6/c98700?text=${encodeURIComponent(item.emoji)}`;
  };

  // Populate text fields
  document.getElementById("countryBadge").textContent =
    `${item.flag} ${item.country}`;
  document.getElementById("dishEmoji").textContent = item.emoji;
  document.getElementById("foodOrigin").textContent = item.country;
  document.getElementById("foodTitle").textContent = item.title;
  document.getElementById("foodDesc").textContent = item.description;
  document.getElementById("foodFact").textContent = item.funFact;

  // Show card, hide welcome screen
  document.getElementById("welcome").style.display = "none";
  const card = document.getElementById("foodCard");
  card.style.display = "block";
  // Re-trigger fade-up animation
  card.style.animation = "none";
  void card.offsetWidth;
  card.style.animation = "";

  // Scroll into view on mobile
  if (window.innerWidth <= 700) {
    document
      .getElementById("mainContent")
      .scrollIntoView({ behavior: "smooth" });
  }
}

// ── 5. Toggle speech narration on/off ──
function toggleSpeak() {
  if (!currentItem) return;

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    resetSpeakBtn();
    return;
  }

  const text = `${currentItem.title}, from ${currentItem.country}. ${currentItem.description} Fun fact: ${currentItem.funFact}`;
  const msg = new SpeechSynthesisUtterance(text);
  msg.pitch = 1.1;
  msg.rate = 0.95;

  msg.onstart = () => {
    isSpeaking = true;
    const btn = document.getElementById("speakBtn");
    btn.classList.add("speaking");
    btn.innerHTML = '<i class="bi bi-stop-fill"></i> Stop';
  };

  msg.onend = msg.onerror = () => {
    isSpeaking = false;
    resetSpeakBtn();
  };

  window.speechSynthesis.speak(msg);
}

// ── 6. Reset speak button to default state ──
function resetSpeakBtn() {
  const btn = document.getElementById("speakBtn");
  if (!btn) return;
  btn.classList.remove("speaking");
  btn.innerHTML = '<i class="bi bi-volume-up-fill"></i> Hear the Story';
}

// ── PWA: capture install prompt ──
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.add("visible");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") installBtn.classList.remove("visible");
  deferredPrompt = null;
});

// ── Offline / online banner ──
window.addEventListener("offline", () => {
  document.getElementById("offlineBanner").style.display = "block";
});
window.addEventListener("online", () => {
  document.getElementById("offlineBanner").style.display = "none";
});

// ── Mobile hamburger toggle ──
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// Close sidebar when clicking outside it
document.addEventListener("click", (e) => {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("menuToggle");
  if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

// ── Service Worker ──
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(console.warn);
}

// ── Start ──
loadData();
