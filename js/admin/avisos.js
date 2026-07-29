let avisosTodos = [];

(async function init() {
  const { dados } = await exigirLogin("admin");
  montarSidebarAdmin(dados.nome);
  await carregarAvisos();
  document.getElementById("btnNovoAviso").addEventListener("click", () => {
    document.getElementById("formAviso").reset();
    document.getElementById("modalAviso").classList.add("open");
  });
  document.getElementById("formAviso").addEventListener("submit", async (e) => {
    e.preventDefault();
    await db.collection("avisos").add({
      titulo: document.getElementById("avTitulo").value.trim(),
      mensagem: document.getElementById("avMensagem").value.trim(),
      publicoAlvo: "todos",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    });
    document.getElementById("modalAviso").classList.remove("open");
    await carregarAvisos();
  });
})();

async function carregarAvisos() {
  const snap = await db.collection("avisos").orderBy("criadoEm", "desc").get();
  avisosTodos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const tbody = document.querySelector("#tabelaAvisos tbody");
  if (avisosTodos.length === 0) {
    tbody.innerHTML = "<tr><td colspan='4' class='empty-state'>Nenhum aviso publicado ainda.</td></tr>";
    return;
  }
  tbody.innerHTML = avisosTodos.map((a) => `
    <tr>
      <td>${a.titulo}</td><td>${a.mensagem}</td><td>${formatarDataHoraBR(a.criadoEm)}</td>
      <td><button class="icon-btn danger" onclick="excluirAviso('${a.id}')">Excluir</button></td>
    </tr>`).join("");
}

window.excluirAviso = async function (id) {
  if (!confirm("Excluir este aviso?")) return;
  await db.collection("avisos").doc(id).delete();
  await carregarAvisos();
};
