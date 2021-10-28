require("dotenv").config();
const express = require("express");
const app = express();
const session = require("express-session");
const cors = require("cors");
const connection = require("./models");
const redis = require("./redis");

connection();
redis();

if (process.env.NODE_ENV === "production") console.log = function () {};
app.use(express.json());
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);
app.enable("trust proxy");
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use("/api", require("./controls/role"));
app.use("/api", require("./controls/user"));
app.use("/api", require("./controls/project"));
app.use("/api", require("./controls/sprint"));
app.use("/api", require("./controls/payments"));
app.use("/api", require("./controls/dyte"));
app.use("/api", require("./controls/reports"));

app.listen(process.env.PORT || 5000);

module.exports = app;
