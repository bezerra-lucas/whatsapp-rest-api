const express = require("express");
const venom = require("venom-bot");
const socketIO = require("socket.io");
const http = require("http");
const cors = require("cors");

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
      const client = await venom.create({
        session: id,
        catchQR: (base64Qrimg) => {
          io.emit("qrCode", { id, qrCode: base64Qrimg });
        },
        statusFind: (status) => {
          if (status === "successChat") {
            io.emit("status", { id, status });
          }
        },
      });

      resolve(client);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

app.post("/create", async (req, res) => {
  const { id } = req.body;

  if (venomInstances[id]) {
    res.status(202).json({ status: "successChat" }).end();
    return;
  }

  const client = await createVenomInstance(id, res);
  venomInstances[id] = client;
});

app.post("/send-message", async (req, res) => {
  const { id, number, message } = req.body;
  const client = venomInstances[id];

  if (!client) {
    const newClient = await createVenomInstance(id, res);
    venomInstances[id] = newClient;
    sendMessage(newClient, number, message, res);
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
