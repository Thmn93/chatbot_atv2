const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const natural = require("natural");

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Função auxiliar para normalizar texto (minúsculas e sem acentos)
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Classificador Bayesiano com Stemmer em Português
const classifier = new natural.BayesClassifier(natural.PorterStemmerPt);

const trainingData = [
  // Intenção: saudacao
  ["oi", "saudacao"],
  ["ola", "saudacao"],
  ["bom dia", "saudacao"],
  ["boa tarde", "saudacao"],
  ["boa noite", "saudacao"],
  ["ola tudo bem", "saudacao"],

  // Intenção: pedido_status
  ["quero saber meu pedido", "pedido_status"],
  ["meu pedido chegou", "pedido_status"],
  ["acompanhar pedido", "pedido_status"],
  ["status do pedido", "pedido_status"],
  ["onde esta minha entrega", "pedido_status"],
  ["rastrear entrega", "pedido_status"],

  // Intenção: agradecimento
  ["obrigado", "agradecimento"],
  ["muito obrigado", "agradecimento"],
  ["valeu", "agradecimento"],
  ["agradecido", "agradecimento"],
  ["obrigada pela atencao", "agradecimento"],

  // Nova intenção: preco
  ["preco", "preco"],
  ["qual o preco", "preco"],
  ["quanto custa", "preco"],
  ["qual o valor do produto", "preco"],
  ["tabela de precos e valores", "preco"],
  ["quanto fica a assinatura", "preco"],
  ["orcamento e mensalidade", "preco"],

  // Nova intenção: ajuda
  ["ajuda", "ajuda"],
  ["preciso de ajuda", "ajuda"],
  ["pode me ajudar", "ajuda"],
  ["me ajuda por favor", "ajuda"],
  ["estou com uma duvida no suporte", "ajuda"],
  ["socorro como funciona", "ajuda"],
  ["preciso de suporte tecnico", "ajuda"],

  // Nova intenção: cancelamento
  ["cancelamento", "cancelamento"],
  ["cancelar", "cancelamento"],
  ["quero cancelar meu pedido", "cancelamento"],
  ["cancelar meu pedido", "cancelamento"],
  ["como faco o cancelamento da assinatura", "cancelamento"],
  ["cancelar compra e pedir reembolso", "cancelamento"],
  ["desistir da compra", "cancelamento"],
  ["estornar pagamento", "cancelamento"]
];

for (const [phrase, intent] of trainingData) {
  classifier.addDocument(normalizeText(phrase), intent);
}

classifier.train();

function classifyMessage(rawMessage) {
  const normalized = normalizeText(rawMessage);
  const intent = classifier.classify(normalized);
  let reply = "Desculpe, não entendi.";

  switch (intent) {
    case "saudacao":
      reply = "Olá! Em que posso te ajudar hoje?";
      break;
    case "pedido_status":
      reply = "Para consultar seu pedido, informe o número ou e-mail da compra.";
      break;
    case "agradecimento":
      reply = "De nada! Estou sempre à disposição.";
      break;
    case "preco":
      reply = "Nossos planos começam a partir de R$ 29,90/mês. Qual produto você gostaria de consultar?";
      break;
    case "ajuda":
      reply = "Claro! Posso ajudar com status de pedidos, preços ou cancelamentos. Qual é a sua dúvida?";
      break;
    case "cancelamento":
      reply = "Para solicitar o cancelamento, acesse 'Meus Pedidos' no painel ou informe o código da compra por aqui.";
      break;
  }

  return { reply, intent };
}

app.post("/chat", (req, res) => {
  const rawMessage = req.body && req.body.message ? req.body.message : "";
  const result = classifyMessage(rawMessage);
  res.json(result);
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
