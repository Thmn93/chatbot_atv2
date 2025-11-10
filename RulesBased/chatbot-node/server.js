const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/chat", (req, res) => {
  const message = req.body.message.toLowerCase();
  let response = "Desculpe, não entendi sua pergunta.";

  if (message.includes("login")) {
    response = "Você pode redefinir sua senha clicando em 'Esqueci minha senha'.";
  } else if (message.includes("plano")) {
    response = "Temos planos Básico e Premium. Qual você gostaria de saber mais?";
  } else if (message.includes("atendente")) {
    response = "Ok! Encaminhando você para um atendente.";
  }

  res.json({ reply: response });
});

app.listen(3000, () => console.log("Chatbot rodando na porta 3000"));
