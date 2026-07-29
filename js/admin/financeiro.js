let pagamentosTodos = [];

(async function init() {
  const { dados } = await exigirLogin("admin");
  montarSidebarAdmin(dados.nome);
  await carregarPagamentos();
  document.getElementById("btnNovoPagamento").addEventListener("click", () => {
    document.getElementById("modalPagamentoTitulo").textContent = "Novo lançamento";
    document.getElementById("formPagamento").reset();
    document.getElementById("pagamentoId").value = "";
    document.getElementById("modalPagamento").classList.add("open");
  });
  document.getElementById("formPagamento").addEventListener("submit", salvarPagamento);
})();

async function carregarPagamentos() {
  const snap = await db.collection("pagamentos").orderBy("data", "desc").get();
  pagamentosTodos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const mesAtual = hojeISO().slice(0, 7);
  const recebido = pagamentosTodos.filter((p) => p.status === "pago" && (p.data || "").startsWith(mesAtual))
    .reduce((s, p) => s + Number(p.valor || 0), 0);
  const pendente = pagamentosTodos.filter((p) => p.status === "pendente").reduce((s, p) => s + Number(p.valor || 0), 0);
  const atrasado = pagamentosTodos.filter((p) => p.status === "atrasado").reduce((s, p) => s + Number(p.valor || 0), 0);

  document.getElementById("kpiRecebido").textContent = formatarMoeda(recebido);
  document.getElementById("kpiPendente").textContent = formatarMoeda(pendente);
  document.getElementById("kpiAtrasado").textContent = formatarMoeda(atrasado);

  const tbody = document.querySelector("#tabelaFinanceiro tbody");
  if (pagamentosTodos.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7' class='empty-state'>Nenhum lançamento financeiro ainda.</td></tr>";
    return;
  }
  tbody.innerHTML = pagamentosTodos.map((p) => `
    <tr>
      <td>${p.aluno}</td><td>${p.descricao || "-"}</td><td>${formatarMoeda(p.valor)}</td><td>${p.forma}</td>
      <td>${formatarDataBR(p.data)}</td>
      <td><span class="badge badge-${p.status}">${p.status}</span></td>
      <td>
        <button class="icon-btn" onclick="editarPagamento('${p.id}')">Editar</button>
        <button class="icon-btn danger" onclick="excluirPagamento('${p.id}')">Excluir</button>
      </td>
    </tr>`).join("");
}

function formatarMoeda(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

window.editarPagamento = function (id) {
  const p = pagamentosTodos.find((x) => x.id === id);
  document.getElementById("modalPagamentoTitulo").textContent = "Editar lançamento";
  document.getElementById("pagamentoId").value = p.id;
  document.getElementById("pAluno").value = p.aluno || "";
  document.getElementById("pDescricao").value = p.descricao || "";
  document.getElementById("pValor").value = p.valor || "";
  document.getElementById("pForma").value = p.forma || "PIX";
  document.getElementById("pData").value = p.data || "";
  document.getElementById("pStatus").value = p.status || "pendente";
  document.getElementById("modalPagamento").classList.add("open");
};
window.fecharModalPagamento = () => document.getElementById("modalPagamento").classList.remove("open");

async function salvarPagamento(e) {
  e.preventDefault();
  const id = document.getElementById("pagamentoId").value;
  const payload = {
    aluno: document.getElementById("pAluno").value.trim(),
    descricao: document.getElementById("pDescricao").value.trim(),
    valor: Number(document.getElementById("pValor").value),
    forma: document.getElementById("pForma").value,
    data: document.getElementById("pData").value,
    status: document.getElementById("pStatus").value,
  };
  if (id) {
    await db.collection("pagamentos").doc(id).update(payload);
  } else {
    payload.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection("pagamentos").add(payload);
  }
  fecharModalPagamento();
  await carregarPagamentos();
}

window.excluirPagamento = async function (id) {
  if (!confirm("Excluir este lançamento?")) return;
  await db.collection("pagamentos").doc(id).delete();
  await carregarPagamentos();
};
