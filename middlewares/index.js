var User      = require("../models/User");

// all the middleware goes here
var middlewareObj = {};

// is logged in middleware
middlewareObj.isLoggedIn = function (req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in first!");
    res.location("/");
    return res.redirect("/users/login")
}

// is logged in middleware
middlewareObj.isAdmin = function (req, res, next) {
    if(req.isAuthenticated()){
        // check if the user is the is the admin
        // Here we've got only one admin => (Julien => with the _id of :5abc4394794475bfc8c1861f)
        if(req.user._id == "5abc4394794475bfc8c1861f"){
            return next();
        } else {
            req.flash("error", "You dont have the permission to do this... You need to be an administrator!");
            res.location("/");
            return res.redirect("/")
        }
    }
    req.flash("error", "You need to be logged in first!");
    res.location("/");
    return res.redirect("/users/login")
}



module.exports = middlewareObj;
