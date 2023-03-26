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

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
    googleId: String,
    secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// not required as not using mongoose-encryption
//const secret = process.env.SECRET;
//userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL:
                "http://+localhost:8080/auth/google/authentication-app",
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        },
        function (accessToken, refreshToken, profile, cb) {
            console.log(profile);
            User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    )
);

app.get("/", (req, res) => {
    res.render("home");
});

app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get(
    "/auth/google/authentication-app",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/");
    }
);

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    User.find({"secret": {$ne: null}})
    .then((foundUsers) => {
        res.render("secrets", {usersWithSecrets: foundUsers})
    });
});

app.get("/logout", (req, res) => {
    req.logout(() => {
        console.log("logged out");
    });
    res.redirect("/");
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;

    User.findById(req.user.id).then((foundUser) => {
        if (foundUser) {
            foundUser.secret = submittedSecret;
            foundUser.save();
            res.redirect("/secrets");
        }
    });
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
