const express = require("express");
const venom = require("venom-bot");
const socketIO = require("socket.io");
const http = require("http");
const cors = require("cors");
const fs = require("fs");
const tokenFolder = fs.readdirSync("./tokens");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(cors());

const venomInstances = {};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

function sendMessage(client, number, message, res) {
  client
    .sendText(`${number}@c.us`, message)
    .then(() => res.sendStatus(200))
    .catch(() => res.status(500).send("Error sending message"));
}

async function createVenomInstance(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await venom.create(
        id,
        (base64Qrimg) => {
          io.emit("qrCode", { id, qrCode: base64Qrimg });
        },
        (status) => {
          venomInstances[id] = { ...venomInstances[id], status: status };

          if (venomInstances[id]) {
            io.emit("status", { id, status });
          }
        },
        {
          logQR: false,
          autoClose: false,
          disableWelcome: true,
        }
      );

      if (!venomInstances[id]) {
        venomInstances[id] = {};
      }

      venomInstances[id].client = client;

      resolve(client);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

app.post("/check-status", async (req, res) => {
  const { id } = req.body;

  if (!venomInstances[id]) {
    res.status(200).json({ status: "notFound" }).end();
    return;
  }

  res.status(200).json({ status: venomInstances[id].status }).end();
});

app.post("/create", async (req, res) => {
  const { id } = req.body;

  if (venomInstances[id] && tokenFolder.includes(id)) {
    res.status(202).json({ status: venomInstances[id].status }).end();
    return;
  }

  await createVenomInstance(id);
});

app.post("/send-message", async (req, res) => {
  const { id, number, message } = req.body;
  const client = venomInstances[id];

  if (!client) {
    await createVenomInstance(id, res);
    sendMessage(venomInstances[id], number, message, res);
  } else {
    sendMessage(client, number, message, res);
  }
});

app.post("/disconnect", async (req, res) => {
  const { id } = req.body;
  const client = venomInstances[id];

  if (!client) {
    res.status(400).send("Instance not found");
    return;
  }

  client
    .close()
    .then(() => {
      delete venomInstances[id];
      res.status(200).send("Instance disconnected");
    })
    .catch((error) => {
      res.status(500).send("Error disconnecting instance");
    });
});

const PORT = process.env.PORT || 3535;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
