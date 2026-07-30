# Autoescola Rota Certa — Plataforma Web

Site institucional + sistema de agendamento + painel administrativo + área do aluno,
construído em **HTML/CSS/JS puro** (sem build step) com **Firebase (Auth + Firestore)**,
100% compatível com o **plano gratuito (Spark)** e hospedagem em **GitHub Pages**.

> Este é um projeto de demonstração ("Autoescola Rota Certa") com dados fictícios.
> Troque nome, contatos, imagens e configuração do Firebase antes de publicar.

---

## 1. Estrutura do projeto

```
/
├── index.html, sobre.html, servicos.html, contato.html   (site institucional)
├── agendamento.html                                       (agendamento público)
├── login.html                                             (login + cadastro de aluno)
├── privacidade.html, termos.html
├── config.js              ← DADOS DA EMPRESA (edite aqui: nome, telefone, endereço, Firebase)
├── firestore.rules         ← regras de segurança (cole no Firebase Console)
├── manifest.json, robots.txt, sitemap.xml
├── css/ (style.css, admin.css)
├── js/  (layout.js, main.js, firebase-init.js, auth.js, agendamento.js, aluno.js, admin-layout.js)
├── js/admin/ (dashboard.js, alunos.js, instrutores.js, veiculos.js, agendamentos.js, financeiro.js, relatorios.js, avisos.js)
├── admin/   (dashboard.html, alunos.html, instrutores.html, veiculos.html, agendamentos.html, financeiro.html, relatorios.html, avisos.html)
└── aluno/   (area.html)
```

---

## 2. Configurar o Firebase (gratuito)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto novo.
2. **Authentication** → Sign-in method → ative **E-mail/senha**.
3. **Firestore Database** → criar banco → modo produção → escolha a região `southamerica-east1` (São Paulo).
4. Em **Firestore → Regras**, apague o conteúdo padrão e cole o conteúdo do arquivo `firestore.rules` deste projeto. Clique em "Publicar".
5. Em **Configurações do projeto → Geral → Seus apps → Web (</>)**, registre um app e copie o objeto `firebaseConfig`.
6. Abra `config.js` e cole os valores dentro de `firebase: { ... }`.

Isso é tudo — não é necessário Cloud Functions, Storage nem plano pago (Blaze) para o funcionamento descrito abaixo.

---

## 3. Criar o primeiro usuário administrador

Por segurança, **não existe cadastro público de administrador** — apenas alunos podem se
autocadastrar pelo site. Para criar o primeiro admin:

1. No Firebase Console → **Authentication → Users → Add user**, crie um usuário com e-mail/senha (ex: `admin@rotacerta.com.br`).
2. Copie o **UID** gerado.
3. No **Firestore → Data**, crie manualmente uma coleção `users` com um documento cujo **ID seja esse UID**, contendo:
   ```json
   { "role": "admin", "nome": "Nome do Administrador", "email": "admin@rotacerta.com.br" }
   ```
4. Pronto — esse login agora acessa `admin/dashboard.html`. Repita para outros administradores.

> ⚠️ **Causa nº 1 do erro "permission-denied" em várias telas do painel:** o campo
> `role` tem que ser exatamente o texto `admin` (minúsculo, sem espaços, sem aspas
> extras) e o **ID do documento** em `users` tem que ser **idêntico ao UID** do
> usuário no Authentication (não o e-mail, não um ID aleatório). Depois de criar
> ou corrigir esse documento, se o painel continuar travado, faça logout e login
> de novo — o app lê esse perfil só no momento do login.
> Confira também se o conteúdo de `firestore.rules` deste projeto foi
> realmente **colado e publicado** em Firestore → Regras (edições salvas mas
> não publicadas não valem).

---

## 4. Popular dados iniciais (instrutores e veículos)

O agendamento online só mostra horários se houver **instrutores cadastrados com disponibilidade**.
Após logar como admin:

1. Vá em **Veículos** → cadastre ao menos 1 veículo por categoria que a autoescola atende.
2. Vá em **Instrutores** → cadastre cada instrutor, marque as categorias que ele leciona,
   vincule um veículo e preencha a **disponibilidade semanal** (um horário por linha, ex: `08:00`, `09:00`, `10:00`...).
3. Teste o agendamento público em `agendamento.html`.

---

## 5. Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex: `autoescola-rotacerta`) e envie todos os arquivos deste projeto para a branch `main`.
2. Em **Settings → Pages**, escolha a branch `main` e pasta raiz (`/`).
3. Seu site ficará em `https://SEU-USUARIO.github.io/autoescola-rotacerta/`.

### Domínio próprio (Registro.br)
1. Registre o domínio (ex: `rotacerta.com.br`) em [registro.br](https://registro.br).
2. No painel do domínio, aponte os registros DNS tipo `A` para os IPs do GitHub Pages:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. Crie um registro `CNAME` apontando `www` para `SEU-USUARIO.github.io`.
4. No repositório, crie um arquivo `CNAME` (sem extensão) na raiz contendo apenas `rotacerta.com.br`.
5. Em **Settings → Pages**, marque **Enforce HTTPS** assim que o certificado for emitido (pode levar até 24h).

### Google Search Console
1. Acesse [search.google.com/search-console](https://search.google.com/search-console).
2. Adicione a propriedade do domínio, verifique via DNS (TXT record) ou meta tag.
3. Envie o sitemap: `https://rotacerta.com.br/sitemap.xml`.

---

## 6. Integrações previstas (Google Analytics, Meta Pixel, Google Calendar)

Adicione os snippets oficiais dentro do `<head>` de cada página (ou apenas em `index.html`
para uma versão simplificada):
- **Google Analytics 4**: cole o script `gtag.js` fornecido pelo Google.
- **Meta Pixel**: cole o script padrão do Gerenciador de Eventos do Facebook.
- **Google Calendar**: pode ser adicionado futuramente sincronizando a coleção `agendamentos`
  via uma Cloud Function (exige plano Blaze) ou Zapier/Make.

---

## 7. Limitações do plano gratuito (importante)

Esta versão roda inteiramente no **plano Spark (gratuito)** do Firebase — sem servidor próprio.
Isso significa que alguns itens da especificação original **não enviam mensagens automáticas
de verdade** (WhatsApp/e-mail/SMS), pois isso exige um backend pago. O que foi implementado como alternativa:

| Necessidade | Solução implementada agora | Evolução futura recomendada |
|---|---|---|
| Confirmação de agendamento | Mensagem pronta + redirecionamento ao WhatsApp (`wa.me`) | Cloud Function + WhatsApp Business API (Blaze) |
| Lembretes de aula | Visível na área do aluno (próximas aulas) | Cloud Scheduler + Function enviando WhatsApp/e-mail |
| Avisos gerais | Mural de avisos na área do aluno (`admin/avisos.html`) | Notificação push (FCM) ou disparo em massa via API |
| Pagamentos (PIX, cartão, boleto) | Lançamento manual (`admin/financeiro.html`) | Integração com gateway (Mercado Pago, Stripe, PagSeguro) via Function |
| Exportação de relatórios | CSV e PDF gerados no navegador (jsPDF) | Relatórios agendados por e-mail via Function |

Todas essas evoluções exigem migrar para o **plano Blaze** (que ainda tem uma camada gratuita
generosa) e criar Cloud Functions — a estrutura de dados já está pronta para isso.

---

## 7.1 Índices compostos do Firestore

Algumas consultas combinam múltiplos filtros (ex: agendamentos por instrutor + data + status,
ou dashboard com data + status + ordenação). Na **primeira vez** que cada uma dessas consultas
rodar, o Firestore pode recusar a consulta e mostrar, no console do navegador (F12), um erro
com um **link direto para criar o índice automaticamente** — basta clicar no link, aguardar
alguns minutos e recarregar a página. Isso só acontece uma vez por consulta e é normal em
projetos Firestore com filtros combinados.

---

## 8. Segurança e LGPD

- Autenticação via Firebase Auth (senhas nunca ficam em texto puro — são gerenciadas pelo Google).
- Controle de permissões por perfil (`admin` / `aluno`) via `firestore.rules`.
- Alunos só enxergam e editam os próprios dados; instrutores e veículos são de leitura pública
  (necessário para o agendamento funcionar sem login) mas só administradores podem alterá-los.
- Banner de cookies/LGPD no site institucional (`js/main.js`) e página de Política de Privacidade.
- Recomenda-se ativar o **App Check** do Firebase (gratuito) para reduzir abuso do formulário
  público de agendamento por bots.
- Backups: no plano gratuito, exporte a coleção manualmente pelo Console (Firestore → Exportar)
  periodicamente, ou automatize com Cloud Scheduler + Storage no plano Blaze.

---

## 9. Solução de problemas ("painel não funciona / fica carregando")

Se o painel administrativo não deixava criar aluno/instrutor/veículo e os botões pareciam
travados, o motivo era uma combinação de duas coisas, já corrigidas nesta versão:

1. **As regras do Firestore (`firestore.rules`) precisam estar publicadas no Console.**
   Se o documento `users/{uid}` do seu admin não existir ou não tiver `role: "admin"`,
   toda operação de escrita falha silenciosamente. Agora, qualquer erro de permissão
   aparece em uma faixa vermelha no topo do painel, com a mensagem técnica exata.
2. As páginas do painel agora registram os botões **antes** de carregar os dados —
   então, mesmo que o carregamento falhe, os botões continuam clicáveis e mostram
   um alerta com o motivo do erro em vez de "travar".

**Se você já publicou este projeto antes**, é importante **republicar o arquivo
`firestore.rules`** atualizado no Console (Firestore → Regras → colar o conteúdo
novo → Publicar), pois a regra de leitura da coleção `agendamentos` foi ajustada
para permitir consulta pública de horários (necessária para a página de agendamento
funcionar sem login).

Se depois disso ainda aparecer erro, copie a mensagem técnica exibida na faixa vermelha
(ou no console do navegador, F12) — ela aponta exatamente qual passo do setup falta.

**Atualização de segurança (regras endurecidas):** as regras foram ajustadas para que
**somente o admin** possa listar/editar/excluir alunos, usuários, instrutores, veículos,
agendamentos e pagamentos. Um aluno logado só consegue ler o **próprio** cadastro (nunca
uma lista de todos os alunos) — e é exatamente uma consulta desse tipo (buscar aluno
pré-cadastrado por CPF, varrendo a coleção inteira) que o Firestore sempre bloqueava com
`permission-denied` durante o autocadastro. Essa busca foi removida de `js/auth.js`: agora
o autocadastro sempre cria um registro novo em "alunos". Se um aluno já tinha sido
pré-cadastrado pela administração (mesmo CPF) e depois se autocadastrou, vai existir um
registro duplicado — basta o admin excluir o antigo (ou copiar os dados) pela tela
**Alunos** do painel.

---

## 11. Personalização

Todos os textos, cores e dados de contato ficam centralizados em **`config.js`** e no arquivo
**`css/style.css`** (variáveis `:root`). Não é necessário editar cada página HTML individualmente
para trocar telefone, WhatsApp, endereço ou redes sociais — edite apenas `config.js`.

As imagens atuais são placeholders do Unsplash — substitua por fotos reais da autoescola
(fachada, frota, equipe, alunos em aula) antes de publicar.
