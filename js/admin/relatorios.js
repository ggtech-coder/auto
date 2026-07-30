let relatorioAtual = { colunas: [], linhas: [], titulo: "" };

(async function init() {
  let sessao;
  try {
    sessao = await exigirLogin("admin");
  } catch (err) {
    return;
  }
  montarSidebarAdmin(sessao.dados.nome);

  document.getElementById("tipoRelatorio").addEventListener("change", gerarRelatorio);
  document.getElementById("btnExportarCsv").addEventListener("click", exportarCsv);
  document.getElementById("btnExportarPdf").addEventListener("click", exportarPdf);

  try {
    await gerarRelatorio();
  } catch (err) {
    mostrarErroAdmin(err);
  }
})();

async function gerarRelatorio() {
  const tipo = document.getElementById("tipoRelatorio").value;
  const thead = document.querySelector("#tabelaRelatorio thead");
  const tbody = document.querySelector("#tabelaRelatorio tbody");
  tbody.innerHTML = "<tr><td>Carregando...</td></tr>";

  let colunas = [];
  let linhas = [];
  let titulo = "";

  try {

  if (tipo === "matriculas") {
    titulo = "Relatório de Matrículas";
    colunas = ["Nome", "CPF", "Categoria", "Situação", "Cadastrado em"];
    const snap = await db.collection("alunos").get();
    linhas = snap.docs.map((d) => {
      const a = d.data();
      return [a.nome, a.cpf, a.categoria || "-", a.situacao || "-", formatarDataHoraBR(a.criadoEm)];
    });
  }

  if (tipo === "aulasRealizadas") {
    titulo = "Aulas Realizadas";
    colunas = ["Aluno", "Categoria", "Tipo", "Instrutor", "Data", "Horário"];
    const snap = await db.collection("agendamentos").where("status", "==", "concluido").get();
    linhas = snap.docs.map((d) => {
      const a = d.data();
      return [a.alunoNome, a.categoria, a.tipoAula, a.instrutorNome, formatarDataBR(a.data), a.horario];
    });
  }

  if (tipo === "faltas") {
    titulo = "Relatório de Faltas";
    colunas = ["Aluno", "Categoria", "Instrutor", "Data", "Horário"];
    const snap = await db.collection("agendamentos").where("status", "==", "falta").get();
    linhas = snap.docs.map((d) => {
      const a = d.data();
      return [a.alunoNome, a.categoria, a.instrutorNome, formatarDataBR(a.data), a.horario];
    });
  }

  if (tipo === "agendamentos") {
    titulo = "Todos os Agendamentos";
    colunas = ["Aluno", "Categoria", "Tipo", "Instrutor", "Data", "Horário", "Status"];
    const snap = await db.collection("agendamentos").orderBy("data", "desc").limit(500).get();
    linhas = snap.docs.map((d) => {
      const a = d.data();
      return [a.alunoNome, a.categoria, a.tipoAula, a.instrutorNome, formatarDataBR(a.data), a.horario, a.status];
    });
  }

  if (tipo === "instrutores") {
    titulo = "Relatório de Instrutores";
    colunas = ["Nome", "Telefone", "Categorias", "Ativo"];
    const snap = await db.collection("instrutores").get();
    linhas = snap.docs.map((d) => {
      const i = d.data();
      return [i.nome, i.telefone || "-", (i.categorias || []).join(", "), i.ativo ? "Sim" : "Não"];
    });
  }

  if (tipo === "veiculos") {
    titulo = "Relatório de Veículos";
    colunas = ["Modelo", "Marca", "Ano", "Placa", "Categoria", "Situação"];
    const snap = await db.collection("veiculos").get();
    linhas = snap.docs.map((d) => {
      const v = d.data();
      return [v.modelo, v.marca, v.ano || "-", v.placa, v.categoria || "-", v.situacao];
    });
  }

  if (tipo === "novosAlunos") {
    titulo = "Novos Alunos (últimos 30 dias)";
    colunas = ["Nome", "CPF", "Cadastrado em"];
    const limite = new Date(); limite.setDate(limite.getDate() - 30);
    const snap = await db.collection("alunos").get();
    linhas = snap.docs.filter((d) => {
      const c = d.data().criadoEm;
      return c && c.toDate() >= limite;
    }).map((d) => {
      const a = d.data();
      return [a.nome, a.cpf, formatarDataHoraBR(a.criadoEm)];
    });
  }

  if (tipo === "crescimentoMensal") {
    titulo = "Crescimento Mensal de Matrículas";
    colunas = ["Mês", "Novas matrículas"];
    const snap = await db.collection("alunos").get();
    const porMes = {};
    snap.docs.forEach((d) => {
      const c = d.data().criadoEm;
      if (c) {
        const mes = c.toDate().toISOString().slice(0, 7);
        porMes[mes] = (porMes[mes] || 0) + 1;
      }
    });
    linhas = Object.keys(porMes).sort().map((mes) => [mes, porMes[mes]]);
  }

  if (tipo === "horariosMaisUsados") {
    titulo = "Horários Mais Utilizados";
    colunas = ["Horário", "Quantidade de agendamentos"];
    const snap = await db.collection("agendamentos").get();
    const porHorario = {};
    snap.docs.forEach((d) => {
      const h = d.data().horario;
      if (h) porHorario[h] = (porHorario[h] || 0) + 1;
    });
    linhas = Object.entries(porHorario).sort((a, b) => b[1] - a[1]).map(([h, q]) => [h, q]);
  }

  relatorioAtual = { colunas, linhas, titulo };

  thead.innerHTML = `<tr>${colunas.map((c) => `<th>${c}</th>`).join("")}</tr>`;
  if (linhas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${colunas.length}" class="empty-state">Nenhum dado encontrado para este relatório.</td></tr>`;
  } else {
    tbody.innerHTML = linhas.map((linha) => `<tr>${linha.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
  }
  } catch (err) {
    mostrarErroAdmin(err);
    tbody.innerHTML = `<tr><td class="empty-state">Não foi possível gerar este relatório. Veja o aviso acima.</td></tr>`;
  }
}

function exportarCsv() {
  const { colunas, linhas, titulo } = relatorioAtual;
  if (linhas.length === 0) { alert("Não há dados para exportar."); return; }
  const csvLinhas = [colunas.join(";"), ...linhas.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))];
  const blob = new Blob(["\uFEFF" + csvLinhas.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${titulo.replace(/\s+/g, "_").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportarPdf() {
  const { colunas, linhas, titulo } = relatorioAtual;
  if (linhas.length === 0) { alert("Não há dados para exportar."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Autoescola Rota Certa — ${titulo}`, 14, 16);
  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 22);
  doc.autoTable({ head: [colunas], body: linhas, startY: 28, styles: { fontSize: 8 } });
  doc.save(`${titulo.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}
