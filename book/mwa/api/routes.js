const Jimp = require("jimp");
const { ObjectId } = require("mongodb");
const multer = require("multer"),
  upload = multer(),
  debug = require("debug")("api"),
  eparser = require("exif-parser"),
  moment = require("moment"),
  { check, body, validationResult } = require("express-validator"),
  { matchedData } = require("express-validator"),
  express = require("express"),
  router = express.Router(),
  bcrypt = require("bcryptjs");

router.get("/openblogs", async (req, res) => {
  const blogs = await req.app
    .get("db")
    .collection("entries")
    .find({ publicEntry: true })
    .project({ pic: 0 })
    .sort({ date: -1 })
    .limit(5)
    .toArray();
  res.json(blogs);
});
router.get("/viewblog/:user", async (req, res) => {
  const user = req.params.user;
  const query = { publicEntry: true, user: user };
  const entries = await req.app
    .get("db")
    .collection("entries")
    .find(query)
    .sort({ date: -1 })
    .limit(10)
    .toArray();
  res.json(entries);
});
router.post(
  "/login",
  [body("password").not().isEmpty(), body("user").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.mapped() });
    }
    const user = req.body.user,
      pass = req.body.password;
    const response = await req.app
      .get("db")
      .collection("users")
      .findOne({ user: user });
    if (response && response.pass) {
      if (bcrypt.compareSync(pass, response.pass)) {
        req.session.user = user;
        res.json({ success: true });
      } else {
        return res.status(401).send({
          success: false,
          message: "login failed",
        });
      }
    } else {
      return res.status(401).send({
        success: false,
        message: "login failed",
      });
    }
  }
);
router.get("/session", (req, res) => {
  res.json({
    user: req.session.user || "",
  });
});
router.use((req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(403).send({
      success: false,
      message: "login required",
    });
  }
  next();
});
router.get("/entries", async (req, res) => {
  const entries = await req.app
    .get("db")
    .collection("entries")
    .find({ user: req.session.user }, { projection: { pic: 0 } })
    .sort({ date: -1 })
    .limit(10)
    .toArray();
  res.json(entries);
});
router.get("/entries/:date", [check("date").isISO8601()], async (req, res) => {
  const startDate = new Date(req.params.date),
    endDate = new Date(req.params.date);
  endDate.setMonth(endDate.getMonth() + 1);
  debug("D: ", startDate, endDate);
  const query = {
    user: req.session.user,
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  };
  debug("QUERY: ", query);
  const entries = await req.app
    .get("db")
    .collection("entries")
    .find(query, { projection: { pic: 0 } })
    .sort({ date: -1 })
    .limit(31)
    .toArray();
  res.json(entries);
});
router.post("/entry", upload.single("file"), (req, res) => {
  debug("Files uploaded: ", req.file);
  let origDate = new Date();
  if (req.file.mimetype === "image/jpeg") {
    const parser = eparser.create(req.file.buffer);
    const exif = parser.enableSimpleValues(false).parse();
    debug("EXIF is: ", exif);
    if (exif.tags && exif.tags.DateTimeOriginal) {
      origDate = moment(
        exif.tags.DateTimeOriginal,
        "YYYY:MM:DD HH:mm:ss"
      ).toDate();
    }
  }
  Jimp.read(req.file.buffer).then(function (image) {
    image
      .cover(200, 200)
      .getBuffer(req.file.mimetype, async function (err, buff) {
        let entry = {
          user: req.session.user,
          date: origDate || new Date(),
          pic: Buffer.from(req.file.buffer, "base64"),
          thumbnail: Buffer.from(buff, "base64"),
          mime: req.file.mimetype,
          size: req.file.size,
          publicEntry: false,
          filename: req.file.originalname,
        };
        const dbres = await req.app
          .get("db")
          .collection("entries")
          .insertOne(entry, { writeConcern: 1 });
        res.json({ _id: dbres.insertedId });
      });
  });
});
router.get("/entry/:id", async (req, res) => {
  const id = req.params.id;
  debug("trying to get entry ", id);
  const entry = await req.app
    .get("db")
    .collection("entries")
    .findOne({ _id: new ObjectId(id) }, { projection: { pic: 0 } });
  res.json(entry);
});
router.patch(
  "/entry/:id",
  [
    check("id").isMongoId(),
    check("date").isISO8601().optional(),
    check("title").isString().optional(),
    check("note").isString().optional(),
    check("publicEntry").isBoolean().optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.mapped() });
    }
    const body = matchedData(req, { locations: ["body"] });
    debug("BODY: ", req.body);
    if (body.date) {
      // important: make sure date are Date Objects
      body.date = new Date(body.date);
    }
    debug("matched BODY: ", body);
    const dbres = await req.app
      .get("db")
      .collection("entries")
      .updateOne(
        { _id: new ObjectId(req.params.id), user: req.session.user },
        { $set: body },
        { w: 1 }
      );

    res.json({ result: dbres });
  }
);
router.delete("/entry/:id", async (req, res) => {
  debug("delete for ", req.params.id);
  const entry = { _id: new ObjectId(req.params.id), user: req.session.user };
  const dbres = await req.app
    .get("db")
    .collection("entries")
    .deleteOne(entry, { w: 1 });
  res.json(dbres);
});
router.get("/entrypic/:id", async (req, res) => {
  const id = req.params.id;
  debug("trying to get entry ", id);
  const entry = await req.app
    .get("db")
    .collection("entries")
    .findOne(
      { _id: new ObjectId(id) },
      { projection: { pic: 1, title: 1, mime: 1 } }
    );
  res.json(entry);
});
router.get("/viewimage/:id", async (req, res) => {
  const id = req.params.id;
  const entry = await req.app
    .get("db")
    .collection("entries")
    .findOne({ _id: new ObjectId(id) }, { projection: { pic: 1, mime: 1 } });
  if (entry && entry.mime) {
    res.setHeader("content-type", entry.mime);
    res.setHeader("content-length", entry.pic.buffer.length);
    res.send(entry.pic.buffer);
  } else {
    res.send();
  }
});
router.post("/logout", (req, res) => {
  req.session.destroy(function () {
    res.json({ success: true });
  });
});

module.exports = router;
