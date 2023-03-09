const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcodeTerminal = require("qrcode-terminal");

const app = express();
var cors = require("cors");

app.use(express.json());
app.use(cors()); // Use this after the variable declaration

const clients = {};

function removeNonAlphaNumeric(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

app.post("/create", (req, res) => {
  const id = removeNonAlphaNumeric(req.body.id);
  if (clients[id]) {
    if (clients[id].qrcode) {
      res.json({ qrcode: clients[id].qrcode }).status(200).end();
    }
  } else {
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: id }),
    });

    console.log(`\n Iniciando o cliente: "${id}"`);

    clients[id] = client;
    clients[id].isReady = false;

    clients[id].on("qr", (qrcode) => {
      console.log(`\nQRCode recebido com sucesso para o cliente: "${id}"`);

      qrcodeTerminal.generate(qrcode, { small: true });

      clients[id].qrcode = qrcode;

      res.json({ qrcode: qrcode }).status(200).end();
    });

    clients[id].on("ready", () => {
      clients[id].isReady = true;
      res.status(200).end();
    });

    clients[id].initialize();
  }
});

app.post("/send-message", async (req, res) => {
  const id = removeNonAlphaNumeric(req.body.id);
  const number = req.body.number;
  const message = req.body.message;

  const chatId = number + "@c.us";

  if (!clients[id] || clients[id].isReady === false) {
    res.status(404).end();
    return;
  }

  try {
    await clients[id].sendMessage(chatId, message);
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.emit("error").status(404).end();
  }
});

app.listen(3001, () => {
  console.log("Servidor iniciado na porta 3001");
});
