let alunosTodos = [];

(async function init() {
  const { dados } = await exigirLogin("admin");
  montarSidebarAdmin(dados.nome);

  const fCategoria = document.getElementById("fCategoria");
  SITE_CONFIG.categorias.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = `Categoria ${c}`;
    fCategoria.appendChild(opt);
  });

  await carregarAlunos();

  document.getElementById("btnNovoAluno").addEventListener("click", () => abrirModalAluno());
  document.getElementById("formAluno").addEventListener("submit", salvarAluno);
  document.getElementById("buscaAluno").addEventListener("input", renderizarTabela);
  document.getElementById("filtroSituacao").addEventListener("change", renderizarTabela);
})();

async function carregarAlunos() {
  const snap = await db.collection("alunos").orderBy("nome").get();
  alunosTodos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderizarTabela();
}

function renderizarTabela() {
  const busca = document.getElementById("buscaAluno").value.toLowerCase();
  const situacao = document.getElementById("filtroSituacao").value;
  const filtrados = alunosTodos.filter((a) => {
    const bateBusca = !busca || a.nome.toLowerCase().includes(busca) || (a.cpf || "").includes(busca);
    const bateSituacao = !situacao || a.situacao === situacao;
    return bateBusca && bateSituacao;
  });
  const tbody = document.querySelector("#tabelaAlunos tbody");
  if (filtrados.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' class='empty-state'>Nenhum aluno encontrado.</td></tr>";
    return;
  }
  tbody.innerHTML = filtrados.map((a) => `
    <tr>
      <td>${a.nome}</td>
      <td>${a.cpf || "-"}</td>
      <td>${a.telefone || "-"}</td>
      <td>${a.categoria || "-"}</td>
      <td><span class="badge badge-${a.situacao || 'pendente'}">${a.situacao || "pendente"}</span></td>
      <td>
        <button class="icon-btn" onclick="verHistorico('${a.id}')">Histórico</button>
        <button class="icon-btn" onclick="editarAluno('${a.id}')">Editar</button>
        <button class="icon-btn danger" onclick="excluirAluno('${a.id}')">Excluir</button>
      </td>
    </tr>`).join("");
}

function abrirModalAluno() {
  document.getElementById("modalAlunoTitulo").textContent = "Novo aluno";
  document.getElementById("formAluno").reset();
  document.getElementById("alunoId").value = "";
  document.getElementById("modalAluno").classList.add("open");
}

window.editarAluno = function (id) {
  const a = alunosTodos.find((x) => x.id === id);
  document.getElementById("modalAlunoTitulo").textContent = "Editar aluno";
  document.getElementById("alunoId").value = a.id;
  document.getElementById("fNome").value = a.nome || "";
  document.getElementById("fCpf").value = a.cpf || "";
  document.getElementById("fRg").value = a.rg || "";
  document.getElementById("fNascimento").value = a.dataNascimento || "";
  document.getElementById("fTelefone").value = a.telefone || "";
  document.getElementById("fEmail").value = a.email || "";
  document.getElementById("fEndereco").value = a.endereco || "";
  document.getElementById("fCategoria").value = a.categoria || "";
  document.getElementById("fSituacao").value = a.situacao || "ativo";
  document.getElementById("modalAluno").classList.add("open");
};

window.fecharModalAluno = function () {
  document.getElementById("modalAluno").classList.remove("open");
};

async function salvarAluno(e) {
  e.preventDefault();
  const id = document.getElementById("alunoId").value;
  const payload = {
    nome: document.getElementById("fNome").value.trim(),
    cpf: document.getElementById("fCpf").value.trim(),
    rg: document.getElementById("fRg").value.trim(),
    dataNascimento: document.getElementById("fNascimento").value,
    telefone: document.getElementById("fTelefone").value.trim(),
    email: document.getElementById("fEmail").value.trim(),
    endereco: document.getElementById("fEndereco").value.trim(),
    categoria: document.getElementById("fCategoria").value,
    situacao: document.getElementById("fSituacao").value,
  };
  if (id) {
    await db.collection("alunos").doc(id).update(payload);
  } else {
    payload.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection("alunos").add(payload);
  }
  fecharModalAluno();
  await carregarAlunos();
}

window.excluirAluno = async function (id) {
  if (!confirm("Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.")) return;
  await db.collection("alunos").doc(id).delete();
  await carregarAlunos();
};

window.verHistorico = async function (id) {
  const aluno = alunosTodos.find((a) => a.id === id);
  const snap = await db.collection("agendamentos").where("alunoCpf", "==", aluno.cpf).orderBy("data", "desc").get();
  const tbody = document.querySelector("#tabelaHistorico tbody");
  if (snap.empty) {
    tbody.innerHTML = "<tr><td colspan='5' class='empty-state'>Nenhuma aula registrada.</td></tr>";
  } else {
    tbody.innerHTML = snap.docs.map((d) => {
      const a = d.data();
      return `<tr><td>${formatarDataBR(a.data)}</td><td>${a.horario}</td><td>${a.tipoAula}</td><td>${a.instrutorNome}</td><td><span class="badge badge-${a.status}">${a.status}</span></td></tr>`;
    }).join("");
  }
  document.getElementById("modalHistorico").classList.add("open");
};
