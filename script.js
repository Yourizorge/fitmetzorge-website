const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const planCards = document.querySelectorAll("[data-plan]");
const planDetail = document.querySelector("[data-plan-detail]");
const mailForms = document.querySelectorAll("[data-mail-form]");
const reviewForm = document.querySelector("[data-review-form]");
const reviewList = document.querySelector("[data-review-list]");
const signupModal = document.querySelector("[data-signup-modal]");
const signupPlan = document.querySelector("[data-signup-plan]");
const signupTitle = document.querySelector("[data-signup-title]");
const durationOptions = document.querySelector("[data-duration-options]");
const signupCloseButtons = document.querySelectorAll("[data-signup-close]");
const revealItems = document.querySelectorAll(".reveal");
const reviewStorageKey = "fit-met-zorge-reviews";
let headerScrolled = null;
let headerTicking = false;

const planDetails = {
  "single-basis": {
    title: "Basis - 1 persoon",
    text: "Voor wie wil starten met persoonlijke begeleiding, techniek en structuur. Je traint 4 keer per maand 60 minuten en krijgt een duidelijk plan waarmee je veilig en gericht vooruitgaat.",
    points: ["60 minuten per training.", "Eerste training gratis.", "Maandelijks opzegbaar.", "Focus op techniek, uitvoering en basisprogressie."],
    durations: ["60 min - EUR 200 p/m"]
  },
  "single-progressie": {
    title: "Progressie - 1 persoon",
    text: "Voor wie sneller vooruit wil en meer begeleiding nodig heeft. Met 8 sessies per maand van 60 minuten blijft er meer ritme, controle en ruimte om techniek en trainingsopbouw te verbeteren.",
    points: ["60 minuten per training.", "Eerste training gratis.", "Maandelijks opzegbaar.", "Gericht werken aan kracht, conditie en lichaamssamenstelling."],
    durations: ["60 min - EUR 380 p/m"]
  },
  "single-transformatie": {
    title: "Transformatie - 1 persoon",
    text: "Het meest intensieve traject voor wie echt wil veranderen. Met 12 sessies per maand van 60 minuten train je gemiddeld 3 keer per week onder begeleiding en bouw je maximale consistentie op.",
    points: ["60 minuten per training.", "Eerste training gratis.", "Maandelijks opzegbaar.", "Sterke accountability door vaste trainingsmomenten."],
    durations: ["60 min - EUR 480 p/m"]
  },
  "duo-basis": {
    title: "Duo Basis",
    text: "Samen starten met personal training. Je traint met z'n tweeen, krijgt dezelfde technische begeleiding en houdt elkaar gemotiveerd.",
    points: ["4 sessies per maand van 60 minuten.", "EUR 260 per maand totaal.", "Geschikt voor duo's die samen willen starten."],
    durations: ["60 min - EUR 260 p/m totaal"]
  },
  "duo-progressie": {
    title: "Duo Progressie",
    text: "Voor duo's die vaker willen trainen en samen een duidelijk ritme willen opbouwen. Meer sessies betekent meer structuur en meer kans om consistent te blijven.",
    points: ["8 sessies per maand van 60 minuten.", "EUR 500 per maand totaal.", "Meer begeleiding, meer ritme en meer progressie."],
    durations: ["60 min - EUR 500 p/m totaal"]
  },
  "duo-transformatie": {
    title: "Duo Transformatie",
    text: "Het meest intensieve duo-traject. Je traint samen 12 keer per maand en werkt gericht aan kracht, conditie, techniek en discipline.",
    points: ["12 sessies per maand van 60 minuten.", "EUR 660 per maand totaal.", "Voor duo's die serieus samen resultaat willen behalen."],
    durations: ["60 min - EUR 660 p/m totaal"]
  },
  "online-coaching": {
    title: "Online coaching",
    text: "Voor wie zelfstandig traint, maar professionele structuur en bijsturing wil. Je krijgt begeleiding via de digitale omgeving, zodat training, voeding en voortgang overzichtelijk blijven.",
    points: ["Persoonlijk trainingsschema per week.", "Voedingsschema en voedingslog per dag.", "Stappen, water, slaap, welzijn en gewicht bijhouden.", "Voortgang, check-ins en persoonlijke bijsturing.", "Geschikt als je op afstand begeleiding wilt met duidelijke accountability."],
    durations: ["Online coaching - EUR 200 p/m"]
  }
};

function syncHeader() {
  if (!header) return;
  const scrolled = window.scrollY > 12;
  if (scrolled === headerScrolled) return;
  header.classList.toggle("scrolled", scrolled);
  headerScrolled = scrolled;
}

function requestHeaderSync() {
  if (headerTicking) return;
  headerTicking = true;
  requestAnimationFrame(() => {
    syncHeader();
    headerTicking = false;
  });
}

function closeMenu() {
  document.body.classList.remove("menu-open");
  header?.classList.remove("menu-open");
  navToggle?.setAttribute("aria-expanded", "false");
}

function renderDurations(detail) {
  if (!durationOptions) return;
  const options = detail.durations || [];
  durationOptions.innerHTML = options.map((duration, index) => `
    <label class="duration-option">
      <input type="radio" name="Duur / optie" value="${escapeHtml(duration)}" ${options.length === 1 ? "checked" : ""} required>
      <span>${escapeHtml(duration)}</span>
    </label>
  `).join("");

  if (options.length > 1) {
    const firstInput = durationOptions.querySelector("input");
    firstInput?.focus({ preventScroll: true });
  }
}

function openSignup(detail) {
  if (!signupModal) return;
  if (signupPlan) signupPlan.value = detail.title;
  if (signupTitle) {
    signupTitle.textContent = `Je hebt gekozen voor: ${detail.title}. Vink je gewenste duur aan en vul je gegevens in.`;
  }
  renderDurations(detail);
  signupModal.hidden = false;
  document.body.classList.add("signup-open");
  signupModal.querySelector(".duration-option input, input:not([type='hidden'])")?.focus();
}

function closeSignup() {
  if (!signupModal) return;
  signupModal.hidden = true;
  document.body.classList.remove("signup-open");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStoredReviews() {
  try {
    return JSON.parse(localStorage.getItem(reviewStorageKey) || "[]");
  } catch {
    return [];
  }
}

function storeReviews(reviews) {
  localStorage.setItem(reviewStorageKey, JSON.stringify(reviews.slice(0, 20)));
}

function createReviewCard(review) {
  const score = Math.max(1, Math.min(5, Number.parseInt(review.score, 10) || 5));
  const article = document.createElement("article");
  article.className = "review-card";
  article.innerHTML = `
    <span class="review-score rating-stars" aria-label="${score} van 5 sterren">${"&#9733;".repeat(score)}${"&#9734;".repeat(5 - score)}</span>
    <h3>${escapeHtml(review.name)}</h3>
    <p>${escapeHtml(review.text)}</p>
  `;
  return article;
}

function renderStoredReviews() {
  if (!reviewList) return;
  const reviews = getStoredReviews();
  reviews.forEach((review) => {
    reviewList.prepend(createReviewCard(review));
  });
}

syncHeader();
window.addEventListener("scroll", requestHeaderSync, { passive: true });

navToggle?.addEventListener("click", () => {
  const open = !header?.classList.contains("menu-open");
  document.body.classList.toggle("menu-open", open);
  header?.classList.toggle("menu-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
});

nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeSignup();
  }
});

planCards.forEach((card) => {
  card.addEventListener("click", () => {
    const detail = planDetails[card.dataset.plan];
    if (!detail || !planDetail) return;
    planCards.forEach((item) => item.classList.toggle("active", item === card));
    planDetail.innerHTML = `
      <p class="eyebrow">Geselecteerd pakket</p>
      <h2>${detail.title}</h2>
      <p>${detail.text}</p>
      <ul>${detail.points.map((point) => `<li>${point}</li>`).join("")}</ul>
    `;
    openSignup(detail);
  });
});

signupCloseButtons.forEach((button) => button.addEventListener("click", closeSignup));

signupModal?.addEventListener("click", (event) => {
  if (event.target === signupModal) closeSignup();
});

mailForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    const status = form.querySelector("[data-form-status]");
    const nextField = form.querySelector("[data-form-next]");
    if (nextField) {
      nextField.value = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}bedankt.html`;
    }
    if (status) status.textContent = "Je aanvraag wordt verzonden...";
  });
});

renderStoredReviews();

reviewForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(reviewForm);
  const review = {
    name: String(data.get("Naam") || "").trim(),
    score: String(data.get("Score") || "5").trim(),
    text: String(data.get("Review") || "").trim()
  };
  const status = reviewForm.querySelector("[data-review-status]");

  if (!review.name || !review.text) {
    if (status) status.textContent = "Vul je naam en review in.";
    return;
  }

  const reviews = getStoredReviews();
  reviews.unshift(review);
  storeReviews(reviews);
  reviewList?.prepend(createReviewCard(review));
  reviewForm.reset();
  if (status) status.textContent = "Bedankt, je review staat op de pagina.";
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("in-view"));
}
