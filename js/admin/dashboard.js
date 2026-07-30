(async function () {
  let sessao;
  try {
    sessao = await exigirLogin("admin");
  } catch (err) {
    return; // exigirLogin já mostra a mensagem de erro na tela
  }
  montarSidebarAdmin(sessao.dados.nome);

  document.getElementById("dataHoje").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  try {
    await carregarDashboard();
  } catch (err) {
    mostrarErroAdmin(err);
  }
})();

async function carregarDashboard() {
  const hoje = hojeISO();

  // Busca as coleções inteiras e faz todo o cálculo no navegador.
  // Isso evita a necessidade de qualquer índice composto no Firestore.
  const [alunosSnap, agendamentosSnap] = await Promise.all([
    db.collection("alunos").get(),
    db.collection("agendamentos").get(),
  ]);

  const alunos = alunosSnap.docs.map((d) => d.data());
  const agendamentos = agendamentosSnap.docs.map((d) => d.data());

  document.getElementById("kpiAlunos").textContent = alunos.length;
  document.getElementById("kpiHoje").textContent = agendamentos.filter((a) => a.data === hoje).length;
  document.getElementById("kpiFuturos").textContent = agendamentos.filter((a) => a.data > hoje && a.status === "confirmado").length;

  const limite = new Date(); limite.setDate(limite.getDate() - 30);
  const cancelamentos30 = agendamentos.filter((a) => a.status === "cancelado" && a.criadoEm && a.criadoEm.toDate() >= limite);
  document.getElementById("kpiCancelamentos").textContent = cancelamentos30.length;

  // Gráfico: novos cadastros últimos 7 dias
  const dias7 = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const contagemPorDia = Object.fromEntries(dias7.map((d) => [d, 0]));
  alunos.forEach((a) => {
    if (a.criadoEm) {
      const iso = a.criadoEm.toDate().toISOString().slice(0, 10);
      if (contagemPorDia[iso] !== undefined) contagemPorDia[iso]++;
    }
  });
  new Chart(document.getElementById("chartCadastros"), {
    type: "line",
    data: {
      labels: dias7.map((d) => formatarDataBR(d).slice(0, 5)),
      datasets: [{ label: "Novos alunos", data: dias7.map((d) => contagemPorDia[d]), borderColor: "#1E4FD8", backgroundColor: "rgba(30,79,216,0.1)", tension: 0.35, fill: true }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
  });

  // Gráfico: agendamentos por status
  const statusCount = { confirmado: 0, cancelado: 0, concluido: 0, falta: 0 };
  agendamentos.forEach((a) => { if (statusCount[a.status] !== undefined) statusCount[a.status]++; });
  new Chart(document.getElementById("chartStatus"), {
    type: "doughnut",
    data: {
      labels: ["Confirmados", "Cancelados", "Concluídos", "Faltas"],
      datasets: [{ data: [statusCount.confirmado, statusCount.cancelado, statusCount.concluido, statusCount.falta], backgroundColor: ["#1E4FD8", "#C4432B", "#2E7D5B", "#FFC63D"] }],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });

  // Próximos agendamentos (tabela)
  const proximos = agendamentos
    .filter((a) => a.data >= hoje && a.status === "confirmado")
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
    .slice(0, 10);
  const tbody = document.querySelector("#tabelaProximos tbody");
  tbody.innerHTML = proximos.length
    ? proximos.map((a) => `<tr><td>${a.alunoNome}</td><td>${a.categoria}</td><td>${a.instrutorNome}</td><td>${formatarDataBR(a.data)}</td><td>${a.horario}</td><td><span class="badge badge-${a.status}">${a.status}</span></td></tr>`).join("")
    : "<tr><td colspan='6' class='empty-state'>Nenhum agendamento futuro no momento.</td></tr>";
}
