// ── State ──
let allCuisines = [];
let customCuisines = [];
let currentItem = null;
let isSpeaking = false;

// ── 1. Load data.json and LocalStorage ──
async function loadData() {
  try {
    // Load local storage items first
    const saved = localStorage.getItem("customCuisines");
    customCuisines = saved ? JSON.parse(saved) : [];

    const res = await fetch("./data.json");
    const data = await res.json();
    
    // Combine base data with custom data
    allCuisines = [...data.cuisines, ...customCuisines];
    buildMenu(allCuisines);
  } catch (e) {
    console.error("Could not load data.json:", e);
    // Even if fetch fails, show custom items if they exist
    allCuisines = [...customCuisines];
    buildMenu(allCuisines);
  }
}

// ── 2. Build sidebar menu dynamically ──
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
  document
    .querySelectorAll("#menuList a")
    .forEach((a) => a.classList.remove("active"));
  if (linkEl) linkEl.classList.add("active");

  window.speechSynthesis.cancel();
  isSpeaking = false;
  currentItem = item;
  resetSpeakBtn();

  const img = document.getElementById("foodImg");
  img.src = item.image || "";
  img.alt = item.title;
  img.onerror = () => {
    img.src = `https://via.placeholder.com/800x280/fff8e6/c98700?text=${encodeURIComponent(item.emoji)}`;
  };

  document.getElementById("countryBadge").textContent = `${item.flag} ${item.country}`;
  document.getElementById("dishEmoji").textContent = item.emoji;
  document.getElementById("foodOrigin").textContent = item.country;
  document.getElementById("foodTitle").textContent = item.title;
  document.getElementById("foodDesc").textContent = item.description;
  document.getElementById("foodFact").textContent = item.funFact;

  document.getElementById("welcome").style.display = "none";
  const card = document.getElementById("foodCard");
  card.style.display = "block";
  card.style.animation = "none";
  void card.offsetWidth;
  card.style.animation = "";

  if (window.innerWidth <= 700) {
    document.getElementById("mainContent").scrollIntoView({ behavior: "smooth" });
  }
}

// ── 5. Toggle speech narration ──
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

function resetSpeakBtn() {
  const btn = document.getElementById("speakBtn");
  if (!btn) return;
  btn.classList.remove("speaking");
  btn.innerHTML = '<i class="bi bi-volume-up-fill"></i> Hear the Story';
}

// ── 6. Handle New Food Form Submission ──
document.getElementById("addFoodForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const newItem = {
    id: "custom-" + Date.now(),
    title: document.getElementById("newTitle").value,
    country: document.getElementById("newCountry").value,
    description: document.getElementById("newDesc").value,
    funFact: document.getElementById("newFact").value,
    emoji: document.getElementById("newEmoji").value,
    flag: document.getElementById("newFlag").value,
    image: document.getElementById("newImg").value
  };

  // Save to state and LocalStorage
  customCuisines.push(newItem);
  localStorage.setItem("customCuisines", JSON.stringify(customCuisines));

  // Update global list and UI
  allCuisines.push(newItem);
  buildMenu(allCuisines);

  // Close modal and select the new item
  const modalEl = document.getElementById("addFoodModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
  e.target.reset();

  selectItem(newItem);
});

// ── PWA & Banners ──
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "inline-flex";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") installBtn.style.display = "none";
  deferredPrompt = null;
});

window.addEventListener("offline", () => {
  document.getElementById("offlineBanner").style.display = "block";
});
window.addEventListener("online", () => {
  document.getElementById("offlineBanner").style.display = "none";
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.addEventListener("click", (e) => {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("menuToggle");
  if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(console.warn);
}

loadData();
