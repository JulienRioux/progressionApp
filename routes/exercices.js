const express = require("express");
const router  = express.Router();

// add the models
const User     = require("../models/User");
const Exercice = require("../models/Exercice");
const Category = require("../models/Category");


// ===============================
//    Get the new exercice form
// ===============================

router.get("/:id/new", (req, res)=>{
  res.render("newExercice", { categoryID:req.params.id });
});


// ===============================
//       Post New Exercice
// ===============================

router.post("/:id/new", (req, res)=> {
  let question = req.body.question,
        answer = req.body.answer,
    categoryID = req.params.id;

  // Validation
  req.checkBody("question", "Question is required").notEmpty();
  req.checkBody("answer", "answer is required").notEmpty();
  var errors = req.validationErrors();
  // if errors, return the form
  if(errors){
      console.log(errors);
      res.render("newExercice", {
              errors: errors,
            question: question,
              answer: answer,
          categoryID: categoryID
      });
  } else {
    Category.findById(categoryID, (err, category)=>{
      if(err){
        throw err;
      } else {
        // find the length of the exercices of the same category to give the right order
        Exercice.find({category:category.title}, (err, CategoryExercices)=>{
          console.log(CategoryExercices);
          Exercice.find().exec(function (err, exercices) {
            var newExercice = new Exercice({
                question: question,
                  answer: answer,
                   order: CategoryExercices.length,
                category: category.title
            });
            Exercice.createExercice(newExercice, (err, exercice)=>{
                if(err) {
                  throw err
                } else {
                  console.log(exercice);
                  req.flash("success_msg", "You add a new exercice!");
                  res.redirect("/categories/" + categoryID);
                }
            });
          });
        });
      }
    });
  }
});


// ===============================
//     Get the exercice page
// ===============================

router.get("/:id", (req, res)=>{
  Exercice.findById(req.params.id, (err, exercice)=>{
    if(err){
      throw err;
    } else {
      console.log(exercice);
      Category.findOne({ title:exercice.category }, (err, category)=>{
        console.log("CATEGORY: ", category);
        if (err){
          throw err;
        } else {
          res.render("exercicePage", {
            exercice:exercice,
            category: category
          });
        }
      });
    }
  });
});


// ===============================
//  Check if the answer is right
// ===============================

router.post("/:id", (req, res)=>{

  let categoryID = req.params.id;
  let answer = req.body.answer;
  let currentUser = req.user;

  // Validation
  req.checkBody("answer", "answer is required").notEmpty();
  var errors = req.validationErrors();

  Exercice.findById(req.params.id, (err, exercice)=>{
    console.log(exercice);
    if(errors){
        console.log(errors);
        res.render("exercicePage", {
              errors: errors,
              exercice:exercice,
              answer: answer
        });
    } else if(exercice.answer == req.body.answer){
      // check if the user has already passed this exercice
      User.findById(req.body.userID, (err, user)=>{
        if(err){
          throw err;
        } else {
          Category.findOne({ title:exercice.category }, (err, foundCategory)=>{
            let currentCollection = foundCategory.title;

            if(user.progress[currentCollection].progression == exercice.order){

              // Set up a variable to be able to increment the progress for any collection
              let newCollectionProg = {};
              newCollectionProg["categoryID"] = foundCategory.id;
              newCollectionProg["progression"] = user.progress[currentCollection].progression + 1;

              // make a copy of the user progress object and add the new collection progress
              let beforeMod = user.progress;
              beforeMod[foundCategory.title] = newCollectionProg;

              // add the collection to the progress object
              User.findByIdAndUpdate({ _id:req.body.userID }, {progress: beforeMod}, {new:true}).exec();
              console.log("USER: ", user);
              if(err){
                throw err;
              } else {
                // check if it's the last exercice of the exercice collection
                Exercice.find({ category:foundCategory.title }, (err, AllExercices)=>{
                  console.log("***", user.progress[currentCollection].progression, AllExercices.length);
                  if(err){
                    throw err;
                  } else {
                    // print the category progression in %
                    let progressPrcnt = ((user.progress[currentCollection].progression) / AllExercices.length ) * 100;
                    console.log("=> Progression: " + progressPrcnt + "%");
                    // Check if it's the ;ast exercice of the category
                    if(user.progress[currentCollection].progression == AllExercices.length){
                      req.flash("success_msg", "You've passed it all!");
                      // LATER: Change the color of the category and redirect to all the category...
                    } else {
                      req.flash("success_msg", "You've got it!");
                    }
                    res.redirect("/categories/" + foundCategory.id);
                  }
                });
              };
            } else {
              req.flash("success_msg", "Once again, you've got it!");
              res.redirect("/categories/" + foundCategory.id);
            }
          });
        }
      });
    } else {
      // If the answer didn't match!
      req.flash("error_msg", "Try again!");
      res.redirect("/exercices/"+ req.params.id);
    };
  });
});


// ==============================
//       Delete exercices
// ==============================

router.delete("/:id", (req, res)=>{
  // find the exercice to delete
  Exercice.findById(req.params.id, (err, exercice)=>{
    if(err){
      throw err;
    } else {
      // save the exercice's category
      let exerciceCategory = exercice.category;
      // delete the exercice
      exercice.remove();
      // check if there is other exercices in the category
      // return an array of exercices sorted by their order
      Exercice.find({ category:exerciceCategory }).sort( {order: 1} ).exec((err, sortedExercices)=>{
        let numExercices = sortedExercices.length;

        if(numExercices == undefined || numExercices == 0){
          // do nothing if there is no other exercices in this category
        } else {
          // reorder the exercices to get an order from 0 to number of exercices in the category
          for(var i = 0; i < numExercices; i++){
            Exercice.update({ _id:sortedExercices[i]._id }, {$set: { order:i }}, (err, goodOrder)=>{
              if(err) {throw err};
            });
          }
        };
        // reset the progress of all the user to 0
        User.find({}, (err, userList)=> {
          userList.forEach((singleUser)=> {
            if(singleUser.progress[exercice.category] != undefined){
              // create an object that reset the category progress
              Category.findOne({ title:exercice.category }, (err, category)=>{
                console.log("====>", category._id);
                let resetProgress = {};
                resetProgress[exercice.category] = {
                  "categoryID": category._id,
  			          "progression": 0
                }
                User.update({ _id:singleUser._id }, {$set: {progress: resetProgress}}).exec();
              });
            }
          });
          Category.findOne({ title:exercice.category }, (err, category)=>{
            if(err){
              throw err;
            } else {
              res.redirect("/categories/" + category._id);
            }
          });
        });
      });
    }
  })






});




module.exports = router;
