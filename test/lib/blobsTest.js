const assert = require("assert");
const should = require('should');

const fs = require("fs");
const path = require("path");
const Call = require("../../src/apiCall.js");
const Blobs = require("../../src/blobs");
const objects = require("../../src/objects");
const settings = require("./../testsSettings");

const baseUrl     = settings.baseUrl;
const customerId  = settings.customerId;
const customerKey = settings.customerKey;

describe('Chino Blobs API', function () {
  // change timeout for slow network
  this.timeout(5000);

  const apiCall = new Call(baseUrl, customerId, customerKey);
  const blobCaller = new Blobs(baseUrl, customerId, customerKey);

  // keep track of id to delete it later
  let repoId = "";
  let schemaId = "";
  let docId = "";
  let blobId = "";

  before(function () {
    repoId = "" // INSERT HERE YOUR REPOSITORY ID

    const schema = {
      description: "Schema for testing Blob lib",
      structure: {
        fields: [
          {
            name: "ciao",
            type: "string"
          },
          {
            name: "number",
            type: "integer"
          },
          {
            name: "file",
            type: "blob"
          }
        ]
      }
    };
    const doc = {
      content : {
        ciao : "Hello! This is a blob test.",
        number : 3
      }
    }

    return apiCall.post(`/repositories/${repoId}/schemas`, schema)
        .then((res) => {
          schemaId = res.data.schema.schema_id;

          if (schemaId) {
            return apiCall.post(`/schemas/${schemaId}/documents`, doc)
                .then((res) => { docId = res.data.document.document_id; });
          }
        })
        .catch((err) => console.log(`Error inserting doc\n${JSON.stringify(err)}`));
  })

  /* upload */
  it("Test the upload of a blob: should return a Blob object",
      function () {
        const fileName = path.join(__dirname, "files/img.jpg");

        return blobCaller.upload(docId, "file", fileName)
            .then((result) => {
              result.should.be.an.instanceOf(objects.Blob);
              Object.keys(result).length.should.be.above(0);
              blobId = result.blob_id;
            })
      }
  );

  /* download */
  it("Test the retrieving of blob data: should write a file object",
      function () {
        this.timeout(10000);

        const resultFile = path.join(__dirname, "files/result.jpg");

        return blobCaller.download(blobId, resultFile)
            .then((result) => {
              fs.access(resultFile, fs.constants.R_OK, (err) => {
                throw new Error(err);
              })
            })
      }
  );


  /* delete */
  it("Test the deletion of a blob data: should return a success message",
      function () {
        return blobCaller.delete(blobId)
            .then((result) => {
              result.should.be.an.instanceOf(objects.Success);
              result.result_code.should.be.equal(200);
            })
      }
  );

  after("Clean environment", function () {
    // be sure to have enough time
    this.timeout(10000);

    function sleep (time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    }

    return sleep(1000).then(() => {
        if (schemaId !== "") {
          return
              apiCall.del(`/schemas/${schemaId}?force=true&all_content=true`)
                .then(res => {
                  // if (repoId !== "") {
                  //     return apiCall.del(`/repositories/${repoId}?force=true`)
                  //         .then(res => { /*console.log("Removed stub stuff")*/ })
                  //         .catch(err => { console.log(`Error removing repository resources`) });
                  // }
                })
              .catch(err => { console.log(`Error removing test resources`) });
        }
    });
  });
});
