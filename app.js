"use strict";

/* EXTERNAL LIBRARIES */
// libraries used for the middleware layout
const express = require("express");
const path = require("path");

// libraries used to parse request
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser"); 

// libraries used to reduce response data sent to client
const compression = require("compression");
const minify = require("express-minify");

const server = require("./server.js")

/* APPLICATION INITALIZATION */
const app = express();

app.set("title", "Chino API test");
app.set("port", (process.env.PORT || 20001));

// enable pug template engine and set view folder
app.set("views", path.join(__dirname, "/views"));
app.set('view engine', 'pug');

/* APPLICATION LOGIC */
app.use(compression());
app.use(minify());
// enable application to parse encoded form
app.use(bodyParser.urlencoded({ extended: true }));
// enable application to use cookies
app.use(cookieParser());

/*===================*/
/* MANAGE API */
app.get("/physician", server.requireLogin, server.isPhysician, server.physician);
app.get("/patient", server.requireLogin, server.isPatient, server.patient);
app.get("/logout", server.requireLogin, server.logout);
app.get("/", (request, response) => { response.render("login", {})});

app.post("/addRecipe", server.requireLogin, server.isPhysician, server.addRecipe);
app.post("/login", server.login);
/*===================*/

/* MANAGE PUBLIC RESOURCE */
// serve public files starting from root
app.use("/", express.static(path.join(__dirname, "public"), {dotfiles: "deny"}));

/* APPLICATION STARTUP */
app.listen(process.env.PORT || app.get("port"), function () {
  console.log("Starting the app on http://localhost:" + app.get("port") + "...");
});