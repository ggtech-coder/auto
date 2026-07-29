(async function init() {
  const { dados } = await exigirLogin("aluno");
  document.getElementById("nomeAlunoSidebar").textContent = dados.nome || "Aluno";
  document.getElementById("nomeAlunoTopo").textContent = (dados.nome || "Aluno").split(" ")[0];

  const alunoDoc = await db.collection("alunos").doc(dados.alunoId).get();
  const aluno = alunoDoc.exists ? alunoDoc.data() : {};

  document.getElementById("badgeSituacao").textContent = aluno.situacao || "pendente";
  document.getElementById("badgeSituacao").className = `badge badge-${aluno.situacao || "pendente"}`;
  document.getElementById("infoCategoria").textContent = aluno.categoria || "Não definida";

  document.getElementById("meusDados").innerHTML = `
    <strong>Nome:</strong> ${aluno.nome || "-"}<br>
    <strong>CPF:</strong> ${aluno.cpf || "-"}<br>
    <strong>Telefone:</strong> ${aluno.telefone || "-"}<br>
    <strong>E-mail:</strong> ${aluno.email || "-"}<br>
    <strong>Endereço:</strong> ${aluno.endereco || "-"}`;

  document.getElementById("btnEditarDados").addEventListener("click", () => {
    window.open(linkWhatsApp(SITE_CONFIG.contato.whatsapp, `Olá! Sou o(a) aluno(a) ${aluno.nome}, CPF ${aluno.cpf}, e gostaria de atualizar meus dados cadastrais.`), "_blank");
  });

  // Agendamentos do aluno (por CPF)
  if (aluno.cpf) {
    const snap = await db.collection("agendamentos").where("alunoCpf", "==", aluno.cpf).get();
    const todos = snap.docs.map((d) => d.data());
    const hoje = hojeISO();

    const proximas = todos.filter((a) => a.status === "confirmado" && a.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
    const historico = todos.filter((a) => a.status !== "confirmado" || a.data < hoje).sort((a, b) => b.data.localeCompare(a.data));
    const concluidas = todos.filter((a) => a.status === "concluido").length;
    const faltas = todos.filter((a) => a.status === "falta").length;

    document.getElementById("infoConcluidas").textContent = concluidas;
    document.getElementById("infoFaltas").textContent = faltas;
    document.getElementById("infoProximaAula").textContent = proximas[0] ? `${formatarDataBR(proximas[0].data)} às ${proximas[0].horario}` : "Nenhuma";

    const tbodyProx = document.querySelector("#tabelaProximasAulas tbody");
    tbodyProx.innerHTML = proximas.length
      ? proximas.map((a) => `<tr><td>${formatarDataBR(a.data)}</td><td>${a.horario}</td><td>${a.tipoAula}</td><td>${a.instrutorNome}</td><td><span class="badge badge-${a.status}">${a.status}</span></td></tr>`).join("")
      : "<tr><td colspan='5' class='empty-state'>Nenhuma aula agendada. <a href='../agendamento.html'>Agendar agora</a>.</td></tr>";

    const tbodyHist = document.querySelector("#tabelaHistoricoAluno tbody");
    tbodyHist.innerHTML = historico.length
      ? historico.map((a) => `<tr><td>${formatarDataBR(a.data)}</td><td>${a.horario}</td><td>${a.tipoAula}</td><td>${a.instrutorNome}</td><td><span class="badge badge-${a.status}">${a.status}</span></td></tr>`).join("")
      : "<tr><td colspan='5' class='empty-state'>Nenhum histórico ainda.</td></tr>";
  }

  // Avisos
  const avisosSnap = await db.collection("avisos").orderBy("criadoEm", "desc").limit(5).get();
  const listaAvisos = document.getElementById("listaAvisos");
  if (avisosSnap.empty) {
    listaAvisos.innerHTML = "<p class='form-help'>Nenhum comunicado no momento.</p>";
  } else {
    listaAvisos.innerHTML = avisosSnap.docs.map((d) => {
      const a = d.data();
      return `<div class="aviso-card"><h4>${a.titulo}</h4><p style="font-size:0.88rem;">${a.mensagem}</p><span>${formatarDataHoraBR(a.criadoEm)}</span></div>`;
    }).join("");
  }
})();
