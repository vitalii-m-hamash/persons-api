'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const name = requestBody.name;
  const surname = requestBody.surname;
  const age = requestBody.age;

  if (
    typeof name !== 'string' ||
    typeof surname !== 'string' ||
    typeof age !== 'number'
  ) {
    console.error('Validation Failed');
    callback(new Error("Couldn't create person because of validation errors."));
    return;
  }

  submitPerson(personInfo(name, surname, age))
    .then((res) => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `Sucessfully created person with surname ${surname}`,
          personId: res.id,
        }),
      });
    })
    .catch((err) => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to create person with surname ${surname}`,
        }),
      });
    });
};

const submitPerson = (person) => {
  console.log('Creating person');
  const personInfo = {
    TableName: process.env.PERSON_TABLE,
    Item: person,
  };
  return dynamoDb
    .put(personInfo)
    .promise()
    .then((res) => person);
};

const personInfo = (name, surname, age) => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    name: name,
    surname: surname,
    age: age,
    submittedAt: timestamp,
    updatedAt: timestamp,
  };
};
