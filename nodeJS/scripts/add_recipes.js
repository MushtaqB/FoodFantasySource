const jsonfile = require('jsonfile');
const models = require('../models/index');
const Recipe = models.recipes;
const errorsHandler = require('../utils/errorsHandler');


exports.seedRecipes = function (req, res) {
  const file = './all_recipes.js';
  const recipes = jsonfile.readFileSync(file);

  let promises = [];

  for (let i=0; i<recipes.length; ++i) {
    let recipe = recipes[i];

    // ignore duplicate recipe
    if (recipe.recipe_id == 126 && !recipe.subtitle_ar)
      recipe.recipe_id = 127;

    if (recipe.servings == 'شخصين') recipe.servings = 2;
    else recipe.servings = 4;

    recipe.cuisine_id = 1;

    recipe.steps_ar = JSON.stringify(recipe.steps_ar);
    recipe.steps_en = JSON.stringify(recipe.steps_en);
    recipe.ingredients_ar = JSON.stringify(recipe.ingredients_ar);
    recipe.ingredients_en = JSON.stringify(recipe.ingredients_en);

    recipe.preparation = recipe.prepertation;

    delete recipe.prepertation;
    delete recipe.created_at;
    delete recipe.updated_at;

    let p = Recipe.create(recipe);
    promises.push(p);
  }

  Promise.all(promises)
    .then((results) => {
      for (let i = 0; i < results.length; ++i) {
        let r = results[i];
        console.log(`Recipe ${r.recipe_id} has been created`);
      }

      res.status(200).send();
    })
    .catch((e) => {
      console.log(e);
      errorsHandler.handle(500, e, res);
    });

};

