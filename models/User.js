let mongoose = require("mongoose"),
    bcrypt   = require("bcryptjs");

// User Schema
let UserSchema = mongoose.Schema({
    username: String,
    password: String,
    email: String,
    isAdmin: Boolean,
    progress: Array
});

let User = module.exports = mongoose.model("User", UserSchema);

module.exports.createUser = (newUser, callback)=>{
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
};

module.exports.getUserByUsername = (username, callback)=>{
    let query = { username: username };
    User.findOne(query, callback);
};

module.exports.comparePassword = (candidatePassword, hash, callback)=>{
    bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
        if(err) throw err;
        callback(null, isMatch);
    });
};

module.exports.getUserById = (id, callback)=>{
    User.findById(id, callback);
};
