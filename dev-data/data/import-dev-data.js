const fs = require('fs');

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewsModel');

dotenv.config({ path: './config.env' });

const DB = process.env.MONGO_DATABASE.replace(
  '<PASS>',
  process.env.MONGO_USER_PASSWORD
);
mongoose.set('strictQuery', true);
mongoose
  .connect(DB)
  .then((con) => console.log('connected to database successfully!'))
  .catch((err) => console.log(err));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`));

const importData = async()=>{
    try {
        await Tour.create(tours)
        await User.create(users, {validateBeforeSave:false})
        await Review.create(reviews)
        console.log('imported successfully!')
    } catch (error) {
        console.log(error)
    }
    process.exit()
}

const deleteData = async()=>{
    try {
        await Tour.deleteMany()
        await Review.deleteMany()
        await User.deleteMany()
        console.log('deleted!')
    } catch (error) {
        console.log(error)
    }
    process.exit()
}

if(process.argv[2]==='--import'){
    importData()
}else if(process.argv[2]==='--delete'){
    deleteData()
}
