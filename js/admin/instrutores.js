let instrutoresTodos = [];
let veiculosCache = [];
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

(async function init() {
  const { dados } = await exigirLogin("admin");
  montarSidebarAdmin(dados.nome);

  const chipWrap = document.getElementById("chipCategorias");
  SITE_CONFIG.categorias.forEach((c) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${c}"> ${c}`;
    chipWrap.appendChild(label);
  });

  const veicSnap = await db.collection("veiculos").get();
  veiculosCache = veicSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const iVeiculo = document.getElementById("iVeiculo");
  veiculosCache.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.id; opt.textContent = `${v.modelo} — ${v.placa}`;
    iVeiculo.appendChild(opt);
  });

  await carregarInstrutores();
  document.getElementById("btnNovoInstrutor").addEventListener("click", abrirModalInstrutor);
  document.getElementById("formInstrutor").addEventListener("submit", salvarInstrutor);
})();

async function carregarInstrutores() {
  const snap = await db.collection("instrutores").orderBy("nome").get();
  instrutoresTodos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const tbody = document.querySelector("#tabelaInstrutores tbody");
  if (instrutoresTodos.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' class='empty-state'>Nenhum instrutor cadastrado ainda.</td></tr>";
    return;
  }
  tbody.innerHTML = instrutoresTodos.map((i) => {
    const veic = veiculosCache.find((v) => v.id === i.veiculoId);
    return `<tr>
      <td>${i.nome}</td>
      <td>${i.telefone || "-"}</td>
      <td>${(i.categorias || []).join(", ") || "-"}</td>
      <td>${veic ? veic.modelo : "-"}</td>
      <td><span class="badge badge-${i.ativo ? 'ativo' : 'inativo'}">${i.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <button class="icon-btn" onclick="editarInstrutor('${i.id}')">Editar</button>
        <button class="icon-btn danger" onclick="excluirInstrutor('${i.id}')">Excluir</button>
      </td>
    </tr>`;
  }).join("");
}

function abrirModalInstrutor() {
  document.getElementById("modalInstrutorTitulo").textContent = "Novo instrutor";
  document.getElementById("formInstrutor").reset();
  document.getElementById("instrutorId").value = "";
  document.querySelectorAll("#chipCategorias input").forEach((c) => (c.checked = false));
  document.getElementById("modalInstrutor").classList.add("open");
}
window.fecharModalInstrutor = () => document.getElementById("modalInstrutor").classList.remove("open");

window.editarInstrutor = function (id) {
  const i = instrutoresTodos.find((x) => x.id === id);
  document.getElementById("modalInstrutorTitulo").textContent = "Editar instrutor";
  document.getElementById("instrutorId").value = i.id;
  document.getElementById("iNome").value = i.nome || "";
  document.getElementById("iTelefone").value = i.telefone || "";
  document.getElementById("iVeiculo").value = i.veiculoId || "";
  document.getElementById("iAtivo").value = i.ativo ? "true" : "false";
  document.querySelectorAll("#chipCategorias input").forEach((c) => {
    c.checked = (i.categorias || []).includes(c.value);
  });
  DIAS.forEach((dia) => {
    document.getElementById(`d_${dia}`).value = ((i.disponibilidade || {})[dia] || []).join("\n");
  });
  document.getElementById("modalInstrutor").classList.add("open");
};

async function salvarInstrutor(e) {
  e.preventDefault();
  const id = document.getElementById("instrutorId").value;
  const categorias = [...document.querySelectorAll("#chipCategorias input:checked")].map((c) => c.value);
  const disponibilidade = {};
  DIAS.forEach((dia) => {
    disponibilidade[dia] = document.getElementById(`d_${dia}`).value
      .split("\n").map((s) => s.trim()).filter(Boolean);
  });
  const payload = {
    nome: document.getElementById("iNome").value.trim(),
    telefone: document.getElementById("iTelefone").value.trim(),
    categorias,
    veiculoId: document.getElementById("iVeiculo").value || null,
    ativo: document.getElementById("iAtivo").value === "true",
    disponibilidade,
  };
  if (id) {
    await db.collection("instrutores").doc(id).update(payload);
  } else {
    await db.collection("instrutores").add(payload);
  }
  fecharModalInstrutor();
  await carregarInstrutores();
}

window.excluirInstrutor = async function (id) {
  if (!confirm("Excluir este instrutor?")) return;
  await db.collection("instrutores").doc(id).delete();
  await carregarInstrutores();
};
