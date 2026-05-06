const swaggerAutogen = require('swagger-autogen');
const dotenv = require('dotenv');
const path = require('path');

const doc = {
  info: {
    title: 'Auth Service API',
    description: 'Automatically generated Swagger docs',
  },

  host: 'localhost:6001',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/auth.router.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);
