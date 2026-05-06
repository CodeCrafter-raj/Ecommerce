const swaggerAutogen = require('swagger-autogen');
const dotenv = require('dotenv');
const path = require('path');

const doc={
  info:{
    title:"Product Service API",
    description:"Automatically generated Swagger docs"
  },

  host:"localhost:6000",
  schemes:["http"],
};


const outputFile= "./swagger-output.json";
const endpointsFiles=["./routes/product.routes.ts"];

swaggerAutogen()(outputFile,endpointsFiles,doc);