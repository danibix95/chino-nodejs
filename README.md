# Chino.io NodeJs client
[![Build Status](https://travis-ci.org/danibix95/chino-nodejs.svg?branch=master)](https://travis-ci.org/danibix95/chino-nodejs) [![codecov](https://codecov.io/gh/danibix95/chino-nodejs/branch/master/graph/badge.svg)](https://codecov.io/gh/danibix95/chino-nodejs)

*Official* Node JS wrapper for [Chino.io](https://chino.io) APIs.

At the following links can be found:
- [Chino APIs documentation](https://docs.chino.io)
- [SDK documentation](https://danibix95.github.io/chino-nodejs)

## Requirements
Before you can use Chino Node JS SDK you have to install Node JS Javascript runtime. If you haven't it yet, you can follow the [instructions](https://nodejs.org/en/download/package-manager/) provided on Node JS website.

## Installation
To install Chino SDK in your Node JS project you can run the following command

    npm install --save chinoio
    
The above command will download Chino SDK in your `node_modules` directory and will add the dependency in your `package.json file`.

## SDK usage example
In this branch you can find a simple example of how use Chino SDK. You can try it cloning this branch (*example*) of the repository:

    git clone -b example https://github.com/danibix95/chino-nodejs.git

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
When it will be ready, open the following in your browser: [http://localhost:20001](http://localhost:20001/)