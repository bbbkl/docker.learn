// Datei: mwa/api/server.js
const express = require("express"),
  cors = require("cors"),
  debug = require("debug")("api"),
  session = require("express-session"),
  redis = require("redis"),
  routes = require("./routes"),
  app = express();
const RedisStore = require("connect-redis").default;
const { MongoClient } = require("mongodb");

const port = process.env.PORT || 3000;
const mongourl = process.env.MONGO_URL || "mongodb://mongo:27017";
const secretsalt =
  process.env.SECRETSALT || "waitie0rah5ievooyeij8Ceez0quohcah6xe8aenoo";
const redisClient = redis.createClient({
  url: "redis://redis",
});
redisClient.connect().catch(console.error);
let mongoConnected = false;

app.use(
  cors({
    origin: "https://diary.dockerbuch.info",
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    store: new RedisStore({
      client: redisClient,
    }),
    saveUninitialized: false,
    secret: secretsalt,
    resave: false,
  })
);
app.get("/health", (req, res) => {
  debug("health-check von ", req.ip);
  res.json({ healthy: true });
});
app.use("/", routes);
connect();
app.listen(port, () => {
  console.log("API-Server auf Port ", port);
});

setTimeout(function () {
  if (!mongoConnected) {
    connect();
  }
}, 15000);

async function connect() {
  console.log("Verbinde mit MongoDB: ", mongourl);
  const client = new MongoClient(mongourl);
  await client.connect();
  console.log("connection established");
  const diary = client.db("diary");
  mongoConnected = true;
  app.set("db", diary);
}
