let mongoose = require("mongoose");


// Category Schema
let CategorySchema = mongoose.Schema({
  title: String,
  order: Number
}, { minimize: false });

let Category = module.exports = mongoose.model("Category", CategorySchema);

// create a new exercice
module.exports.createCategory = (newCategory, callback)=>{
  newCategory.save(callback);
};
