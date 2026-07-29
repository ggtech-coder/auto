// Injeta header e footer compartilhados. Cada página só precisa ter
// <div id="site-header"></div> e <div id="site-footer"></div>.
(function () {
  const c = SITE_CONFIG;
  const wa = `https://wa.me/${c.contato.whatsapp}?text=${encodeURIComponent(c.contato.whatsappMensagemPadrao)}`;
  const path = location.pathname.split("/").pop() || "index.html";
  const isActive = (p) => (path === p ? "active" : "");

  const headerHTML = `
    <a href="#main" class="skip-link">Pular para o conteúdo</a>
    <header class="site-header">
      <div class="container">
        <a href="index.html" class="logo"><span class="dot"></span>${c.empresa.nomeCurto}</a>
        <nav class="nav-links" id="navLinks">
          <a href="index.html" class="${isActive('index.html')}">Início</a>
          <a href="sobre.html" class="${isActive('sobre.html')}">Sobre</a>
          <a href="servicos.html" class="${isActive('servicos.html')}">Serviços</a>
          <a href="contato.html" class="${isActive('contato.html')}">Contato</a>
          <a href="login.html" class="${isActive('login.html')}">Área do aluno</a>
        </nav>
        <div class="nav-actions">
          <a href="agendamento.html" class="btn btn-primary btn-sm"><span class="long">Agendar aula</span><span class="short">Agendar</span></a>
          <button class="nav-toggle" id="navToggle" aria-label="Abrir menu"><span></span><span></span><span></span></button>
        </div>
      </div>
    </header>`;

  const footerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-logo"><span class="dot" style="width:9px;height:9px;border-radius:50%;background:var(--color-signal);display:inline-block;"></span>${c.empresa.nome}</div>
            <p style="max-width:32ch;font-size:0.88rem;">${c.empresa.slogan}</p>
            <div class="footer-social">
              <a href="${c.redesSociais.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">IG</a>
              <a href="${c.redesSociais.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook">FB</a>
              <a href="${c.redesSociais.youtube}" target="_blank" rel="noopener noreferrer" aria-label="YouTube">YT</a>
            </div>
          </div>
          <div>
            <h4>Institucional</h4>
            <ul>
              <li><a href="sobre.html">Sobre nós</a></li>
              <li><a href="servicos.html">Serviços</a></li>
              <li><a href="contato.html">Contato</a></li>
              <li><a href="privacidade.html">Política de privacidade</a></li>
              <li><a href="termos.html">Termos de uso</a></li>
            </ul>
          </div>
          <div>
            <h4>Acesso</h4>
            <ul>
              <li><a href="agendamento.html">Agendar aula</a></li>
              <li><a href="login.html">Área do aluno</a></li>
              <li><a href="login.html">Painel administrativo</a></li>
            </ul>
          </div>
          <div>
            <h4>Contato</h4>
            <ul>
              <li>${c.contato.telefone}</li>
              <li>${c.contato.email}</li>
              <li>${c.endereco.completo}</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ${c.empresa.razaoSocial} — CNPJ ${c.empresa.cnpj}</span>
          <span>Feito com dedicação em ${c.endereco.cidade}/${c.endereco.estado}</span>
        </div>
      </div>
    </footer>
    <a class="whats-float" href="${wa}" target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7C17.17 3.03 14.69 2 12.04 2m0 1.67c2.2 0 4.27.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.13.82.84-3.05-.2-.31a8.18 8.18 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.22-8.24m-4.52 4.7c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.13.17 1.76 2.8 4.38 3.85 2.16.87 2.6.7 3.07.65.47-.04 1.5-.61 1.72-1.2.21-.59.21-1.1.15-1.2-.06-.11-.23-.17-.48-.3-.25-.12-1.5-.74-1.73-.82-.23-.09-.4-.13-.57.13-.17.25-.65.82-.8 1-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.24-.42.08-.17.04-.31-.02-.43-.06-.12-.57-1.4-.79-1.91-.2-.5-.4-.43-.57-.43z"/></svg>
    </a>`;

  document.addEventListener("DOMContentLoaded", () => {
    const h = document.getElementById("site-header");
    const f = document.getElementById("site-footer");
    if (h) h.innerHTML = headerHTML;
    if (f) f.innerHTML = footerHTML;

    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    if (toggle && links) {
      toggle.addEventListener("click", () => links.classList.toggle("open"));
    }
  });
})();
