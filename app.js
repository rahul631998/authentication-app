const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); 
app.set('view engine', 'ejs');

// const dbUsername = process.env.DB_USERNAME;
// const dbPassword = process.env.DB_PASSWORD;
// const url = "mongodb+srv://"+dbUsername+":"+dbPassword+"@cluster0.htya6dh.mongodb.net";
const url = "mongodb://127.0.0.1:27017"
const dbName = "userDB";

mongoose.connect(url+'/'+dbName);

const userSchema = {
    email: String,
    password: String
};

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