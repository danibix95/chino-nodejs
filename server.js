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

// create a Chino application
chino.applications.create(appData)
     .then((app) => {
        console.log(app.app_id, app.app_secret);
        chino.setAuth(app.app_id, app.app_secret);
     });
    // if any error is raised, then we don't manage it,
    // so app will terminate


// set constant ID
let patientsID, physiciansID, repositoryID, recipesID;
let pat1id, pat2id, collPat1, collPat2;

/* ======== SET UP THE ENVIRONMENT FOR EXAMPLE======== */
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

chino.repositories.create(repoDesc)
    .then(repo => {
      repositoryID = repo.repository_id;

      return chino.schemas.create(repositoryID, recipesSchema)
    })
    .then(result => Promise.all([
        chino.collections.create({name : "recipePat1"}),
        chino.collections.create({name : "recipePat2"})
    ]))
    .then(result => {
        collPat1 = result[0].collection_id;
        collPat2 = result[1].collection_id;

        pat1.recipeCollection = result[0].collection_id;
        pat2.recipeCollection = result[1].collection_id;

        return chino.userSchemas.create(patientSchema)
    })
    .then(us => {
        patientsID = us.schema_id;

        return Promise.all([insertPatient(pat1), insertPatient(pat2)])
    })
    .then(result => {
        pat1id = result[0].user_id;
        pat2id = result[1].user_id;

        phy.attributes.patients.push(pat1id);
        phy.attributes.patients.push(pat2id);

        return chino.userSchemas.create(physicianSchema)
    })
    .then(us => {
      physiciansID = us.schema_id;

      return chino.users.create(physiciansID, phy)
    })
    .then(res => Promise.all([
      chino.users.partialUpdate(pat1id, {attributes : { physicians : [res.user_id] }}),
      chino.users.partialUpdate(pat2id, {attributes : { physicians : [res.user_id] }}),
    ]))
    .catch(err => {
      console.error(err);
      throw new Error("Impossible to set up example environment");
    });

let insertPatient = (data) => chino.users.create(patientsID, data);
/* ======================================== */

/* ======================================== */

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

        let documents = []
        let offset = 0;

        // recursively retrieve documents
        function list(offset) {
          chino.collections.listDocuments(recipesCollection, offset)
              .then(docs => {
                documents = documents.concat(docs.list);
                offset += docs.count;
                // check if is needed to retrieve more docs
                if (docs.count !== 0 && offset < docs.total_count) list(offset);
              })
              .catch(err => {
                console.error(err);
              });
        }

        list(offset);

        // get all recipe of the patient
        Promise.all(documents)
          .then((result) => {
              // get documents id of patient recipes
              let documentsId = result.documents.map((doc) => doc.document_id);

              // get all documents
              return Promise.all(documentsId.map((docId) => chinoUser.documents.details(docId)))
          })
          .then((values) => {
            values.forEach((doc) => {
              doc.recipes.push({
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
          });
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

          written_recipes = user.attributes.written_recipes;

          recipe = {
            content : {
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
        .then((doc) => {
          // insert document into patient recipe collections
          chinoUser.collections.insertDocument(recipeCollection, doc.document_id)
              .then((success) => {
                // Check if current collection isn't managed by physician.
                // Add it if necessary
                if (!written_recipes.includes(recipeCollection)) {
                  written_recipes.push(recipeCollection);
                  const update = {
                    attributes : {
                      "written_recipes" : written_recipes
                    }
                  };
                  // update physician info
                  chino.users.partialUpdate(physician, update)
                      .catch((error) => {
                        console.error(error);
                        response.redirect("/physician");
                      });

                }
                // give patient permission to read that document
                const data = {
                  action : "grant",
                  resourceType : "documents",
                  resourceId : doc.document_id,
                  subjectType: "users",
                  subjectId : request.body["patient"],
                  manage : ["R"]
                }
                return chinoUser.perms.onResource(data)
              })
              .catch((error) => { console.error(error); });
          // let action run asynchronously and show the page to user
          response.redirect("/physician");
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
/* ----------------------- */

module.exports.login =
  function (request, response) {
    if (request.body["username"] && request.body["password"]) {
      chino.auth.login(request.body["username"], request.body["password"])
        .then((result) => {
            let bearer = result.access_token;

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

/*  SET UP A CLEANER LISTENER ON NODE EXIT  */
process.stdin.resume();

function exitHandler() {
  Promise.all([
    chino.userSchemas.delete(patientsID),
    chino.userSchemas.delete(physiciansID),
    chino.schemas.delete(recipesID)
  ])
  .then(() => Promise.all([
    chino.repositories.delete(repositoryID),
    chino.collections.delete(collPat1),
    chino.collections.delete(collPat2)
  ]))
  .then(() => { console.log("Exit successfully"); process.exit(); })
  .catch((err) => { console.log("Exit with error:\n" + err); process.exit() });
}
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('uncaughtException', exitHandler);