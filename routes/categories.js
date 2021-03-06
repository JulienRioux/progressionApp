const express = require("express");
const router  = express.Router();

// add the models
const User     = require("../models/User");
const Exercice = require("../models/Exercice");
const Category = require("../models/Category");

// include the middlewares
const middlewareObj = require("../middlewares");


// ===============================
//        Show categories
// ===============================

router.get("/", middlewareObj.isLoggedIn, (req, res)=>{

	// find the number of exercices per category
  Category.find({}, (err, categories) =>{
		if(err) throw err;
		Exercice.find({}, (err, exercices)=>{
			if(err) throw err;
			let categoryInfo = {};
			categories.forEach((foundCategory)=> {
				let numExercices = exercices.filter((exercice)=> exercice.category == foundCategory.title).length;
				// find the user progress for every category
				let userProgress = req.user.progress[foundCategory.title].progression;
				categoryInfo[foundCategory.title] = {
					numExercices: numExercices,
					userProgress: userProgress
				};
			});
			console.log(categoryInfo);
			res.render("showCategories", {
				categories: categories,
				categoryInfo: categoryInfo
			});
		})
		// categories.forEach((category)=> {
		//
		// });
  });
});



// ===============================
//       New category route
// ===============================

router.get("/new", middlewareObj.isLoggedIn, (req, res)=>{
  res.render("newCategories");
});


// ===============================
//       Post New Category
// ===============================

router.post("/new", middlewareObj.isLoggedIn, (req, res)=> {
  let title = req.body.title;

  // Validation
  req.checkBody("title", "Title is required").notEmpty();
  var errors = req.validationErrors();

  if(errors){
      res.render("newCategories", {
            errors: errors,
             title: title
      });
  } else {
      Category.find().exec(function (err, categories) {
        var newCategory = new Category({
            title: title,
        exercices: {},
            order: categories.length
        });
        Category.createCategory(newCategory, (err, category)=>{
            if(err) {
              throw err
            } else {
              req.flash("success_msg", "You add a new category!");
              res.redirect("/categories/" + category.id);
            }
        });
      });
  }
});


// ===============================
//    Show categories exercices
// ===============================

router.get("/:id", middlewareObj.isLoggedIn, (req, res)=>{

  let currentUser = req.user;
  // Check if the user has progress in that category, otherwise, set the catefory progress to 0
  Category.findById(req.params.id, (err, category) => {

    let currentCollection = category.id;

    if(currentUser.progress[category.title] === undefined){

      // create the new category progress object
      let newCollectionProg = {};
      newCollectionProg["categoryID"] = category.id;
      newCollectionProg["progression"] = 0;

      User.findById(currentUser.id, (err, userBeforMod)=>{
        let beforeMod = userBeforMod.progress;
        beforeMod[category.title] = newCollectionProg;
        // add the new category to the progress object => EXEC() it !
        User.findByIdAndUpdate({_id: currentUser._id}, {progress: beforeMod}).exec();
        console.log("PROGRESSION: ", currentUser);

        Exercice.find({ category:category.title }, (err, exercices) =>{
          res.render("showExercices", {
            exercices: exercices,
            category: category,
         progression: 0
          });
        });
      });
    } else {
      Exercice.find({ category:category.title }, (err, exercices) =>{
        res.render("showExercices", {
          exercices: exercices,
          category: category,
       progression: currentUser.progress[category.title].progression
        });
      });
    }
  });
});

// ===============================
//        Delete category
// ===============================

// dont forget to delete all the user progress too!

router.delete("/:id", middlewareObj.isLoggedIn, (req, res)=>{
  console.log("DELETING!!!");
  // first check if there is exercices in the category
  Category.findById(req.params.id, (err, category)=>{
    if(err){
      throw err;
    } else {
      // if they are exercices, ask to the user to delete them first
      // otherwise, if the category have no exercices, delete the category
      Exercice.find({ category:category.title }, (err, exercices)=>{
        console.log(exercices);
        if(exercices.length > 0){
          req.flash("error_msg", "You need to delete all the exercices from the " + category.title + " category first!");
          res.redirect("/categories/" + req.params.id);
        } else {
          // delete the category
          console.log("REMOVING CATEGORY");
          category.remove((err, isRemoved) => {
            if(err) {
              throw err;
            } else {
              req.flash("success_msg", "The Category has been removed!")
              res.redirect("/categories");
            }
          });
        }
      });
    }
  });
});


module.exports = router;
