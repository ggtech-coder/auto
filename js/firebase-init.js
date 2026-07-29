// Inicialização do Firebase (SDK compat, carregado via <script> nas páginas)
// Usa apenas Auth + Firestore — compatível com o plano gratuito (Spark), sem Storage.
firebase.initializeApp(SITE_CONFIG.firebase);
const auth = firebase.auth();
const db = firebase.firestore();

// Helpers de data
function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
function formatarDataBR(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function formatarDataHoraBR(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("pt-BR");
}

// Helper de link do WhatsApp
function linkWhatsApp(numero, mensagem) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
