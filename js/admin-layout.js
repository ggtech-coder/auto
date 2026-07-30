// Injeta a sidebar do painel administrativo em #admin-sidebar
function montarSidebarAdmin(nomeUsuario) {
  const path = location.pathname.split("/").pop() || "dashboard.html";
  const isActive = (p) => (path === p ? "active" : "");
  const el = document.getElementById("admin-sidebar");
  if (!el) return;
  el.innerHTML = `
    <div class="brand"><span class="dot"></span>Rota Certa</div>
    <nav class="admin-nav">
      <a href="dashboard.html" class="${isActive('dashboard.html')}">📊 Dashboard</a>
      <a href="alunos.html" class="${isActive('alunos.html')}">🎓 Alunos</a>
      <a href="instrutores.html" class="${isActive('instrutores.html')}">🧑‍🏫 Instrutores</a>
      <a href="veiculos.html" class="${isActive('veiculos.html')}">🚗 Veículos</a>
      <a href="agendamentos.html" class="${isActive('agendamentos.html')}">📅 Agendamentos</a>
      <a href="financeiro.html" class="${isActive('financeiro.html')}">💳 Financeiro</a>
      <a href="relatorios.html" class="${isActive('relatorios.html')}">📈 Relatórios</a>
      <a href="avisos.html" class="${isActive('avisos.html')}">📣 Avisos</a>
      <a href="../index.html">🌐 Ver site</a>
    </nav>
    <div class="user-box">
      <div>${nomeUsuario || "Administrador"}</div>
      <button onclick="logout()">Sair</button>
    </div>`;
}

// Mostra uma faixa de erro visível no topo da página (em vez de falhar em silêncio).
// Use sempre que uma operação com o Firestore falhar, passando o erro original.
function mostrarErroAdmin(err) {
  console.error(err);
  const main = document.querySelector(".admin-main");
  if (!main) {
    alert("Erro: " + (err && err.message ? err.message : err));
    return;
  }
  let banner = document.getElementById("admin-error-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "admin-error-banner";
    banner.style.cssText = "background:#FBEAE6;border:1px solid #C4432B;color:#C4432B;padding:1rem 1.2rem;border-radius:10px;margin-bottom:1.2rem;font-size:0.88rem;line-height:1.5;";
    main.prepend(banner);
  }
  const codigo = err && err.code ? err.code : "";
  const msg = err && err.message ? err.message : String(err);
  let dica = "";
  if (codigo === "permission-denied") {
    dica = "Isso costuma acontecer quando o documento do administrador em <code>users/{uid}</code> não tem <code>role: \"admin\"</code>, ou as regras do Firestore ainda não foram publicadas. Confira o passo 3 do README.";
  } else if (/index/i.test(msg)) {
    dica = "O Firestore está pedindo um índice para essa consulta. Abra o Console (F12) — deve aparecer um link azul clicável para criar o índice automaticamente. Clique nele, aguarde 1-2 minutos e recarregue a página.";
  }
  banner.innerHTML = `<strong>Não foi possível carregar/salvar os dados.</strong><br>Detalhe técnico: <code>${codigo || msg}</code>${dica ? "<br>" + dica : ""}`;
}
