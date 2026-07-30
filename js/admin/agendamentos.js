let agendamentosTodos = [];
let instrutoresCache2 = [];
let veiculosCache2 = [];

(async function init() {
  let sessao;
  try {
    sessao = await exigirLogin("admin");
  } catch (err) {
    return;
  }
  montarSidebarAdmin(sessao.dados.nome);

  // Popular selects estáticos (config local, não depende do Firestore)
  const catOptions = SITE_CONFIG.categorias.map((c) => `<option value="${c}">Categoria ${c}</option>`).join("");
  document.getElementById("filtroCategoria").insertAdjacentHTML("beforeend", catOptions);
  document.getElementById("aCategoria").innerHTML = "<option value=''>Selecione</option>" + catOptions;

  const tipoOptions = SITE_CONFIG.tiposAula.map((t) => `<option value="${t}">${t}</option>`).join("");
  document.getElementById("filtroTipo").insertAdjacentHTML("beforeend", tipoOptions);
  document.getElementById("aTipo").innerHTML = "<option value=''>Selecione</option>" + tipoOptions;

  // Botões e filtros já ficam funcionais aqui, independente do carregamento abaixo
  document.getElementById("btnNovoAgendamento").addEventListener("click", () => {
    document.getElementById("modalAgendamentoTitulo").textContent = "Novo agendamento";
    document.getElementById("formAgendamento").reset();
    document.getElementById("agendamentoId").value = "";
    document.getElementById("modalAgendamento").classList.add("open");
  });
  document.getElementById("formAgendamento").addEventListener("submit", salvarAgendamento);
  document.getElementById("btnLimparFiltros").addEventListener("click", () => {
    ["filtroData", "filtroInstrutor", "filtroCategoria", "filtroTipo", "filtroStatus"].forEach((id) => (document.getElementById(id).value = ""));
    renderizarAgendamentos();
  });
  ["filtroData", "filtroInstrutor", "filtroCategoria", "filtroTipo", "filtroStatus"].forEach((id) =>
    document.getElementById(id).addEventListener("change", renderizarAgendamentos));

  try {
    const instrutoresSnap = await db.collection("instrutores").get();
    instrutoresCache2 = instrutoresSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    document.getElementById("filtroInstrutor").insertAdjacentHTML("beforeend",
      instrutoresCache2.map((i) => `<option value="${i.id}">${i.nome}</option>`).join(""));
    document.getElementById("aInstrutor").innerHTML = "<option value=''>Selecione</option>" +
      instrutoresCache2.map((i) => `<option value="${i.id}">${i.nome}</option>`).join("");

    const veiculosSnap = await db.collection("veiculos").get();
    veiculosCache2 = veiculosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    document.getElementById("aVeiculo").innerHTML = "<option value=''>-</option>" +
      veiculosCache2.map((v) => `<option value="${v.id}">${v.modelo} — ${v.placa}</option>`).join("");

    await carregarAgendamentos();
  } catch (err) {
    mostrarErroAdmin(err);
    document.querySelector("#tabelaAgendamentos tbody").innerHTML = "<tr><td colspan='8' class='empty-state'>Não foi possível carregar os agendamentos. Veja o aviso acima.</td></tr>";
  }
})();

async function carregarAgendamentos() {
  const snap = await db.collection("agendamentos").orderBy("data", "desc").limit(300).get();
  agendamentosTodos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderizarAgendamentos();
}

function renderizarAgendamentos() {
  const fData = document.getElementById("filtroData").value;
  const fInstrutor = document.getElementById("filtroInstrutor").value;
  const fCategoria = document.getElementById("filtroCategoria").value;
  const fTipo = document.getElementById("filtroTipo").value;
  const fStatus = document.getElementById("filtroStatus").value;

  const filtrados = agendamentosTodos.filter((a) =>
    (!fData || a.data === fData) &&
    (!fInstrutor || a.instrutorId === fInstrutor) &&
    (!fCategoria || a.categoria === fCategoria) &&
    (!fTipo || a.tipoAula === fTipo) &&
    (!fStatus || a.status === fStatus)
  );

  const tbody = document.querySelector("#tabelaAgendamentos tbody");
  if (filtrados.length === 0) {
    tbody.innerHTML = "<tr><td colspan='8' class='empty-state'>Nenhum agendamento encontrado com esses filtros.</td></tr>";
    return;
  }
  tbody.innerHTML = filtrados.map((a) => `
    <tr>
      <td>${a.alunoNome}</td><td>${a.categoria}</td><td>${a.tipoAula}</td><td>${a.instrutorNome}</td>
      <td>${formatarDataBR(a.data)}</td><td>${a.horario}</td>
      <td><span class="badge badge-${a.status}">${a.status}</span></td>
      <td>
        ${a.status === "confirmado" ? `<button class="icon-btn" onclick="marcarStatus('${a.id}','concluido')">Confirmar presença</button>` : ""}
        <button class="icon-btn" onclick="editarAgendamento('${a.id}')">Editar</button>
        ${a.status !== "cancelado" ? `<button class="icon-btn danger" onclick="marcarStatus('${a.id}','cancelado')">Cancelar</button>` : ""}
      </td>
    </tr>`).join("");
}

window.marcarStatus = async function (id, status) {
  try {
    await db.collection("agendamentos").doc(id).update({ status });
    await carregarAgendamentos();
  } catch (err) {
    alert("Não foi possível atualizar o status.\n\nDetalhe técnico: " + (err.code || err.message));
    mostrarErroAdmin(err);
  }
};

window.editarAgendamento = function (id) {
  const a = agendamentosTodos.find((x) => x.id === id);
  document.getElementById("modalAgendamentoTitulo").textContent = "Editar agendamento";
  document.getElementById("agendamentoId").value = a.id;
  document.getElementById("aNome").value = a.alunoNome || "";
  document.getElementById("aCpf").value = a.alunoCpf || "";
  document.getElementById("aTelefone").value = a.alunoTelefone || "";
  document.getElementById("aEmail").value = a.alunoEmail || "";
  document.getElementById("aCategoria").value = a.categoria || "";
  document.getElementById("aTipo").value = a.tipoAula || "";
  document.getElementById("aInstrutor").value = a.instrutorId || "";
  document.getElementById("aVeiculo").value = a.veiculoId || "";
  document.getElementById("aData").value = a.data || "";
  document.getElementById("aHorario").value = a.horario || "";
  document.getElementById("aStatus").value = a.status || "confirmado";
  document.getElementById("modalAgendamento").classList.add("open");
};

window.fecharModalAgendamento = () => document.getElementById("modalAgendamento").classList.remove("open");

async function salvarAgendamento(e) {
  e.preventDefault();
  const btnSalvar = e.target.querySelector("button[type='submit']");
  const textoOriginal = btnSalvar.textContent;
  btnSalvar.disabled = true;
  btnSalvar.textContent = "Salvando...";

  const id = document.getElementById("agendamentoId").value;
  const instrutor = instrutoresCache2.find((i) => i.id === document.getElementById("aInstrutor").value);
  const payload = {
    alunoNome: document.getElementById("aNome").value.trim(),
    alunoCpf: document.getElementById("aCpf").value.trim(),
    alunoTelefone: document.getElementById("aTelefone").value.trim(),
    alunoEmail: document.getElementById("aEmail").value.trim(),
    categoria: document.getElementById("aCategoria").value,
    tipoAula: document.getElementById("aTipo").value,
    instrutorId: document.getElementById("aInstrutor").value,
    instrutorNome: instrutor ? instrutor.nome : "",
    veiculoId: document.getElementById("aVeiculo").value || null,
    data: document.getElementById("aData").value,
    horario: document.getElementById("aHorario").value,
    status: document.getElementById("aStatus").value,
  };

  // Impede horário duplicado (mesmo instrutor, data e horário, outro agendamento ativo)
  const conflito = agendamentosTodos.find((a) =>
    a.id !== id && a.instrutorId === payload.instrutorId && a.data === payload.data &&
    a.horario === payload.horario && ["confirmado", "concluido"].includes(a.status)
  );
  if (conflito && ["confirmado", "concluido"].includes(payload.status)) {
    alert("Já existe um agendamento confirmado para este instrutor neste horário.");
    btnSalvar.disabled = false;
    btnSalvar.textContent = textoOriginal;
    return;
  }

  try {
    if (id) {
      await db.collection("agendamentos").doc(id).update(payload);
    } else {
      payload.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("agendamentos").add(payload);
    }
    fecharModalAgendamento();
    await carregarAgendamentos();
  } catch (err) {
    alert("Não foi possível salvar o agendamento.\n\nDetalhe técnico: " + (err.code || err.message));
    mostrarErroAdmin(err);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = textoOriginal;
  }
}
