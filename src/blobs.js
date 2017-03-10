/**
 * Created by daniele on 22/02/17.
 */
"use strict";

const objects = require("./objects");
const ChinoAPIBase = require("./chinoBase");

class ChinoAPIBlobs extends ChinoAPIBase {
  /** Create a caller for Groups Chino APIs
   *
   * @param baseUrl     {string}         The url endpoint for APIs
   * @param customerId  {string}         The Chino customer id or bearer token
   * @param customerKey {string | null}  The Chino customer key or null (not provided)
   */
  constructor(baseUrl, customerId, customerKey = null) {
    super(baseUrl, customerId, customerKey);
  }

  /** Create a new blob
   *
   * @param info      {object}
   * @return {Promise.<objects.BlobUncommitted, objects.ChinoError>}
   *         A promise that return a BlobUncommitted object if resolved,
   *         otherwise throw an ChinoError object if rejected
   *         or was not retrieved a success status
   */
  create(info) {
    return this.call.post(`/blobs`, info)
        .then((result) => {
          if (result.result_code === 200) {
            return new objects.BlobUncommitted(result);
          }
          else {
            throw new objects.ChinoError(result);
          }
        })
        .catch((error) => { throw new objects.ChinoError(error); });
  }

  /** Upload data to blob using its upload id
   *
   * @param uploadId      {string}
   * @return {Promise.<objects.BlobUncommitted, objects.ChinoError>}
   *         A promise that return a BlobUncommitted object if resolved,
   *         otherwise throw an ChinoError object if rejected
   *         or was not retrieved a success status
   */
  upload(uploadId, octetStream, offset, length) {
    const params = {
      blob_offset : offset,
      blob_length : length
    }
    return this.call.put(`/blobs/${uploadId}`, octetStream, this.call.TYPES.OCT_STREAM, params)
        .then((result) => {
          if (result.result_code === 200) {
            return new objects.BlobUncommitted(result);
          }
          else {
            throw new objects.ChinoError(result);
          }
        })
        .catch((error) => { throw new objects.ChinoError(error); });
  }

  /** Commit the upload and return the blob information
   *
   * @param uploadId  {string}
   * @return {Promise.<objects.Blob, objects.ChinoError>}
   *         A promise that return a Blob object if resolved,
   *         otherwise throw an ChinoError object if rejected
   *         or was not retrieved a success status
   */
  commit(uploadId) {
    const params = {
      upload_id : uploadId
    };

    return this.call.post(`/blobs/commit`, params)
        .then((result) => {
          if (result.result_code === 200) {
            return new objects.Blob(result);
          }
          else {
            throw new objects.ChinoError(result);
          }
        })
        .catch((error) => { throw new objects.ChinoError(error); });
  }

  /** Retrieve selected blob data
   *
   * @param blobId      {object}
   * @return {Promise.<Octet Stream, objects.ChinoError>}
   *         A promise that return Blob object as Octet stream if resolved,
   *         otherwise throw an ChinoError object if rejected
   */
  download(blobId) {
    return this.call.get(`/blobs/${blobId}`, {}, this.call.TYPES.OCT_STREAM)
        .then((chunk) => chunk)
        .catch((error) => { throw new objects.ChinoError(error); });
  }

  /** Delete blob selected by its id
   *
   * @param blobId  {string}
   * @return {Promise.<objects.Success, objects.ChinoError>}
   *         A promise that return a Success object if resolved,
   *         otherwise throw an ChinoError object if rejected
   *         or was not retrieved a success status
   */
  delete(blobId) {
    const params = {};

    return this.call.del(`/blobs/${blobId}`, params)
        .then((result) => {
          if (result.result_code === 200) {
            return new objects.Success(result);
          }
          else {
            throw new objects.ChinoError(result);
          }
        })
        .catch((error) => { throw new objects.ChinoError(error); });
  }
}

module.exports = ChinoAPIBlobs;