// Comportamentos gerais do site institucional
document.addEventListener("DOMContentLoaded", () => {
  // Acordeão do FAQ
  document.querySelectorAll(".faq-item button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const wasOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });

  // Banner de cookies / LGPD
  const KEY = "rc_cookie_consent";
  if (!localStorage.getItem(KEY)) {
    const bar = document.createElement("div");
    bar.style.cssText = "position:fixed;bottom:0;left:0;right:0;background:#1C2126;color:#fff;padding:1rem;z-index:300;display:flex;gap:1rem;flex-wrap:wrap;align-items:center;justify-content:center;font-size:0.85rem;";
    bar.innerHTML = `<span>Usamos cookies para melhorar sua experiência, em conformidade com a LGPD. <a href="privacidade.html" style="color:#FFC63D;">Saiba mais</a>.</span><button id="cookieOk" style="background:#FFC63D;color:#1C2126;border:none;padding:0.5rem 1.2rem;border-radius:999px;font-weight:700;cursor:pointer;">Entendi</button>`;
    document.body.appendChild(bar);
    document.getElementById("cookieOk").addEventListener("click", () => {
      localStorage.setItem(KEY, "1");
      bar.remove();
    });
  }
});
