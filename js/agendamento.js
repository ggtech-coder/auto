// ============================================================
// AGENDAMENTO ONLINE — impede horários duplicados/indisponíveis,
// mostra somente horários livres, grava no Firestore.
// ============================================================

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

document.addEventListener("DOMContentLoaded", async () => {
  // Preenche categorias e tipos de aula a partir do config central
  const catSelect = document.getElementById("categoria");
  SITE_CONFIG.categorias.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = `Categoria ${c}`;
    catSelect.appendChild(opt);
  });
  const tipoSelect = document.getElementById("tipoAula");
  SITE_CONFIG.tiposAula.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    tipoSelect.appendChild(opt);
  });

  // Data mínima = hoje
  const dataInput = document.getElementById("data");
  dataInput.min = hojeISO();

  const instrutorSelect = document.getElementById("instrutor");
  const slotsContainer = document.getElementById("slotsContainer");
  const horarioHidden = document.getElementById("horarioEscolhido");

  let instrutoresCache = [];

  async function carregarInstrutores() {
    const categoria = catSelect.value;
    instrutorSelect.innerHTML = "<option value=''>Carregando...</option>";
    if (!categoria) {
      instrutorSelect.innerHTML = "<option value=''>Selecione a categoria primeiro</option>";
      return;
    }
    const snap = await db.collection("instrutores").where("ativo", "==", true).get();
    instrutoresCache = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((i) => (i.categorias || []).includes(categoria));

    if (instrutoresCache.length === 0) {
      instrutorSelect.innerHTML = "<option value=''>Nenhum instrutor disponível para essa categoria</option>";
      return;
    }
    instrutorSelect.innerHTML = "<option value=''>Selecione</option>" +
      instrutoresCache.map((i) => `<option value="${i.id}">${i.nome}</option>`).join("");
  }

  async function carregarHorarios() {
    const instrutorId = instrutorSelect.value;
    const data = dataInput.value;
    horarioHidden.value = "";
    if (!instrutorId || !data) {
      slotsContainer.innerHTML = "<p class='form-help'>Selecione instrutor e data para ver os horários livres.</p>";
      return;
    }
    slotsContainer.innerHTML = "<p class='form-help'>Carregando horários...</p>";

    const instrutor = instrutoresCache.find((i) => i.id === instrutorId);
    const diaSemana = DIAS_SEMANA[new Date(data + "T00:00:00").getDay()];
    const disponibilidade = (instrutor.disponibilidade && instrutor.disponibilidade[diaSemana]) || [];

    if (disponibilidade.length === 0) {
      slotsContainer.innerHTML = "<p class='form-help'>Este instrutor não atende neste dia da semana.</p>";
      return;
    }

    // Busca agendamentos deste instrutor nesta data e filtra o status no navegador
    // (evita depender de índice composto para a combinação com "in").
    let ocupados;
    try {
      const ocupadosSnap = await db.collection("agendamentos")
        .where("instrutorId", "==", instrutorId)
        .where("data", "==", data)
        .get();
      ocupados = new Set(
        ocupadosSnap.docs
          .map((d) => d.data())
          .filter((a) => a.status === "confirmado" || a.status === "concluido")
          .map((a) => a.horario)
      );
    } catch (err) {
      slotsContainer.innerHTML = `<p class='form-help' style="color:var(--color-danger);">Não foi possível verificar os horários (${err.code || err.message}). Tente novamente em instantes.</p>`;
      return;
    }

    slotsContainer.innerHTML = "";
    disponibilidade.forEach((h) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      btn.textContent = h;
      if (ocupados.has(h)) {
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".slot-btn").forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          horarioHidden.value = h;
        });
      }
      slotsContainer.appendChild(btn);
    });
  }

  catSelect.addEventListener("change", carregarInstrutores);
  instrutorSelect.addEventListener("change", carregarHorarios);
  dataInput.addEventListener("change", carregarHorarios);

  document.getElementById("agendamentoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("agendamentoMsg");
    const horario = horarioHidden.value;

    if (!horario) {
      msg.className = "form-msg show error";
      msg.textContent = "Selecione um horário disponível antes de confirmar.";
      return;
    }

    msg.className = "form-msg show";
    msg.textContent = "Confirmando agendamento...";

    const instrutorId = instrutorSelect.value;
    const instrutor = instrutoresCache.find((i) => i.id === instrutorId);
    const data = dataInput.value;

    try {
      // Checagem final anti-conflito (dupla checagem contra corrida de agendamento)
      const conflitoSnap = await db.collection("agendamentos")
        .where("instrutorId", "==", instrutorId)
        .where("data", "==", data)
        .where("horario", "==", horario)
        .get();
      const conflito = conflitoSnap.docs.some((d) => {
        const s = d.data().status;
        return s === "confirmado" || s === "concluido";
      });
      if (conflito) {
        msg.className = "form-msg show error";
        msg.textContent = "Esse horário acabou de ser reservado por outra pessoa. Escolha outro.";
        await carregarHorarios();
        return;
      }

      await db.collection("agendamentos").add({
        alunoNome: document.getElementById("nome").value.trim(),
        alunoCpf: document.getElementById("cpf").value.trim(),
        alunoTelefone: document.getElementById("telefone").value.trim(),
        alunoEmail: document.getElementById("email").value.trim(),
        categoria: catSelect.value,
        tipoAula: tipoSelect.value,
        instrutorId,
        instrutorNome: instrutor.nome,
        veiculoId: instrutor.veiculoId || null,
        data,
        horario,
        status: "confirmado",
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      });

      msg.className = "form-msg show success";
      msg.textContent = "Aula agendada com sucesso! Você será redirecionado ao WhatsApp para confirmar.";

      const texto = `Olá! Confirmo meu agendamento na Rota Certa:\nAluno: ${document.getElementById("nome").value.trim()}\nData: ${formatarDataBR(data)} às ${horario}\nInstrutor: ${instrutor.nome}\nTipo de aula: ${tipoSelect.value}`;
      setTimeout(() => {
        window.open(linkWhatsApp(SITE_CONFIG.contato.whatsapp, texto), "_blank");
      }, 1200);

      document.getElementById("agendamentoForm").reset();
      slotsContainer.innerHTML = "<p class='form-help'>Selecione instrutor e data para ver os horários livres.</p>";
    } catch (err) {
      msg.className = "form-msg show error";
      msg.textContent = "Não foi possível confirmar o agendamento. Tente novamente.";
      console.error(err);
    }
  });
});
