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
let signupScrollY = 0;
let signupTrigger = null;

function syncSignupViewport() {
  if (!signupModal || signupModal.hidden) return;
  const viewport = window.visualViewport;
  signupModal.style.setProperty("--signup-height", `${viewport?.height ?? window.innerHeight}px`);
  signupModal.style.setProperty("--signup-top", `${viewport?.offsetTop ?? 0}px`);
}

window.visualViewport?.addEventListener("resize", syncSignupViewport);
window.visualViewport?.addEventListener("scroll", syncSignupViewport);
window.addEventListener("resize", syncSignupViewport);

const planDetails = {
  "single-basis": {
    title: "Basis - 1 persoon",
    text: "Voor wie wil starten met persoonlijke begeleiding, techniek en structuur. Je traint 1 keer per week, 4 trainingen per maand, voor EUR 50 per training.",
    points: ["4 trainingen per maand.", "60 minuten per training.", "Persoonlijke begeleiding.", "EUR 200 per maand, maandelijks opzegbaar."],
    durations: ["EUR 50 per training - EUR 200 p/m"]
  },
  "single-progressie": {
    title: "Progressie - 1 persoon",
    text: "Voor wie sneller vooruit wil en meer begeleiding nodig heeft. Je traint 2 keer per week, 8 trainingen per maand, voor EUR 47,50 per training.",
    points: ["8 trainingen per maand.", "60 minuten per training.", "Meer begeleiding en regelmatige progressie.", "EUR 380 per maand, maandelijks opzegbaar."],
    durations: ["EUR 47,50 per training - EUR 380 p/m"]
  },
  "single-transformatie": {
    title: "Transformatie - 1 persoon",
    text: "Het meest intensieve traject voor wie echt wil veranderen. Je traint 3 keer per week, 12 trainingen per maand, voor EUR 40 per training.",
    points: ["12 trainingen per maand.", "60 minuten per training.", "Intensieve begeleiding en maximale structuur.", "EUR 480 per maand, maandelijks opzegbaar."],
    durations: ["EUR 40 per training - EUR 480 p/m"]
  },
  "duo-basis": {
    title: "Duo Basis",
    text: "Samen starten met personal training. Je traint 1 keer per week met 2 personen voor EUR 32,50 p.p. per training.",
    points: ["4 trainingen per maand.", "EUR 260 per maand totaal voor 2 personen.", "Geschikt voor duo's die samen willen starten."],
    durations: ["EUR 32,50 p.p. per training - EUR 260 p/m totaal"]
  },
  "duo-progressie": {
    title: "Duo Progressie",
    text: "Voor duo's die vaker willen trainen en samen een duidelijk ritme willen opbouwen. Je traint 2 keer per week voor EUR 31,25 p.p. per training.",
    points: ["8 trainingen per maand.", "EUR 500 per maand totaal voor 2 personen.", "Meer begeleiding, meer ritme en meer progressie."],
    durations: ["EUR 31,25 p.p. per training - EUR 500 p/m totaal"]
  },
  "duo-transformatie": {
    title: "Duo Transformatie",
    text: "Het meest intensieve duo-traject. Je traint samen 3 keer per week voor EUR 27,50 p.p. per training.",
    points: ["12 trainingen per maand.", "EUR 660 per maand totaal voor 2 personen.", "Voor duo's die serieus samen resultaat willen behalen."],
    durations: ["EUR 27,50 p.p. per training - EUR 660 p/m totaal"]
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
  if (signupModal.hidden) {
    signupScrollY = window.scrollY;
    signupTrigger = document.activeElement;
    document.body.style.top = `-${signupScrollY}px`;
  }
  if (signupPlan) signupPlan.value = detail.title;
  if (signupTitle) {
    signupTitle.textContent = `Je hebt gekozen voor: ${detail.title}. Vink je gewenste duur aan en vul je gegevens in.`;
  }
  renderDurations(detail);
  signupModal.hidden = false;
  document.body.classList.add("signup-open");
  syncSignupViewport();
  signupModal.querySelector(".signup-dialog").scrollTop = 0;
  signupModal.querySelector("[data-signup-close]")?.focus({ preventScroll: true });
}

function closeSignup() {
  if (!signupModal || signupModal.hidden) return;
  signupModal.hidden = true;
  document.body.classList.remove("signup-open");
  document.body.style.top = "";
  window.scrollTo({ top: signupScrollY, behavior: "instant" });
  signupTrigger?.focus({ preventScroll: true });
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
  if (event.key === "Tab" && signupModal && !signupModal.hidden) {
    const controls = [...signupModal.querySelectorAll("button, input, textarea, a[href]")]
      .filter((element) => !element.disabled && element.getClientRects().length && element.tabIndex >= 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
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
  let pending = false;
  const status = form.querySelector("[data-form-status]");
  const nextField = form.querySelector("[data-form-next]");
  const nextUrl = new URL("bedankt.html", window.location.href);
  if (nextField) nextField.value = nextUrl.href;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get("_honey")) {
      status.textContent = "Je aanvraag kon niet worden verwerkt. Neem contact op via info@fitmetzorge.com.";
      return;
    }
    pending = true;
    const button = form.querySelector("[type='submit']");
    button.disabled = true;
    form.setAttribute("aria-busy", "true");
    status.textContent = "Je aanvraag wordt verzonden…";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let accepted = false;
    try {
      // Keep the existing recipient; AJAX lets failures retain the current form.
      const endpoint = new URL(form.action);
      endpoint.pathname = `/ajax${endpoint.pathname}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: data,
        signal: controller.signal
      });
      if (!response.ok) throw new Error("provider");
      const result = await response.json();
      const activationRequired = /activat|confirm.*email|verify/i.test(String(result.message || ""));
      if (activationRequired || !(result.success === true || result.success === "true")) {
        throw new Error("provider");
      }
      accepted = true;
      status.textContent = "De verzenddienst heeft je aanvraag geaccepteerd. Dit bevestigt nog geen bezorging in de mailbox.";
      // Only a non-sensitive, short-lived acceptance marker is stored.
      try { sessionStorage.setItem("fitmetzorge-form-accepted", String(Date.now())); } catch {}
      window.location.assign(nextUrl.href);
    } catch (error) {
      status.textContent = error.message === "provider"
        ? "De verzenddienst heeft je aanvraag niet bevestigd. Je gegevens blijven hier staan. Probeer later opnieuw of neem contact op via info@fitmetzorge.com."
        : "We konden niet vaststellen of je aanvraag is ontvangen. Je gegevens blijven hier staan. Controleer je verbinding. Neem bij twijfel contact op via info@fitmetzorge.com voordat je opnieuw verzendt.";
    } finally {
      clearTimeout(timeout);
      form.removeAttribute("aria-busy");
      if (!accepted) {
        pending = false;
        button.disabled = false;
      }
    }
  });
});

const receipt = document.querySelector("[data-form-receipt]");
if (receipt) {
  try {
    const acceptedAt = Number(sessionStorage.getItem("fitmetzorge-form-accepted"));
    sessionStorage.removeItem("fitmetzorge-form-accepted");
    if (acceptedAt > 0 && Date.now() - acceptedAt < 300000) {
      receipt.textContent = "De verzenddienst heeft je aanvraag geaccepteerd. Dit bevestigt nog geen bezorging in de mailbox. Ik neem zo snel mogelijk contact met je op zodra je aanvraag is ontvangen.";
    }
  } catch {}
}

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
