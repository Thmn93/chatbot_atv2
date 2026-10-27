const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Remove acentos e coloca em minúsculas para facilitar a comparação das regras
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Cada regra possui: tópico, padrões (regex sobre o texto normalizado), resposta e sugestões.
// Os padrões usam \b (início de palavra) para evitar falsos positivos (ex.: "oi" dentro de "noite").
// A ordem importa: a primeira regra que combinar vence.
const rules = [
  {
    topic: "Atendente",
    patterns: [/\batendente/, /\bhumano/, /\bpessoa de verdade/, /falar com (alguem|uma pessoa)/],
    reply:
      "Claro! Estou encaminhando você para um atendente.\n\n" +
      "⏱️ Tempo médio de espera: 3 minutos.\n" +
      "🕘 Atendimento humano: seg a sex, 8h às 18h, e sáb, 9h às 13h.\n" +
      "📞 Se preferir, ligue para (11) 4002-8922 ou escreva para suporte@empresa.com.br.",
    suggestions: ["Horário de funcionamento", "Onde fica a loja?"]
  },
  {
    topic: "Login e senha",
    patterns: [/\blogin/, /\bsenha/, /\bacesso/, /\bentrar na (conta|minha conta)/, /\bnao consigo entrar/],
    reply:
      "Problemas para acessar a conta? Veja como resolver:\n\n" +
      "1️⃣ Na tela de login, clique em **Esqueci minha senha**.\n" +
      "2️⃣ Informe o e-mail cadastrado e abra o link que enviaremos.\n" +
      "3️⃣ Crie uma nova senha com no mínimo 8 caracteres, com letras e números.\n\n" +
      "💡 Não recebeu o e-mail? Confira a caixa de spam. Se persistir, digite **atendente**.",
    suggestions: ["Falar com atendente", "Quais são os planos?"]
  },
  {
    topic: "Cancelamento",
    patterns: [/\bcancel/, /\breembolso/, /\bestorno/, /\bdevolu[cç]/, /\bdesisti/],
    reply:
      "Sentimos muito em ver você partir. Veja como cancelar:\n\n" +
      "• Acesse **Minha conta → Assinatura → Cancelar plano**.\n" +
      "• Você mantém o acesso até o fim do período já pago.\n" +
      "• Reembolso integral em até **7 dias** após a contratação (direito de arrependimento).\n\n" +
      "Se quiser, posso conectar você a um atendente para ajudar. Digite **atendente**.",
    suggestions: ["Falar com atendente", "Ver promoções"]
  },
  {
    topic: "Pagamento",
    patterns: [/\bpagamento/, /\bpagar/, /\bboleto/, /\bcartao/, /\bpix/, /\bparcela/, /\bfatura/, /\bnota fiscal/],
    reply:
      "Aceitamos as seguintes formas de pagamento:\n\n" +
      "💳 Cartão de crédito em até **12x** sem juros (Visa, Mastercard, Elo).\n" +
      "⚡ Pix com **5% de desconto** e aprovação imediata.\n" +
      "🧾 Boleto bancário (compensação em até 2 dias úteis).\n\n" +
      "A fatura e a nota fiscal ficam disponíveis em **Minha conta → Financeiro**.",
    suggestions: ["Ver promoções", "Quais são os planos?"]
  },
  {
    topic: "Planos",
    patterns: [/\bplano/, /\bassinatura/, /\bpreco/, /\bvalor/, /\bquanto custa/, /\bmensalidade/],
    reply:
      "Temos dois planos pensados para você:\n\n" +
      "🥉 **Básico** — R$ 29,90/mês\n" +
      "   • 1 usuário • 10 GB de armazenamento • suporte por e-mail\n\n" +
      "🥇 **Premium** — R$ 59,90/mês\n" +
      "   • até 5 usuários • 200 GB • suporte prioritário 24h • relatórios avançados\n\n" +
      "Qual deles você gostaria de conhecer melhor? Também há descontos no plano anual!",
    suggestions: ["Ver promoções", "Formas de pagamento"]
  },
  {
    topic: "Promoções",
    patterns: [/\bpromo/, /\bdesconto/, /\boferta/, /\bcupom/, /\bbarato/, /\bliquidacao/],
    reply:
      "🔥 Promoções em andamento:\n\n" +
      "• **20% de desconto** no plano anual com o cupom **PROMO20**.\n" +
      "• **Primeiro mês grátis** para novos clientes no plano Premium.\n" +
      "• **5% extra** pagando via Pix.\n\n" +
      "As ofertas são válidas até o fim do mês e não são cumulativas com outros cupons.",
    suggestions: ["Quais são os planos?", "Formas de pagamento"]
  },
  {
    topic: "Horário",
    patterns: [/\bhorario/, /\bfuncionamento/, /\bque horas/, /\babre\b/, /\bfecha\b/, /\baberto/, /\batendimento/],
    reply:
      "🕘 Nosso horário de funcionamento:\n\n" +
      "• **Segunda a sexta:** 8h às 18h\n" +
      "• **Sábado:** 9h às 13h\n" +
      "• **Domingo e feriados:** fechado\n\n" +
      "💬 Este chat virtual funciona **24 horas por dia**. Fora do expediente, deixe sua dúvida e retornaremos no próximo dia útil.",
    suggestions: ["Onde fica a loja?", "Falar com atendente"]
  },
  {
    topic: "Localização",
    patterns: [/\blocaliza/, /\bendereco/, /\bonde fica/, /\bonde (voces )?(estao|ficam)/, /\bcomo chegar/, /\bloja/, /\bmapa/],
    reply:
      "📍 Nossa loja fica em:\n\n" +
      "**Av. Paulista, 1000 — Bela Vista, São Paulo/SP — CEP 01310-100**\n\n" +
      "🚇 Metrô: a 200 m da estação Trianon-MASP (Linha 2 – Verde).\n" +
      "🚗 Estacionamento conveniado no próprio prédio.\n" +
      "♿ Acessibilidade completa para cadeirantes.",
    suggestions: ["Horário de funcionamento", "Falar com atendente"]
  },
  {
    topic: "Agradecimento",
    patterns: [/\bobrigad/, /\bvaleu/, /\bagradec/],
    reply: "De nada! 😊 Foi um prazer ajudar. Se surgir qualquer outra dúvida, é só chamar!",
    suggestions: ["Quais são os planos?", "Ver promoções"]
  },
  {
    topic: "Despedida",
    patterns: [/\btchau/, /\baté logo/, /\bate logo/, /\bate mais/, /\bate breve/, /\bfalou\b/, /\bate a proxima/],
    reply: "Até logo! 👋 Obrigado pelo contato. Volte sempre que precisar.",
    suggestions: []
  },
  {
    topic: "Saudação",
    patterns: [/\boi\b/, /\bola\b/, /\bbom dia/, /\bboa tarde/, /\bboa noite/, /\be ai\b/, /\bhello/, /\bhey\b/],
    reply:
      "Olá! 👋 Seja bem-vindo(a) ao nosso atendimento virtual.\n\n" +
      "Posso ajudar com:\n" +
      "• Login e senha\n" +
      "• Planos e preços\n" +
      "• Promoções e pagamento\n" +
      "• Horário e localização\n" +
      "• Cancelamentos\n\n" +
      "Sobre o que você gostaria de falar?",
    suggestions: ["Quais são os planos?", "Ver promoções", "Horário de funcionamento", "Esqueci minha senha"]
  }
];

const fallback = {
  topic: "Não entendi",
  reply:
    "Desculpe, não entendi sua pergunta. 🤔\n\n" +
    "Tente perguntar sobre: **login**, **planos**, **promoções**, **pagamento**, **horário**, **localização**, **cancelamento** ou digite **atendente** para falar com uma pessoa.",
  suggestions: ["Quais são os planos?", "Esqueci minha senha", "Falar com atendente"]
};

function getRule(rawMessage) {
  const message = normalizeText(rawMessage);
  const rule = rules.find((r) => r.patterns.some((p) => p.test(message)));
  return rule || fallback;
}

// Mantido por compatibilidade: devolve apenas o texto da resposta
function getRuleResponse(rawMessage) {
  return getRule(rawMessage).reply;
}

app.post("/chat", (req, res) => {
  const rawMessage = req.body && req.body.message ? String(req.body.message) : "";
  const { reply, topic, suggestions } = getRule(rawMessage);
  res.json({ reply, topic, suggestions });
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

module.exports = { app, getRule, getRuleResponse };
