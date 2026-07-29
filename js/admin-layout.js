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
