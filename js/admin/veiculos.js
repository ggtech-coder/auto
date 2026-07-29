let veiculosTodos = [];

(async function init() {
  const { dados } = await exigirLogin("admin");
  montarSidebarAdmin(dados.nome);

  const vCategoria = document.getElementById("vCategoria");
  SITE_CONFIG.categorias.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = `Categoria ${c}`;
    vCategoria.appendChild(opt);
  });

  await carregarVeiculos();
  document.getElementById("btnNovoVeiculo").addEventListener("click", () => {
    document.getElementById("modalVeiculoTitulo").textContent = "Novo veículo";
    document.getElementById("formVeiculo").reset();
    document.getElementById("veiculoId").value = "";
    document.getElementById("modalVeiculo").classList.add("open");
  });
  document.getElementById("formVeiculo").addEventListener("submit", salvarVeiculo);
})();

async function carregarVeiculos() {
  const snap = await db.collection("veiculos").orderBy("modelo").get();
  veiculosTodos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const tbody = document.querySelector("#tabelaVeiculos tbody");
  if (veiculosTodos.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7' class='empty-state'>Nenhum veículo cadastrado ainda.</td></tr>";
    return;
  }
  tbody.innerHTML = veiculosTodos.map((v) => `
    <tr>
      <td>${v.modelo}</td><td>${v.marca}</td><td>${v.ano || "-"}</td><td>${v.placa}</td><td>${v.categoria || "-"}</td>
      <td><span class="badge badge-${v.situacao}">${v.situacao}</span></td>
      <td>
        <button class="icon-btn" onclick="editarVeiculo('${v.id}')">Editar</button>
        <button class="icon-btn danger" onclick="excluirVeiculo('${v.id}')">Excluir</button>
      </td>
    </tr>`).join("");
}

window.editarVeiculo = function (id) {
  const v = veiculosTodos.find((x) => x.id === id);
  document.getElementById("modalVeiculoTitulo").textContent = "Editar veículo";
  document.getElementById("veiculoId").value = v.id;
  document.getElementById("vModelo").value = v.modelo || "";
  document.getElementById("vMarca").value = v.marca || "";
  document.getElementById("vAno").value = v.ano || "";
  document.getElementById("vPlaca").value = v.placa || "";
  document.getElementById("vCategoria").value = v.categoria || "";
  document.getElementById("vSituacao").value = v.situacao || "disponivel";
  document.getElementById("modalVeiculo").classList.add("open");
};

window.fecharModalVeiculo = () => document.getElementById("modalVeiculo").classList.remove("open");

async function salvarVeiculo(e) {
  e.preventDefault();
  const id = document.getElementById("veiculoId").value;
  const payload = {
    modelo: document.getElementById("vModelo").value.trim(),
    marca: document.getElementById("vMarca").value.trim(),
    ano: Number(document.getElementById("vAno").value) || null,
    placa: document.getElementById("vPlaca").value.trim().toUpperCase(),
    categoria: document.getElementById("vCategoria").value,
    situacao: document.getElementById("vSituacao").value,
  };
  if (id) {
    await db.collection("veiculos").doc(id).update(payload);
  } else {
    await db.collection("veiculos").add(payload);
  }
  fecharModalVeiculo();
  await carregarVeiculos();
}

window.excluirVeiculo = async function (id) {
  if (!confirm("Excluir este veículo?")) return;
  await db.collection("veiculos").doc(id).delete();
  await carregarVeiculos();
};
