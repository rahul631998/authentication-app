require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");

// will use md5 hashing instead of encryption
//const encrypt = require("mongoose-encryption")

// will use bcrypt hashing instead of md5
//const md5 = require("md5");

// will use passport
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
    session({
        secret: "this is the secret",
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const url = process.env.DB_URL || "127.0.0.1:27017";
const dbName = process.env.DB_NAME;

mongoose.connect(url + "/" + dbName);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);

// not required as not using mongoose-encryption
//const secret = process.env.SECRET;
//userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout(() => {
        console.log("logged out");
    });
    res.redirect("/");
});

app.post("/register", (req, res) => {
    /*
    bcrypt.hash(req.body.password, saltRounds).then((hash) => {
        const newUser = new User({
            email: req.body.username,
            password: hash,
        });

        newUser
            .save()
            .then(() => {
                res.render("secrets");
            })
            .catch((err) => {
                res.send(err);
            });
    });
    */
    User.register({ username: req.body.username }, req.body.password).then(
        (user) => {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    );
});

app.post("/login", (req, res) => {
    /*
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username })
        .then((foundUser) => {
            bcrypt.compare(password, foundUser.password).then((result) => {
                if (result === true) {
                    res.render("secrets");
                } else {
                    res.redirect("/");
                }
            });
        })
        .catch((err) => {
            res.send(err);
        });
        */
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Server started on", port);
});
