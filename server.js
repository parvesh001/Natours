const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log(err.name + ':' + err.message);
  console.log('UNCAUGHT EXCEPTION! Shutting down the server...');
  process.exit(1);
});

const app = require('./app');

const DB = process.env.MONGO_DATABASE.replace(
  '<PASS>',
  process.env.MONGO_USER_PASSWORD
);
let server;
mongoose.set('strictQuery', true);
mongoose.connect(DB).then((con) => {
  console.log('connected to database successfully!');
  //START SERVER
  const port = process.env.PORT || 5000;
    server = app.listen(port, () =>
    console.log(`listening at port number ${port}`)
  );
});

process.on('unhandledRejection', (err) => {
  console.log(err.name + ':' + err.message);
  console.log('UNHANDLED REJECTION! Shutting down the server...');
  server.close(() => {
    process.exit(1);
  });
});
