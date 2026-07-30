let avisosTodos = [];

(async function init() {
  let sessao;
  try {
    sessao = await exigirLogin("admin");
  } catch (err) {
    return;
  }
  montarSidebarAdmin(sessao.dados.nome);

  document.getElementById("btnNovoAviso").addEventListener("click", () => {
    document.getElementById("formAviso").reset();
    document.getElementById("modalAviso").classList.add("open");
  });
  document.getElementById("formAviso").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSalvar = e.target.querySelector("button[type='submit']");
    const textoOriginal = btnSalvar.textContent;
    btnSalvar.disabled = true;
    btnSalvar.textContent = "Publicando...";
    try {
      await db.collection("avisos").add({
        titulo: document.getElementById("avTitulo").value.trim(),
        mensagem: document.getElementById("avMensagem").value.trim(),
        publicoAlvo: "todos",
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      });
      document.getElementById("modalAviso").classList.remove("open");
      await carregarAvisos();
    } catch (err) {
      alert("Não foi possível publicar o aviso.\n\nDetalhe técnico: " + (err.code || err.message));
      mostrarErroAdmin(err);
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = textoOriginal;
    }
  });

  try {
    await carregarAvisos();
  } catch (err) {
    mostrarErroAdmin(err);
    document.querySelector("#tabelaAvisos tbody").innerHTML = "<tr><td colspan='4' class='empty-state'>Não foi possível carregar os avisos. Veja o aviso acima.</td></tr>";
  }
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
  try {
    await db.collection("avisos").doc(id).delete();
    await carregarAvisos();
  } catch (err) {
    alert("Não foi possível excluir o aviso.\n\nDetalhe técnico: " + (err.code || err.message));
    mostrarErroAdmin(err);
  }
};
