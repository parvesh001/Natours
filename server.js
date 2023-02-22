const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.MONGO_DATABASE.replace(
  '<PASS>',
  process.env.MONGO_USER_PASSWORD
);
mongoose
  .connect(DB)
  .then((con) => console.log('connected to database successfully!')).catch(err=>console.log(err));


//START SERVER
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`listening at port number ${port}`));
