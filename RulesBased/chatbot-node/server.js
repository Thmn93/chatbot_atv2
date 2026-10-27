const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Função auxiliar para remover acentos e facilitar a comparação das regras
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getRuleResponse(rawMessage) {
  const message = normalizeText(rawMessage);
  let response = "Desculpe, não entendi sua pergunta. Tente perguntar sobre login, planos, horário, localização, promoções ou atendente.";

  if (message.includes("oi") || message.includes("ola") || message.includes("bom dia") || message.includes("boa tarde") || message.includes("boa noite")) {
    response = "Olá! Como posso ajudar? Você pode tirar dúvidas sobre login, planos, horário, localização ou promoções.";
  } else if (message.includes("login") || message.includes("senha") || message.includes("acesso")) {
    response = "Você pode redefinir sua senha clicando em 'Esqueci minha senha'.";
  } else if (message.includes("plano") || message.includes("assinatura")) {
    response = "Temos planos Básico e Premium. Qual você gostaria de saber mais?";
  } else if (message.includes("atendente") || message.includes("humano") || message.includes("suporte")) {
    response = "Ok! Encaminhando você para um atendente.";
  } else if (
    message.includes("horario") ||
    message.includes("funcionamento") ||
    message.includes("abre") ||
    message.includes("fecha") ||
    message.includes("atendimento") ||
    message.includes("horas")
  ) {
    response = "Nosso horário de funcionamento é de segunda a sexta, das 8h às 18h, e aos sábados das 9h às 13h.";
  } else if (
    message.includes("localizacao") ||
    message.includes("endereco") ||
    message.includes("onde fica") ||
    message.includes("local") ||
    message.includes("loja")
  ) {
    response = "Estamos localizados na Av. Paulista, 1000 - São Paulo/SP.";
  } else if (
    message.includes("promocao") ||
    message.includes("promocoes") ||
    message.includes("desconto") ||
    message.includes("oferta") ||
    message.includes("cupom")
  ) {
    response = "Estamos com 20% de desconto no plano anual usando o cupom PROMO20!";
  }

  return response;
}

app.post("/chat", (req, res) => {
  const rawMessage = req.body && req.body.message ? req.body.message : "";
  const reply = getRuleResponse(rawMessage);
  res.json({ reply });
});

if (require.main === module) {
  app.listen(PORT, (err) => {
    if (err) {
      console.error(`Erro ao iniciar o servidor na porta ${PORT}:`, err.message);
      process.exit(1);
    }
    console.log(`Chatbot Baseado em Regras rodando em http://localhost:${PORT}`);
  });
}

module.exports = { app, getRuleResponse };
