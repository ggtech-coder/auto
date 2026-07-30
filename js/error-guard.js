// ============================================================
// CAPTURADOR GLOBAL DE ERROS — carregado ANTES de qualquer outro
// script nas páginas do painel/área do aluno. Garante que nenhum
// erro passe em silêncio (nada de "fica só carregando" sem explicação).
// ============================================================
(function () {
  function mostrarBannerGlobal(mensagem) {
    let banner = document.getElementById("global-error-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "global-error-banner";
      banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;background:#C4432B;color:#fff;padding:1rem 1.4rem;font-family:sans-serif;font-size:0.88rem;line-height:1.55;box-shadow:0 4px 20px rgba(0,0,0,0.25);";
      (document.body || document.documentElement).prepend(banner);
    }
    banner.innerHTML += `<div style="margin-top:${banner.childElementCount ? '0.6rem' : '0'};padding-top:${banner.childElementCount ? '0.6rem' : '0'};${banner.childElementCount ? 'border-top:1px solid rgba(255,255,255,0.3);' : ''}"><strong>Erro detectado:</strong> ${mensagem}</div>`;
  }

  window.addEventListener("error", function (event) {
    // Ignora erros de recursos externos (ex: fontes) sem mensagem útil
    const msg = event.message || (event.error && event.error.message) || "Erro desconhecido de script.";
    mostrarBannerGlobal(msg + (event.filename ? ` <span style="opacity:0.75;">(${event.filename.split('/').pop()}:${event.lineno})</span>` : ""));
  });

  window.addEventListener("unhandledrejection", function (event) {
    const err = event.reason;
    const msg = (err && (err.message || err.code)) || String(err);
    mostrarBannerGlobal("Falha numa operação assíncrona (ex: consulta ao Firestore): " + msg);
  });
})();
