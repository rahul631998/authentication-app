require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const encrypt = require("mongoose-encryption")
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); 
app.set('view engine', 'ejs');

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const url = process.env.DB_URL || "127.0.0.1:27017";
const dbName = process.env.DB_NAME;

mongoose.connect(url+'/'+dbName);

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

const secret = process.env.SECRET;

userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save()
        .then(() => {
            res.render("secrets")
        })
        .catch((err) => {
            res.send(err);
        });
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username})
        .then((foundUser) => {
            if (foundUser.password === password) {
                res.render("secrets")
            } else {
                res.redirect("/");
            }
        })
        .catch((err) => {
            res.send(err);
        });
});

app.listen(3000, ()=> {
    console.log("Server started on port 3000");
});