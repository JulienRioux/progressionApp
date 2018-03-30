const express = require("express");
const router  = express.Router();
const passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy;

const User    = require("../models/User");


// GET Login page
router.get("/login", (req, res)=>{
    res.render("login");
});

// GET Signup page
router.get("/register", (req, res)=>{
    res.render("register");
});

// Register user
router.post("/users/register", (req, res)=>{
    res.render("register");
});

// Post New User
router.post("/register", (req, res)=>{
    let username = req.body.username,
           email = req.body.email,
        password = req.body.password,
        password2 = req.body.password2;

    // Validation
    req.checkBody("username", "Name is required").notEmpty();
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("email", "Email is not valid").isEmail();
    req.checkBody("password", "Password is required").notEmpty();
    req.checkBody("password2", "Password is not valid").equals(req.body.password)

    var errors = req.validationErrors();

    if(errors){
        res.render("register", {
            errors: errors,
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            password2: req.body.password2
        });
    } else {
        var newUser = new User({
            username: username,
            email: email,
            password: password,
            isAdmin: false,
            progress: 0
        });

        User.createUser(newUser, (err, user)=>{
            if(err) throw err;
            console.log(user);
        });
        req.flash("success_msg", "You are register, now let's login!");

        res.render("login", { username:username });
    }
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.getUserByUsername(username, (err, user)=>{
            if(err) throw err;
            if(!user){
                return done(null, false, {message: "Unknown user"});
            }
            User.comparePassword(password, user.password, (err, isMatch)=>{
                if(err) throw err;
                if(isMatch){
                    return done(null, user);
                } else {
                    return done(null, false, {message: "Invalid password"});
                }
            });
        });
    }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// Post Login User
router.post('/login',
    passport.authenticate('local', {
        successRedirect: "/",
        failureRedirect: "/users/login",
        failureFlash: true
    }),
    function(req, res) {
        res.redirect("/");
    }
);

// GET Logout user
router.get('/logout', function(req, res){
    req.logout();
    req.flash("success_msg", "See you soon!");
    res.redirect('/users/login');
});


module.exports = router;
