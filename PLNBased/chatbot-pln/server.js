const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const natural = require("natural");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Classificador Bayesiano
const classifier = new natural.BayesClassifier();

// Treinamento básico
classifier.addDocument("oi", "saudacao");
classifier.addDocument("olá", "saudacao");
classifier.addDocument("bom dia", "saudacao");

classifier.addDocument("quero saber meu pedido", "pedido_status");
classifier.addDocument("meu pedido chegou", "pedido_status");
classifier.addDocument("acompanhar pedido", "pedido_status");

classifier.addDocument("obrigado", "agradecimento");
classifier.addDocument("valeu", "agradecimento");

classifier.train();

app.post("/chat", (req, res) => {
  const { message } = req.body;
  const intent = classifier.classify(message.toLowerCase());
  let reply = "Desculpe, não entendi.";

  switch (intent) {
    case "saudacao":
      reply = "Olá! Em que posso te ajudar hoje?";
      break;
    case "pedido_status":
      reply = "Para consultar seu pedido, informe o número ou e-mail da compra.";
      break;
    case "agradecimento":
      reply = "De nada! Estou sempre à disposição";
      break;
  }

  res.json({ reply, intent });
});

app.listen(3000, () => console.log("Chatbot PLN rodando na porta 3000"));
