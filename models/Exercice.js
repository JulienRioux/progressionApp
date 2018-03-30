let mongoose = require("mongoose");


// User Schema
let ExerciceSchema = mongoose.Schema({
  question: String,
  answer: String,
  order: Number
});

let Exercice = module.exports = mongoose.model("Exercice", ExerciceSchema);

// create a new exercice
module.exports.createExercice = (newExercice, callback)=>{
  newExercice.save(callback);
};
