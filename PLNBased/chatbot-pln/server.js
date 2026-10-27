const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const natural = require("natural");

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Normaliza o texto (minúsculas, sem acentos e sem pontuação)
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Classificador Bayesiano com Stemmer em Português
const classifier = new natural.BayesClassifier(natural.PorterStemmerPt);

// Exemplos de treinamento por intenção.
// Para adicionar uma nova intenção: inclua frases aqui, a resposta em "responses" e reinicie o servidor (re-treino automático).
const trainingData = {
  saudacao: [
    "oi", "ola", "bom dia", "boa tarde", "boa noite", "ola tudo bem",
    "oi tudo bem", "e ai", "ola preciso falar com voces"
  ],
  pedido_status: [
    "quero saber meu pedido", "meu pedido chegou", "acompanhar pedido", "status do pedido",
    "onde esta minha entrega", "rastrear entrega", "codigo de rastreio", "quando meu pedido chega",
    "meu pedido esta atrasado"
  ],
  agradecimento: [
    "obrigado", "muito obrigado", "valeu", "agradecido", "obrigada pela atencao",
    "obrigado pela ajuda", "valeu pela ajuda", "muito obrigada"
  ],
  preco: [
    "preco", "qual o preco", "quanto custa", "qual o valor do produto", "tabela de precos e valores",
    "quanto fica a assinatura", "orcamento e mensalidade", "qual o valor do plano", "quanto e o plano",
    "me passa os valores"
  ],
  ajuda: [
    "ajuda", "preciso de ajuda", "pode me ajudar", "me ajuda por favor", "estou com uma duvida no suporte",
    "socorro como funciona", "preciso de suporte tecnico", "nao estou conseguindo usar o sistema",
    "tenho um problema"
  ],
  cancelamento: [
    "cancelamento", "cancelar", "quero cancelar meu pedido", "cancelar meu pedido",
    "como faco o cancelamento da assinatura", "cancelar compra e pedir reembolso", "desistir da compra",
    "estornar pagamento", "quero encerrar minha conta", "quero meu dinheiro de volta"
  ],
  horario: [
    "qual o horario de funcionamento", "que horas voces abrem", "horario de atendimento",
    "ate que horas funciona", "voces abrem no sabado", "funciona aos domingos", "que horas fecha"
  ],
  localizacao: [
    "onde fica a loja", "qual o endereco", "como chegar ai", "onde voces ficam",
    "qual a localizacao", "endereco da loja fisica", "tem loja fisica",
    "como chegar ate voces", "como faco para chegar na loja", "como chego ai",
    "onde voces estao localizados", "qual o caminho ate a loja"
  ],
  despedida: [
    "tchau", "ate logo", "ate mais", "ate a proxima", "falou", "encerrar conversa", "adeus"
  ]
};

for (const [intent, phrases] of Object.entries(trainingData)) {
  for (const phrase of phrases) {
    classifier.addDocument(normalizeText(phrase), intent);
  }
}

classifier.train();

// Respostas completas e sugestões por intenção
const responses = {
  saudacao: {
    reply:
      "Olá! 👋 Seja bem-vindo(a) ao nosso atendimento inteligente.\n\n" +
      "Eu entendo o que você escreve e identifico sua intenção. Posso ajudar com:\n" +
      "• Status de pedidos\n• Preços e planos\n• Cancelamentos\n• Horário e localização\n• Dúvidas gerais\n\n" +
      "Como posso te ajudar hoje?",
    suggestions: ["Quanto custa?", "Onde está meu pedido?", "Preciso de ajuda", "Qual o horário de funcionamento?"]
  },
  pedido_status: {
    reply:
      "📦 Vamos acompanhar o seu pedido!\n\n" +
      "Para consultar, me informe o **número do pedido** ou o **e-mail** usado na compra.\n\n" +
      "Prazos de referência:\n" +
      "• Processamento: até 1 dia útil\n" +
      "• Entrega capitais: 2 a 5 dias úteis\n" +
      "• Entrega demais regiões: 5 a 10 dias úteis\n\n" +
      "Você também recebe o código de rastreio por e-mail assim que o pedido é despachado.",
    suggestions: ["Quero cancelar meu pedido", "Preciso de ajuda"]
  },
  agradecimento: {
    reply: "De nada! 😊 Foi um prazer ajudar. Se precisar de mais alguma coisa, é só me chamar. Estou sempre à disposição!",
    suggestions: ["Quanto custa?", "Qual o horário de funcionamento?"]
  },
  preco: {
    reply:
      "💰 Confira nossos valores:\n\n" +
      "🥉 **Básico** — R$ 29,90/mês (1 usuário, 10 GB, suporte por e-mail)\n" +
      "🥇 **Premium** — R$ 59,90/mês (até 5 usuários, 200 GB, suporte 24h)\n\n" +
      "🎁 No plano anual você ganha **20% de desconto** com o cupom **PROMO20**, e pagando via Pix tem mais 5% off.\n\n" +
      "Qual produto você gostaria de consultar?",
    suggestions: ["Preciso de ajuda", "Quero cancelar minha assinatura"]
  },
  ajuda: {
    reply:
      "🤝 Claro, estou aqui para ajudar!\n\n" +
      "Posso orientar você sobre:\n" +
      "• 📦 Status e rastreio de pedidos\n" +
      "• 💰 Preços e planos\n" +
      "• ❌ Cancelamentos e reembolsos\n" +
      "• 🕘 Horário e 📍 localização\n\n" +
      "Descreva sua dúvida com suas palavras. Se preferir falar com uma pessoa, ligue para (11) 4002-8922 ou escreva para suporte@empresa.com.br.",
    suggestions: ["Onde está meu pedido?", "Quanto custa?", "Quero cancelar"]
  },
  cancelamento: {
    reply:
      "❌ Entendi que você deseja cancelar. Veja como funciona:\n\n" +
      "• **Pedidos:** acesse **Meus Pedidos** e clique em **Cancelar** (disponível antes do envio).\n" +
      "• **Assinaturas:** em **Minha conta → Assinatura → Cancelar plano**; o acesso continua até o fim do período pago.\n" +
      "• **Reembolso:** integral em até **7 dias** após a compra, em até 10 dias úteis no mesmo meio de pagamento.\n\n" +
      "Se preferir, informe o código da compra aqui e encaminhamos o seu caso.",
    suggestions: ["Onde está meu pedido?", "Preciso de ajuda"]
  },
  horario: {
    reply:
      "🕘 Nosso horário de funcionamento:\n\n" +
      "• **Segunda a sexta:** 8h às 18h\n" +
      "• **Sábado:** 9h às 13h\n" +
      "• **Domingo e feriados:** fechado\n\n" +
      "💬 Este chat funciona 24 horas por dia. Fora do expediente, deixe sua mensagem e retornaremos no próximo dia útil.",
    suggestions: ["Onde fica a loja?", "Preciso de ajuda"]
  },
  localizacao: {
    reply:
      "📍 Estamos em:\n\n" +
      "**Av. Paulista, 1000 — Bela Vista, São Paulo/SP — CEP 01310-100**\n\n" +
      "🚇 A 200 m da estação Trianon-MASP (Linha 2 – Verde).\n" +
      "🚗 Estacionamento conveniado no prédio.\n" +
      "♿ Acessibilidade completa.",
    suggestions: ["Qual o horário de funcionamento?", "Preciso de ajuda"]
  },
  despedida: {
    reply: "Até logo! 👋 Obrigado pelo contato. Volte sempre que precisar!",
    suggestions: []
  }
};

const FALLBACK = {
  reply:
    "Desculpe, não consegui identificar o que você precisa. 🤔\n\n" +
    "Tente reformular com palavras como: **preço**, **pedido**, **cancelar**, **ajuda**, **horário** ou **endereço**.",
  suggestions: ["Quanto custa?", "Onde está meu pedido?", "Preciso de ajuda"]
};

// Abaixo desta confiança o bot considera que não entendeu
const MIN_CONFIDENCE = 0.25;

function classifyMessage(rawMessage) {
  const normalized = normalizeText(rawMessage);
  if (!normalized) {
    return { ...FALLBACK, intent: "desconhecida", confidence: 0, alternatives: [] };
  }

  const classifications = classifier.getClassifications(normalized);
  const total = classifications.reduce((sum, c) => sum + c.value, 0) || 1;
  const ranked = classifications.map((c) => ({ intent: c.label, confidence: c.value / total }));
  const top = ranked[0];

  const alternatives = ranked
    .slice(0, 3)
    .map((r) => ({ intent: r.intent, confidence: Number(r.confidence.toFixed(3)) }));

  if (!top || top.confidence < MIN_CONFIDENCE || !responses[top.intent]) {
    return { ...FALLBACK, intent: "desconhecida", confidence: Number((top ? top.confidence : 0).toFixed(3)), alternatives };
  }

  const { reply, suggestions } = responses[top.intent];
  return { reply, suggestions, intent: top.intent, confidence: Number(top.confidence.toFixed(3)), alternatives };
}

app.post("/chat", (req, res) => {
  const rawMessage = req.body && req.body.message ? String(req.body.message) : "";
  res.json(classifyMessage(rawMessage));
});

if (require.main === module) {
  app.listen(PORT, (err) => {
    if (err) {
      console.error(`Erro ao iniciar o servidor PLN na porta ${PORT}:`, err.message);
      process.exit(1);
    }
    console.log(`Chatbot PLN rodando em http://localhost:${PORT}`);
  });
}

module.exports = { app, classifyMessage };
