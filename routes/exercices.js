const express = require("express");
const router  = express.Router();

const Exercice = require("../models/Exercice");
const User    = require("../models/User");


// ===============================
//        Show exercices
// ===============================

router.get("/", (req, res, next)=>{
  // check if the user have the collection progression in his progression array
  let currentUser = req.user;

  // change the value of the currentCollection to the real collection that you want to add later!
  let currentCollection = "introToJavaScript";

  console.log(currentUser.progress);

  // if(currentUser.progress.find(x => x.collection === currentCollection))

  console.log("currentUser.progress[currentCollection] => ",currentUser.progress[currentCollection]);

  if(currentUser.progress[currentCollection] === undefined){

    let newCollectionProg = {};
    newCollectionProg[currentCollection] = 0;

    console.log("newCollectionProg", newCollectionProg);

    // add the collection to the progress object
    User.findByIdAndUpdate({_id: currentUser._id}, {$set: { progress: newCollectionProg}}, {new: true}, (err, user)=> {
      if(err) {
        throw err;
      }
      console.log("user: ", user);
    });
    next();
  } else {
    next();
  }
}, (req, res)=>{
  Exercice.find({}, (err, exercices) =>{
    res.render("showExercices", {exercices: exercices});
  });
});

// ===============================
//    Get the new exercice form
// ===============================

router.get("/new", (req, res)=>{
  res.render("newExercice");
});


// ===============================
//       Post New Exercice
// ===============================

router.post("/new", (req, res)=> {
  console.log(req.body);
  let question = req.body.question,
        answer = req.body.answer;

  // Validation
  req.checkBody("question", "Question is required").notEmpty();
  req.checkBody("answer", "answer is required").notEmpty();
  var errors = req.validationErrors();

  if(errors){
      console.log(errors);
      res.render("newExercice", {
            errors: errors,
          question: question,
            answer: answer
      });
  } else {
      Exercice.find().exec(function (err, exercices) {
        var newExercice = new Exercice({
            question: question,
            answer: answer,
            order: exercices.length
        });
        Exercice.createExercice(newExercice, (err, exercice)=>{
            if(err) {
              throw err
            } else {
              console.log(exercice);
              req.flash("success_msg", "You add a new exercice!");
              res.redirect("/exercices");
              // res.render("showExercices", {exercices: exercices});
            }
        });

      });
  }
});


// ===============================
//     Get the exercice page
// ===============================

router.get("/:id", (req, res)=>{
  Exercice.findById(req.params.id, (err, exercice)=>{
    res.render("exercicePage", {exercice:exercice});
  });
});



// ===============================
//  Check if the answer is right
// ===============================

router.post("/:id", (req, res)=>{

  let answer = req.body.answer;

  let currentUser = req.user;
  // change the value of the currentCollection to the real collection that you want to add later!
  let currentCollection = "introToJavaScript";

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
          // change the value of the currentCollection to the real collection that you want to add later!
          let currentCollection = "introToJavaScript";
          if(user.progress[currentCollection] == exercice.order){
            // Set up a variable to be able to increment the progress for any collection
            let collectionString = "progress." + currentCollection;
            let incrementCollectionObj = {};
            incrementCollectionObj[collectionString] = 1;
            // increment his progress if not already passed this exercice
            User.findByIdAndUpdate(req.body.userID, {$inc: incrementCollectionObj}, (err, user)=>{
              if(err){
                throw err;
              } else {
                // check if it's the last exercice of the exercice collection
                Exercice.find({}, (err, AllExercices)=>{
                  if(err){
                    throw err;
                  } else {
                    // print the progression in %
                    let progressPrcnt = ((user.progress[currentCollection]+1) / AllExercices.length ) * 100;
                    console.log("=> Progression: " + progressPrcnt + "%");
                    if(user.progress[currentCollection]== AllExercices.length-1){
                      req.flash("success_msg", "You've passed it all!");
                    } else {
                      req.flash("success_msg", "You've got it!");
                    }
                    res.redirect("/exercices");
                  }
                });
              }
            });
          } else {
            req.flash("success_msg", "Once again, you've got it!");
            res.redirect("/exercices");
          }
        }
      });
    } else {
      // If the answer didn't match!
      req.flash("error_msg", "Try again!");
      res.redirect("/exercices/"+ req.params.id);
    };
  });
});




module.exports = router;
