// ============================================================
// CONFIGURAÇÃO CENTRAL — DADOS DA AUTOESCOLA
// Troque os valores abaixo pelos dados reais do cliente.
// Este arquivo é a ÚNICA fonte de verdade para nome, contato,
// endereço, redes sociais e textos institucionais do site.
// ============================================================

const SITE_CONFIG = {
  empresa: {
    nome: "Autoescola Rota Certa",
    nomeCurto: "Rota Certa",
    slogan: "Sua habilitação com quem entende o caminho.",
    fundacao: "2011",
    cnpj: "00.000.000/0001-00",
    razaoSocial: "Rota Certa Centro de Formação de Condutores Ltda.",
  },

  contato: {
    telefone: "(11) 4321-9090",
    telefoneLink: "+551143219090",
    whatsapp: "5511987654321",
    whatsappMensagemPadrao: "Olá! Vim pelo site e gostaria de saber mais sobre a Autoescola Rota Certa.",
    email: "contato@rotacerta.com.br",
    horario: "Segunda a sexta, 8h às 19h · Sábado, 8h às 13h",
  },

  endereco: {
    logradouro: "Av. das Nações, 1245",
    bairro: "Centro",
    cidade: "Vargem Grande Paulista",
    estado: "SP",
    cep: "06730-000",
    completo: "Av. das Nações, 1245 — Centro, Vargem Grande Paulista/SP — CEP 06730-000",
    mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0!2d-47.008!3d-23.626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDM3JzMzLjYiUyA0N8KwMDAnMjguOSJX!5e0!3m2!1spt-BR!2sbr!4v0",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av.+das+Na%C3%A7%C3%B5es+1245+Vargem+Grande+Paulista+SP",
  },

  redesSociais: {
    instagram: "https://instagram.com/rotacerta.autoescola",
    facebook: "https://facebook.com/rotacerta.autoescola",
    youtube: "https://youtube.com/@rotacerta.autoescola",
    tiktok: "https://tiktok.com/@rotacerta.autoescola",
  },

  seo: {
    tituloBase: "Autoescola Rota Certa — CNH em Vargem Grande Paulista/SP",
    descricaoBase: "Autoescola Rota Certa: primeira habilitação, adição e mudança de categoria, renovação, reciclagem e aulas para habilitados em Vargem Grande Paulista/SP. Agende sua aula online.",
    palavrasChave: "autoescola, CNH, habilitação, primeira habilitação, carteira de motorista, aulas de direção, Vargem Grande Paulista, autoescola SP, renovação CNH, reciclagem CNH",
    urlBase: "https://rotacerta.com.br",
    imagemCompartilhamento: "/assets/images/og-image.jpg",
  },

  firebase: {
    apiKey: "AIzaSyDx6iKpiYnFvFwfCqyaS9qnXjvyLd7bxBc",
    authDomain: "escola-auto.firebaseapp.com",
    projectId: "escola-auto",
    storageBucket: "escola-auto.firebasestorage.app",
    messagingSenderId: "816036692518",
    appId: "1:816036692518:web:206d7310d37c7d8f079ce7",
  },

  categorias: ["A", "B", "AB", "C", "D", "E"],

  tiposAula: [
    "Aula teórica",
    "Aula prática — carro",
    "Aula prática — moto",
    "Aula de baliza",
    "Aula noturna",
    "Simulado de exame",
  ],

  estatisticas: {
    alunosFormados: "12.000+",
    anosDeMercado: "13",
    taxaAprovacao: "94%",
    instrutores: "18",
  },
};

// Evita erro caso o arquivo seja carregado em ambiente sem module system
if (typeof module !== "undefined" && module.exports) {
  module.exports = SITE_CONFIG;
}
