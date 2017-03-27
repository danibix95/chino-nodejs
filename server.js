// here is imported Chino SDK
const Chino = require("chinoio");

const baseUrl = "https://api.test.chino.io/v1";
const customerId  = process.env.CHINO_ID;  // insert here your Chino Customer ID
const customerKey = process.env.CHINO_KEY; // insert here your Chino Customer KEY

const chino = new Chino(baseUrl, customerId, customerKey);

/* ======== SET UP THE ENVIRONMENT FOR EXAMPLE ======== */
const appData = {
  name : "Application for example",
  grant_type: "password"
}

// define useful IDs
let patientsID, physiciansID, repositoryID, recipesID, appID;
let pat1id, pat2id, collPat1, collPat2;

const recipesSchema = {
  description: "Recipe",
  structure: {
    fields: [
      {
        indexed: true,
        name: "visit_date",
        type: "date"
      },
      {
        indexed: true,
        name: "physician_id",
        type: "string"
      },
      {
        indexed: true,
        name: "patient_id",
        type: "string"
      },
      {
        name: "observation",
        type: "text"
      }
    ]
  }
};

const patientSchema = {
  description: "Patient",
  structure: {
    fields: [
      {
        indexed: true,
        name: "CF",
        type: "string"
      },
      {
        name: "name",
        type: "string"
      },
      {
        name: "surname",
        type: "string"
      },
      {
        name: "address",
        type: "string"
      },
      {
        indexed: true,
        name: "email",
        type: "string"
      },
      {
        name: "phone",
        type: "string"
      },
      {
        name: "physicians",
        type: "json"
      },
      {
        name: "recipeCollection",
        type: "string"
      }
    ]
  }
};

const pat1 = {
  attributes: {
    CF: "MRARSS70A01L781H",
    address: "Piazza Fiera, 13, Trento, TN",
    email: "mario.rossi@example.org",
    name: "Mario",
    phone: "0461885506",
    physicians: [],
    surname: "Rossi",
    recipeCollection: ""
  },
  is_active: true,
  username: "MRARSS70A01L781H",
  password: "12345678--"
};
const pat2 = {
  attributes: {
    CF: "SRTLBT90E43L378C",
    address: "Via Francesco Barbacovi 22, Trento, TN",
    email: "eli.sr@example.org",
    name: "Elisabetta",
    phone: "0461885506",
    physicians: [],
    surname: "Sartori",
    recipeCollection: ""
  },
  is_active: true,
  username: "SRTLBT90E43L378C",
  password: "12345678--"
};

const physicianSchema = {
  description: "Physician",
  structure: {
    fields: [
      {
        indexed: true,
        name: "CF",
        type: "string"
      },
      {
        name: "name",
        type: "string"
      },
      {
        name: "surname",
        type: "string"
      },
      {
        name: "degree",
        type: "string"
      },
      {
        name: "patients",
        type: "json"
      },
      {
        name: "written_recipes",
        type: "json"
      }
    ]
  }
};

const phy = {
  attributes: {
    CF: "BNDPRZ70M60L7861K",
    degree: "Laurea in Medicina e Chirurgia",
    name: "Patrizia",
    patients: [],
    surname: "Bonadonna",
    written_recipes: []
  },
  is_active: true,
  username: "BNDPRZ70M60L7861K",
  password: "12345678--"
};

const repoDesc = {
  description : "Repository for application example"
}

// create a Chino objects needed by example
chino.applications.create(appData)
    .then((app) => {
      chino.setAuth(app.app_id, app.app_secret);
      appID = app.app_id;

      return chino.repositories.create(repoDesc)
    })
    .then(repo => {
      repositoryID = repo.repository_id;
      return chino.schemas.create(repositoryID, recipesSchema)
    })
    .then(result => {
      recipesID = result.schema_id;

      return Promise.all([
        chino.collections.create({name : "recipePat1"}),
        chino.collections.create({name : "recipePat2"})
      ])
    })
    .then(result => {
        collPat1 = result[0].collection_id;
        collPat2 = result[1].collection_id;

        pat1.attributes.recipeCollection = result[0].collection_id;
        pat2.attributes.recipeCollection = result[1].collection_id;

        return chino.userSchemas.create(patientSchema)
    })
    .then(us => {
        patientsID = us.user_schema_id;

        let insertPatient = (data) => chino.users.create(patientsID, data);

        return Promise.all([insertPatient(pat1), insertPatient(pat2)]);
    })
    .then(result => {
        pat1id = result[0].user_id;
        pat2id = result[1].user_id;

        phy.attributes.patients.push(pat1id);
        phy.attributes.patients.push(pat2id);

        return chino.userSchemas.create(physicianSchema);
    })
    .then(result => {
      physiciansID = result.user_schema_id;

      return chino.users.create(physiciansID, phy)
    })
    .then(res => {
        const perms = {
          action: "grant",
          resourceType: "schemas",
          resourceId: recipesID,
          childrenType : "documents",
          subjectType: "users",
          subjectId : res.user_id,
          permissions : {
            manage: ["C", "L"],
            created_document : {
              manage : ["R", "U", "D"],
              authorize : ["R"]
            }
          }
        };
        return Promise.all([
          chino.users.partialUpdate(pat1id, {attributes : { physicians : [res.user_id] }}),
          chino.users.partialUpdate(pat2id, {attributes : { physicians : [res.user_id] }}),
          chino.perms.onChildren(perms)
        ])
    })
    .then(() => {
      console.log("Example app is ready. Enjoy testing it :)")
      /*  SET UP A CLEANER LISTENER ON NODE EXIT  */
      process.stdin.resume();

      // delete all resources created for SKD usage example
      function exitHandler() {
        Promise.all([
          chino.schemas.delete(recipesID, true, true),
          chino.userSchemas.delete(patientsID, true),
          chino.userSchemas.delete(physiciansID, true),
          chino.collections.delete(collPat1, true),
          chino.collections.delete(collPat2, true)
        ])
            .then(() => Promise.all([
              chino.repositories.delete(repositoryID, true),
              chino.applications.delete(appID)
            ]))
            .then(() => { console.log("Clean Chino area and exit completed."); process.exit(); })
            .catch((err) => { console.log("Exit with error:\n" + err); process.exit() });
      }
      process.on('exit', exitHandler);              // other motivation to stop
      process.on('SIGINT', exitHandler);            // CTRL+C
      process.on('uncaughtException', exitHandler); // error
    })
    .catch(err => {
      console.error(`Time: ${new Date()}\n${JSON.stringify(err)}`);
      throw new Error("Impossible to set up example environment");
    });
/* ======================================== */

/* ==== APPLICATION EXAMPLE FUNCTIONS ===== */
module.exports.physician =
  function (request, response) {
    let data = { patients : [], message : ""}

    const chinoUser = new Chino(baseUrl, request.cookies["bearer"]);

    chinoUser.users.current()
      .then((user) => {
        const patients = user.attributes.patients;

        return Promise.all(patients.map((patId) => chino.users.details(patId)))
      })
      .then((values) => {
        values.forEach((pat) => {
          data.patients.push({
            "id" : pat.user_id,
            "username" : pat.username
          });
        });
        response.render("physician", data);
      })
      .catch((error) => {
        data.message = error.message;
        response.render("physician", data);
      });
  };

module.exports.patient =
  function (request, response) {
    let data = { recipes : [] };

    const chinoUser = new Chino(baseUrl, request.cookies["bearer"]);

    chinoUser.users.current()
      .then((result) => {
        let recipesCollection = result.attributes.recipeCollection;

        let documents = [];
        let offset = 0;

        // recursively retrieve documents
        function getList(resolve, reject) {
          chino.collections.listDocuments(recipesCollection, offset)
              .then(docs => {
                documents = documents.concat(docs.list);
                offset += docs.count;
                // check if is needed to retrieve more docs
                if (docs.count !== 0 && offset < docs.total_count) {
                  getList(resolve, reject);
                }
                else {
                  resolve(documents);
                }
              })
              .catch(err => {
                console.error(`Time: ${Date()}\n${JSON.stringify(err)}`);
                reject(err);
              });
        }

        // get all recipe of the patient
        return new Promise(getList);
      })
      .then((docs) => {
          // get documents id of patient recipes
          let documentsId = docs.map((doc) => doc.document_id);

          // get all documents
          return Promise.all(documentsId.map((docId) => chinoUser.documents.details(docId)))
      })
      .then((values) => {
        values.forEach((doc) => {
          data.recipes.push({
            "physician" : doc.content.physician_id,
            "visit_date" : doc.content.visit_date,
            "document_id" : doc.document_id,
            "observation" : doc.content.observation,
          });
        })

        response.render("patient", data);
      })
      .catch((error) => {
        console.error(error);
        response.render("patient", data);
      })
  };

module.exports.addRecipe =
  function (request, response) {
    if (request.body["recipe"] && request.body["recipe"] !== "") {
      const chinoUser = new Chino(baseUrl, request.cookies["bearer"]);

      // variables for managing recipe insertion
      let written_recipes = [];
      let recipe = {};
      let recipeCollection = "";
      let physician = ""

      chinoUser.users.current()
          .then((user) => {
            physician = user.user_id;

            // list of collections of recipes (one per patient)
            written_recipes = user.attributes.written_recipes;
            recipe = {
              content: {
                "physician_id": physician,
                "visit_date": request.body["visit-date"],
                "patient_id": request.body["patient"],
                "observation": request.body["recipe"]
              }
            }

            // get patient recipes collection and insert recipe also into it
            return chino.users.details(request.body["patient"])
          })
          .then((patient) => {
            recipeCollection = patient.attributes.recipeCollection;

            // insert a new document (recipe)
            return chinoUser.documents.create(recipesID, recipe)
          })
          .then((doc) =>
              // insert document into patient recipe collections
              chinoUser.collections.insertDocument(recipeCollection, doc.document_id)
                  .then((success) => {
                    // give patient permission to read that document
                    const data = {
                      action: "grant",
                      resourceType: "documents",
                      resourceId: doc.document_id,
                      subjectType: "users",
                      subjectId: request.body["patient"],
                      permissions: {
                        manage: ["R"]
                      }
                    }
                    return chino.perms.onResource(data);
                  })
          )
          .then(() => {
            // Check if current collection isn't managed by physician.
            // Add it if necessary
            if (!written_recipes.includes(recipeCollection)) {
              written_recipes.push(recipeCollection);
              const update = {
                attributes: {
                  "written_recipes": written_recipes
                }
              };
              // update physician info
              return chino.users.partialUpdate(physician, update);
            }
          })
          /* redirect after success */
          .then(() => { response.redirect("/physician"); })
          /* redirect after error */
          .catch((error) => {
            console.error(error);
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

module.exports.isPhysician =
  function (request, response, next) {
    const chinoUser = new Chino(baseUrl, request.cookies["bearer"]);
    chinoUser.users.current()
      .then((user) => {
        if (user.schema_id === physiciansID) {
          next();
        }
        // if it isn't a physician require to login
        else {
          response.redirect('/');
        }
      })
      .catch((error) => { response.redirect('/'); });
  };

module.exports.isPatient =
  function (request, response, next) {
    const chinoUser = new Chino(baseUrl, request.cookies["bearer"]);
    chinoUser.users.current()
        .then((user) => {
          if (user.schema_id === patientsID) {
            next();
          }
          // if it isn't a patient require to login
          else {
            response.redirect('/');
          }
        })
        .catch((error) => { response.redirect('/'); });
  };

module.exports.login =
  function (request, response) {
    if (request.body["username"] && request.body["password"]) {
      chino.auth.login(request.body["username"], request.body["password"])
        .then((result) => {
            let bearer = result.access_token;

            // set cookie to let user to access
            response.cookie(
              "bearer",
              bearer,
              {
                expires  : new Date(Date.now() + result.expires_in*200),
                httpOnly : true,
                sameSite : true
              }
            );

            const chinoUser = (new Chino(baseUrl, bearer)).users;

            return chinoUser.current();
        })
        .then((userInfo) => {
          switch (userInfo.schema_id) {
            case physiciansID:
              response.redirect("/physician"); break;
            case patientsID:
              response.redirect("/patient"); break;
            default:
              // no user
              response.redirect("/");
          }
        })
        .catch((error) => {
          console.error(error);
          response.redirect("/");
        });
    }
  };

// Delete auth token and send user back to login page  
module.exports.logout =
  function(request, response) {
    chino.auth.logout(request.cookies["bearer"])
        .then(success => {
          response.clearCookie("bearer");
          response.redirect("/");
        })
        .catch(error => { console.error(error); });
  };