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

module.exports.details = (event, context, callback) => {
  const { name, surname } = event.queryStringParameters || {};

  let params = {
    TableName: process.env.PERSON_TABLE,
  };

  if (name || surname) {
    params.FilterExpression = '';
    params.ExpressionAttributeNames = {};
    params.ExpressionAttributeValues = {};

    if (name) {
      params.FilterExpression += '#name = :name';
      params.ExpressionAttributeNames['#name'] = 'name';
      params.ExpressionAttributeValues[':name'] = name;
    }

    if (surname) {
      if (params.FilterExpression !== '') {
        params.FilterExpression += ' AND ';
      }
      params.FilterExpression += '#surname = :surname';
      params.ExpressionAttributeNames['#surname'] = 'surname';
      params.ExpressionAttributeValues[':surname'] = surname;
    }
  }

  dynamoDb
    .scan(params)
    .promise()
    .then((result) => {
      const persons = result.Items;
      const response = {
        statusCode: 200,
        body: JSON.stringify({ persons: persons }),
      };
      callback(null, response);
    })
    .catch((error) => {
      console.error(error);
      callback(new Error("Couldn't fetch persons."));
    });
};
