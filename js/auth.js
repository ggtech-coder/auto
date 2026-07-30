// ============================================================
// AUTENTICAÇÃO — login, criação de conta de aluno, guarda de rotas
// ============================================================

function limparCpf(cpf) {
  return (cpf || "").replace(/\D/g, "");
}

async function redirecionarPorPerfil(uid) {
  const userDoc = await db.collection("users").doc(uid).get();
  if (userDoc.exists && userDoc.data().role === "admin") {
    window.location.href = "admin/dashboard.html";
  } else {
    window.location.href = "aluno/area.html";
  }
}

// ---------- Página de login (login.html) ----------
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const erro = params.get("erro");
  if (erro) {
    const box = document.createElement("div");
    box.className = "form-msg show error";
    box.style.maxWidth = "440px";
    box.style.margin = "0 auto 1.2rem";
    if (erro === "sem-perfil") {
      box.textContent = "Sua conta existe no Firebase, mas não tem um perfil configurado no Firestore (coleção \"users\"). Veja o README, seção 3, para criar o administrador corretamente.";
    } else if (erro === "perfil-incorreto") {
      const esperado = params.get("esperado");
      box.textContent = esperado === "admin"
        ? "Essa conta não tem permissão de administrador. Entre com uma conta de aluno na aba \"Entrar\", ou cadastre o admin conforme o README."
        : "Essa conta é de administrador — use o painel administrativo, não a área do aluno.";
    }
    document.querySelector(".auth-wrap")?.prepend(box);
  }

  const tabs = document.querySelectorAll(".tabs button");
  if (tabs.length) {
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".auth-panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
      });
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("loginMsg");
      const email = document.getElementById("loginEmail").value.trim();
      const senha = document.getElementById("loginSenha").value;
      msg.className = "form-msg show";
      msg.textContent = "Entrando...";
      try {
        const cred = await auth.signInWithEmailAndPassword(email, senha);
        msg.className = "form-msg show success";
        msg.textContent = "Login realizado! Redirecionando...";
        await redirecionarPorPerfil(cred.user.uid);
      } catch (err) {
        msg.className = "form-msg show error";
        msg.textContent = traduzErroFirebase(err.code);
      }
    });
  }

  const esqueci = document.getElementById("esqueciSenha");
  if (esqueci) {
    esqueci.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const msg = document.getElementById("loginMsg");
      if (!email) {
        msg.className = "form-msg show error";
        msg.textContent = "Digite seu e-mail no campo acima e clique novamente.";
        return;
      }
      try {
        await auth.sendPasswordResetEmail(email);
        msg.className = "form-msg show success";
        msg.textContent = "Enviamos um e-mail para redefinição de senha.";
      } catch (err) {
        msg.className = "form-msg show error";
        msg.textContent = traduzErroFirebase(err.code);
      }
    });
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("signupMsg");
      const nome = document.getElementById("suNome").value.trim();
      const cpf = limparCpf(document.getElementById("suCpf").value);
      const email = document.getElementById("suEmail").value.trim();
      const senha = document.getElementById("suSenha").value;

      msg.className = "form-msg show";
      msg.textContent = "Criando sua conta...";

      try {
        const cred = await auth.createUserWithEmailAndPassword(email, senha);
        const uid = cred.user.uid;

        // Procura aluno pré-cadastrado (pela administração) com o mesmo CPF
        const existente = await db.collection("alunos").where("cpf", "==", cpf).limit(1).get();
        let alunoId;
        if (!existente.empty) {
          alunoId = existente.docs[0].id;
          await db.collection("alunos").doc(alunoId).update({ uid, email });
        } else {
          const novo = await db.collection("alunos").add({
            nome, cpf, email, telefone: "", rg: "", dataNascimento: "",
            endereco: "", categoria: "", situacao: "pendente",
            uid, criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          });
          alunoId = novo.id;
        }

        await db.collection("users").doc(uid).set({
          role: "aluno", nome, email, alunoId,
          criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        });

        msg.className = "form-msg show success";
        msg.textContent = "Conta criada! Redirecionando...";
        window.location.href = "aluno/area.html";
      } catch (err) {
        msg.className = "form-msg show error";
        msg.textContent = traduzErroFirebase(err.code);
      }
    });
  }
});

function traduzErroFirebase(code) {
  const mapa = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado. Tente entrar.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
  };
  return mapa[code] || "Ocorreu um erro. Tente novamente.";
}

// ---------- Guarda de rotas (usada em admin/*.html e aluno/*.html) ----------
// Uso: chamar exigirLogin("admin") ou exigirLogin("aluno") no topo da página.
// IMPORTANTE: nunca redireciona entre admin/* e aluno/* diretamente — isso causava
// um loop infinito (ficava "carregando" para sempre) quando o usuário logado não
// tinha o perfil esperado. Agora sempre volta para login.html com uma mensagem clara.
function exigirLogin(perfilEsperado) {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "../login.html";
        return;
      }
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const dados = userDoc.exists ? userDoc.data() : null;

        if (!dados) {
          // Login existe no Firebase Auth, mas não há documento em "users/{uid}".
          // Isso normalmente significa que o admin não foi cadastrado corretamente
          // no Firestore (ver README, seção 3). Não redireciona sozinho — evita loop.
          await auth.signOut();
          window.location.href = "../login.html?erro=sem-perfil";
          return;
        }
        if (dados.role !== perfilEsperado) {
          await auth.signOut();
          window.location.href = `../login.html?erro=perfil-incorreto&esperado=${perfilEsperado}`;
          return;
        }
        resolve({ user, dados });
      } catch (err) {
        console.error("Erro ao verificar perfil do usuário:", err);
        exibirErroFatal("Não foi possível verificar seu perfil de acesso. Verifique se as regras do Firestore foram publicadas corretamente (ver README) e tente novamente. Detalhe técnico: " + (err.message || err.code || err));
        reject(err);
      }
    });
  });
}

// Mostra um erro fatal visível na tela (em vez de deixar a página "carregando" para sempre)
function exibirErroFatal(mensagem) {
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;top:0;left:0;right:0;background:#C4432B;color:#fff;padding:1rem 1.5rem;z-index:9999;font-family:sans-serif;font-size:0.9rem;line-height:1.5;";
  box.innerHTML = `<strong>Erro ao carregar o painel:</strong> ${mensagem}`;
  document.body.prepend(box);
}

function logout() {
  auth.signOut().then(() => (window.location.href = "../login.html"));
}
