# Chino.io NodeJs client
[![Build Status](https://travis-ci.org/chinoio/chino-nodejs.svg?branch=master)](https://travis-ci.org/danibix95/chino-nodejs) [![codecov](https://codecov.io/gh/danibix95/chino-nodejs/branch/master/graph/badge.svg)](https://codecov.io/gh/danibix95/chino-nodejs)

*Official* Node JS wrapper for [Chino.io](https://chino.io) APIs.

At the following links can be found:
- [Chino APIs documentation](https://docs.chino.io)
- [SDK documentation](https://chinoio.github.io/chino-nodejs)

## The example
In this branch you can find a simple application, which it uses Chino APIs for managing prescriptions.
The application's user are physician (who can write recipes for their patients) and patients (who can read their recipes).

**Note:** The aim of the example is to show how to use SDK for calling Chino APIs.

### Example initialization
Before you can try the example you have to follow below steps. First of all clone this branch (*example*) of the SDK repository:

    git clone -b example https://github.com/chinio/chino-nodejs.git

Then go into repository folder
   
    cd chino-nodejs
And install example dependencies

    npm install 
    
After the installation process, open `server.js` file and insert base url for calls (e.g. the one for testing if you have a free plan), your Chino customer id and customer key:

    ...
    const baseUrl = "https://api.test.chino.io/v1";
    const customerId  = "your-Chino-Customer-ID";
    const customerKey = "your-Chino-Customer-KEY";
    ...
    
Now the example is ready to be tested. Run the following command to test it:

    node app.js
or:

    npm start
and wait example app finish to start up before start to try it.  
When it will be ready, open the following link in your browser: [http://localhost:20001](http://localhost:20001/)

**Note:** the application need a start up time, because it has to create on your Chino area some objects on which it depends.

### Try it
To try the example you have to login as physician or as patient.

Physician credentials are:

    username: BNDPRZ70M60L7861K
    password: 12345678--
Once you have logged in as physician you can write a prescription, choosing a patient, selecting a date and writing an observation. When you are ready, press `Submit` button. After recipe is sent to Chino for saving, you will be redirected again to physician page, with form's field cleared. Now you can write a more recipes or look at recipes you had written as physician, logging as patient.

One of the patients credentials are:

    username: MRARSS70A01L781H
    password: 12345678--
Once you have logged in as patient you can see the list of all the recipes written for you from your physicians.

**Note:** *in production remember to use stronger password than the one showed here. These are only for testing purpose.*

### Stop the example
To stop the example simply hit <kbd>Ctrl</kbd>+<kbd>C</kbd>. This will stop example execution and will also clean your Chino area from its objects.