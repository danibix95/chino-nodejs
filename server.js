const Chino = require("chino-sdk");

const baseUrl = "https://api.test.chino.io/v1";
const customerId  = process.env.CHINO_ID;  // insert here your Chino Customer ID
const customerKey = process.env.CHINO_KEY; // insert here your Chino Customer KEY

const chino = new Chino(baseUrl, customerId, customerKey);

// application data
const appData = {
  name : "Application for example",
  grant_type: "password"
}

let appId = "", appSecret = "";

// create a Chino application
chino.applications.create(appData)
     .then((app) => {
        appId = app.app_id;
        appSecret = app.app_secret;
     });
    // if any error is raised, then we don't manage it,
    // so app will terminate

chino.setAuth(appId, appSecret);

// set constant ID
const repositoryID = process.env.REP_ID;
const physicianID = process.env.PHY_ID;
const patientID = process.env.PAT_ID;
const recipeID = process.env.REC_ID;

module.exports.physician = 
  function (request, response) {
    let data = { patients : [], message : ""}

    const auth = basicAuth(process.env.CHINO_ID, process.env.CHINO_KEY);
    
    User.info(request.cookies["bearer"])
      .then((success) => {
        let patients = success.data.user.attributes.patients;

        // wait for every call
        Promise.all(patients.map((patId) =>
          Call.JSON(`/users/${patId}`, "GET", {}, auth))
        )
        .then((values) => {
          values.forEach((pat) => {
            data.patients.push({
              "id" : pat.data.user.user_id,
              "username" : pat.data.user.username
            });
          });
          response.render("physician", data);
        })
        .catch((error) => {
          console.log(`Error on one promise: ${error}`);
          data.message = "Error retrieving patients";
          response.render("physician", data);
        });
      })
      .catch((error) => {
        console.log(`Error: ${error}`);
        data.message = "Wrong bearer";
        response.render("physician", data);
      });
  };

module.exports.patient = 
  function (request, response) {
    let data = { recipes : [] };

    const auth = basicAuth(process.env.CHINO_ID, process.env.CHINO_KEY);

    User.info(request.cookies["bearer"])
      .then((result) => {
        let recipesCollection = result.data.user.attributes.recipes;
        // console.log(recipesCollection);
        
        // get all recipe of the patient
        Call.JSON(`/collections/${recipesCollection}/documents`, "GET", {}, auth)
          .then((result) => {
            // console.log(result);
            if (result.result_code === HttpStatus.OK) {
              
              // get documents id of patient recipes
              let documentsId = result.data.documents.map((doc) => doc.document_id);
              // console.log(documentsId);

              // get all documents
              Promise.all(documentsId.map((docId) =>
                Call.JSON(`/documents/${docId}`, "GET", {}, `Bearer ${request.cookies["bearer"]}`))
              )
              .then((values) => {
                values.forEach((doc) => {
                  if (doc.result_code === HttpStatus.OK) {
                    data.recipes.push({
                      "physician" : doc.data.document.content.physician_id,
                      "visit_date" : doc.data.document.content.visit_date,
                      "document_id" : doc.data.document.document_id,
                      "observation" : doc.data.document.content.observation,
                    });
                  }
                  else {
                    console.log(doc);
                  }
                });
                response.render("patient", data);
              })
              .catch((error) => {
                console.log(`Error: ${error}`);
                response.render("patient", data);
              })
            }
          })
          .catch((error) => {
            console.log(`Error: ${error}`);
            response.render("patient", data);
          });
      })
      .catch((error) => {
        console.log(`Error: ${error}`);
        response.render("patient", data);
      })
  };

module.exports.addRecipe =
  function (request, response) {
    const auth = basicAuth(process.env.CHINO_ID, process.env.CHINO_KEY);

    if (request.body["recipe"] && request.body["recipe"] !== "") {
      User.info(request.cookies["bearer"])
        .then((success) => {
          let physician = success.data.user.user_id;

          let written_recipes = success.data.user.attributes.written_recipes;

          let recipe = {
            content : {
              "physician_id": physician,
              "visit_date": request.body["visit-date"],
              "patient_id": request.body["patient"],
              "observation": request.body["recipe"]
            }
          }

          // get patient recipes collection and insert recipe also into it
          Call.JSON(`/users/${request.body["patient"]}`, "GET", {}, auth)
            .then((result) => {
              if (result.result_code = HttpStatus.OK) {
                let recipeCollection = result.data.user.attributes.recipes;
                
                // insert a new document (recipe)
                Call.JSON(`/schemas/${recipeID}/documents`, "POST", recipe, `Bearer ${request.cookies["bearer"]}`)
                  .then((result) => {
                    if (result.result_code = HttpStatus.OK) {
                      let docId = result.data.document.document_id;

                      // insert document into patient recipe collections
                      Call.JSON(`/collections/${recipeCollection}/documents/${docId}`, "POST", {}, `Bearer ${request.cookies["bearer"]}`)
                        .then((result) => {
                          // Check if current collection isn't managed by physician.
                          // Add it if necesserary
                          if (!written_recipes.includes(recipeCollection)) {
                            written_recipes.push(recipeCollection);
                            let update = {
                              attributes : {
                                "written_recipes" : written_recipes
                              }
                            };
                            // update physician info
                            Call.JSON(`/users/${physician}`, "PATCH", update, auth)
                              .then((result) => {
                                // log the action
                              })
                              .catch((error) => {
                                console.log(`Error: ${error}`);
                                response.redirect("/physician");
                              });

                          }
                          // give patient permission to read that document
                          let perms = { manage : ["R"] }
                          Call.JSON(`/perms/grant/documents/${docId}/users/${request.body["patient"]}`, "POST", perms, `Bearer ${request.cookies["bearer"]}`)
                            .then((result) => {
                              // log the action
                              if (result.result_code !== HttpStatus.OK)
                                console.log("It was not possible to assign permissions");
                            })
                            .catch((error) => {
                              console.log(`Error: ${error}`);
                              response.redirect("/physician");
                            });
                        })
                        .catch((error) => {
                          console.log(`Error: ${error}`);
                          response.redirect("/physician");
                        });
                    }
                    // let action run asyncronously and show the page to user
                    response.redirect("/physician");
                  })
                  .catch((error) => {
                    console.log(`Error: ${error}`);
                    response.redirect("/physician");
                  });
              }
              else {
                response.redirect("/physician");
              }
            })
            .catch((error) => {
              console.log(`Error: ${error}`);
              response.redirect("/physician");
            });
        })
        .catch((error) => {
          console.log(`Error: ${error}`);
          response.redirect("/physician");
        });
    }
    else {
      response.redirect("/");
    }
  };

module.exports.requireLogin =
  function (request, response, next) {
    if (!request.cookies["bearer"]) {
      // No token is present, so go to login page
      response.redirect('/');
    }
    else {
      next();
    }
  };

/* TODO: below could be some code duplication */
module.exports.isPhysician =
  function (request, response, next) {
    User.info(request.cookies["bearer"])
      .then((result) => {
        if (result.result_code === HttpStatus.OK) {
          if (result.data.user.schema_id === physicianID) {
            next();
          }
          // if it isn't a physician require to login
          else {
            response.redirect('/');
          }
        }
        // given a different code means
        else {
          response.redirect('/');
        }
      })
      .catch((error) => {
        console.log(`Error: ${error}`);
        response.redirect('/');
      });
  };

module.exports.isPatient =
  function (request, response, next) {
    User.info(request.cookies["bearer"])
      .then((result) => {
        if (result.result_code === HttpStatus.OK) {
          if (result.data.user.schema_id === patientID) {
            next();
          }
          // if it isn't a physician require to login
          else {
            response.redirect('/');
          }
        }
        // given a different code means
        else {
          response.redirect('/');
        }
      })
      .catch((error) => {
        console.log(`Error: ${error}`);
        response.redirect('/');
      });
  };
/* ----------------------- */

module.exports.login =
  function (request, response) {
    if (request.body["username"] && request.body["password"]) {
      let settings = {
        "grant_type" : "password",
        "username" : request.body["username"],
        "password" : request.body["password"]
      }

      const auth = basicAuth(process.env.APP_ID, process.env.APP_KEY);
      
      Call.formData("/auth/token", "POST", settings, auth)
        .then((result) => {
          if (result.result_code === HttpStatus.OK) {
            let bearer = result.data.access_token;

            // set cookie to let user to access (expires after 10 minutes)
            response.cookie(
              "bearer",
              bearer,
              {
                expires  : new Date(Date.now() + result.data.expires_in*10),
                httpOnly : true,
                sameSite : true
              }
            );

            User.info(bearer)
              .then((userInfo) => {
                
                if (userInfo && userInfo.result_code === HttpStatus.OK) {
                  if (userInfo.data.user.schema_id === physicianID) {
                    response.redirect("/physician");
                  }
                  else if (userInfo.data.user.schema_id === patientID){
                    response.redirect("/patient");
                  }
                }
                else {
                  // in case I was not already redirected, the go to login page
                  response.redirect("/");
                }
              })
              .catch((error) => {
                console.log(`Promises rejected: ${error}`);
              });
          }
          else {
            // send user again to login page
            // TODO: insert a message to tell user have inserted wrong credential
            response.redirect("/");
          }
        })
        .catch((error) => {
          console.log(`FormData call error: ${error}`);
        });
    }
  };

// Delete auth token and send user back to login page  
module.exports.logout =
  function(request, response) {
    response.clearCookie("bearer");
    response.redirect("/");
  };