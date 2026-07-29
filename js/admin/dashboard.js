(async function () {
  const { dados } = await exigirLogin("admin");
  montarSidebarAdmin(dados.nome);

  document.getElementById("dataHoje").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const hoje = hojeISO();

  // Total de alunos
  const alunosSnap = await db.collection("alunos").get();
  document.getElementById("kpiAlunos").textContent = alunosSnap.size;

  // Agendamentos hoje
  const hojeSnap = await db.collection("agendamentos").where("data", "==", hoje).get();
  document.getElementById("kpiHoje").textContent = hojeSnap.size;

  // Agendamentos futuros (data > hoje, status confirmado)
  const futurosSnap = await db.collection("agendamentos")
    .where("data", ">", hoje).where("status", "==", "confirmado").get();
  document.getElementById("kpiFuturos").textContent = futurosSnap.size;

  // Cancelamentos últimos 30 dias
  const limite = new Date(); limite.setDate(limite.getDate() - 30);
  const todosSnap = await db.collection("agendamentos").where("status", "==", "cancelado").get();
  const cancelamentos30 = todosSnap.docs.filter((d) => {
    const c = d.data().criadoEm;
    return c && c.toDate() >= limite;
  });
  document.getElementById("kpiCancelamentos").textContent = cancelamentos30.length;

  // Gráfico: novos cadastros últimos 7 dias
  const dias7 = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const contagemPorDia = Object.fromEntries(dias7.map((d) => [d, 0]));
  alunosSnap.docs.forEach((doc) => {
    const c = doc.data().criadoEm;
    if (c) {
      const iso = c.toDate().toISOString().slice(0, 10);
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
  const todosAgendamentosSnap = await db.collection("agendamentos").get();
  const statusCount = { confirmado: 0, cancelado: 0, concluido: 0, falta: 0 };
  todosAgendamentosSnap.docs.forEach((d) => {
    const s = d.data().status;
    if (statusCount[s] !== undefined) statusCount[s]++;
  });
  new Chart(document.getElementById("chartStatus"), {
    type: "doughnut",
    data: {
      labels: ["Confirmados", "Cancelados", "Concluídos", "Faltas"],
      datasets: [{ data: [statusCount.confirmado, statusCount.cancelado, statusCount.concluido, statusCount.falta], backgroundColor: ["#1E4FD8", "#C4432B", "#2E7D5B", "#FFC63D"] }],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });

  // Próximos agendamentos (tabela)
  const proximosSnap = await db.collection("agendamentos")
    .where("data", ">=", hoje).where("status", "==", "confirmado")
    .orderBy("data").limit(10).get();
  const tbody = document.querySelector("#tabelaProximos tbody");
  if (proximosSnap.empty) {
    tbody.innerHTML = "<tr><td colspan='6' class='empty-state'>Nenhum agendamento futuro no momento.</td></tr>";
  } else {
    tbody.innerHTML = proximosSnap.docs.map((doc) => {
      const a = doc.data();
      return `<tr><td>${a.alunoNome}</td><td>${a.categoria}</td><td>${a.instrutorNome}</td><td>${formatarDataBR(a.data)}</td><td>${a.horario}</td><td><span class="badge badge-${a.status}">${a.status}</span></td></tr>`;
    }).join("");
  }
})();
