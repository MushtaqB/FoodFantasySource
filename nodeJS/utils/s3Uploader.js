const Upload = require('s3-uploader');
const models = require('../models/index');
const User = models.users;
const configs = require('../config/app_config');
const async = require('async');
const fs = require('fs-extra');
const Recipes = models.recipes;

exports.uploadRecipeImages = (req, response, next) => {
  let userId = req.user.user.user_id;
  let recipeId = req.params.recipe_id;
  let files = req.files;

  console.log("=================== uploadRecipeImages", files);

  if (files && files.length > 0) {

    let file1 = files[0];
    let file2 = files[1];

    createUploadPromise(file1.path, recipeId + "/", configs.s3_recipe_configs)
      .then((result) => {
        console.log(`url ${result}, imagePath ${file1.path}`);
        return Recipes.update({image: result}, {
          where: {
            recipe_id: recipeId
          }
        })
      })
      .then(() => {
        console.log('Recipe image updated');
        return createUploadPromise(file2.path, recipeId + "/", configs.s3_ingredient_configs);
      })
      .then((result) => {
        console.log(`url ${result}, imagePath ${file2.path}`);
        return Recipes.update({ingredient_image: result}, {
          where: {
            recipe_id: recipeId
          }
        })
      })
      .then(() => {
        console.log('Recipe ingredient_image updated');
        console.log('finish uploading to S3');
        next();
      })
      .catch((e) => {
        console.log('failed to upload to S3: ' + e);
        next();
      });

  } else {
    next();
  }
};

exports.uploadAllStepsImages = (req, response, next) => {
  let userId = req.user.user.user_id;
  let recipeId = req.params.recipe_id;
  let files = req.files;

  console.log("=================== uploadStepImage", files);

  if (files && files.length > 0) {

    let s3_id = [];

    let promises = [];

    for (let i=0; i<files.length; ++i) {
      let file1 = files[i];
      let p = createUploadPromise(file1.path, recipeId + "/", configs.s3_step_configs);
      promises.push(p);
    }

    Promise.all(promises)
      .then((results) => {
        for (let i=0; i<results.length; ++i) {
          s3_id[i] = results[i];
          console.log(`url ${results[i]}, imagePath ${files[i].path}`);
        }

        return  Recipes.findOne({where: {recipe_id: recipeId}})
      })
      .then((recipe) => {
        let r = recipe.get({plain: true});
        let steps_ar = JSON.parse(r.steps_ar);
        let steps_en = JSON.parse(r.steps_en);

        for (let i=0; i<steps_ar.length; i++) {
          console.log(`Step ${i} from ${steps_ar.length}`);
          steps_ar[i].step_image = s3_id[i];
          steps_en[i].step_image = s3_id[i];
          console.log('step s3 id: ' + steps_ar[i].step_image);
        }

        return Recipes.update({steps_ar: JSON.stringify(steps_ar), steps_en: JSON.stringify(steps_en)}, {
          where: {
            recipe_id: recipeId
          }
        })
      })
      .then(() => {
        console.log('Recipe steps images updated');
        console.log('finish uploading to S3');
        next();
      })
      .catch((e) => {
        console.log('failed to upload to S3: ' + e);
        next();
      });

  } else {
    next();
  }
};

exports.uploadStepImage = (req, response, next) => {
  let userId = req.user.user.user_id;
  let recipeId = req.params.recipe_id;
  let step_id = req.params.step_id;
  let files = req.files;

  console.log("=================== uploadStepImage", files);

  if (files && files.length > 0) {

    let file1 = files[0];
    let s3_id = null;

    createUploadPromise(file1.path, recipeId + "/", configs.s3_step_configs)
      .then((result) => {
        s3_id = result;
        console.log(`url ${result}, imagePath ${file1.path}`);
        return  Recipes.findOne({where: {recipe_id: recipeId}})
      })
      .then((recipe) => {
        let r = recipe.get({plain: true});
        let steps_ar = JSON.parse(r.steps_ar);
        let steps_en = JSON.parse(r.steps_en);

        for (let i=0; i<steps_ar.length; i++) {
          console.log(`Step ${i} from ${steps_ar.length}`);
          let step = steps_ar[i];

          if (step.step_id == step_id) {  // == because compare '1' with 1
            steps_ar[i].step_image = s3_id;
            steps_en[i].step_image = s3_id;
            console.log('step s3 id: ' + steps_ar[i].step_image);
            break;
          }
        }

        return Recipes.update({steps_ar: JSON.stringify(steps_ar), steps_en: JSON.stringify(steps_en)}, {
          where: {
            recipe_id: recipeId
          }
        })
      })
      .then(() => {
        console.log('Recipe ingredient_image updated');
        console.log('finish uploading to S3');
        next();
      })
      .catch((e) => {
        console.log('failed to upload to S3: ' + e);
        next();
      });

  } else {
    next();
  }
};

exports.uploadAvatar = (req, res, next) => {
  console.log('uploadAvatar');

  let userId = req.user.user.user_id;
  let files = req.files;

  if (files.length > 0) {
    let avatar = files[0];

    createUploadPromise(avatar.path, configs.s3_users_bucket, configs.s3_avatar_options)
      .then((result) => {
        console.log(`url ${result}, imagePath ${avatar.path}`);
        return User.update({s3_id: result}, {
          where: {
            user_id: userId
          }
        })
      })
      .then(() => {
        console.log('avatar s3_id updated');
        next();
      })
      .catch((e) => {
        console.log(e);
        next();
      });
  } else {
    next();
  }
};

const createUploadPromise = (imagePath, destinationPath, mOptions) => {
  console.log("S3 upload image path ", imagePath);
  console.log("S3 destination image path ", destinationPath);

  const client = new Upload(configs.s3BucketName, mOptions);
  mOptions.aws.path = destinationPath;

  return new Promise((resolve, reject) => {
    client.upload(imagePath, {}, (err, versions, meta) => {
      if (err) {
        console.log("S3 upload error: ", err);
        deleteFile(imagePath);
        reject(err);
      } else {
        console.log("Versions", versions);
        console.log("Meta", meta);

        let s3Name = null;

        if (versions) {
          for (let i = 0; i < versions.length; ++i) {
            if (versions[i].original) {
              s3Name = versions[i].key.split('/').pop().replace(/\.[^/.]+$/, "");
              console.log('File URL: ' + versions[i].url);
              console.log("S3: ", s3Name);
              break;
            }
          }
        }

        console.log("S3 ID: ", s3Name);
        resolve(s3Name);
      }
    })
  });
};

const deleteFile = (imagePath) => {
  fs.remove(imagePath, (err) => {
    if (err) {
      console.log("Error on removing Image: ", err);
    } else {
      console.log("Image Deleted: ", imagePath);
    }
  });
};
