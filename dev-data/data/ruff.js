// const fs = require('fs')
const path = require('path')
console.log(path.join(__dirname,"..", "..","public"))

// const readFile = (fp, cb) => {
//    fs.readFile(fp, (err, data) => {
//     if (err) {
//       cb(err, null);
//     } else {
//       cb(null, data);
//     }
//   });
// };

// readFile(`${__dirname}/reviews.json`, (err, data)=>{
//   if(err){
//     console.log("ERROR!!:" +err)
//   }else{
//     console.log("This is Data=>: " + data)
//   }
// })

// class Animal{
//   constructor(petName,breed){
//     this.petName = petName
//     this.breed = breed
//   }
// }

// class Dog extends Animal{
//   constructor(name, age){
//     super(name, '')
//     this.age = age
//   }
// }

// console.log(new Dog('rocky', '13'))

// const obj1 = {email:'1',name:'2',person:'3'}

// console.log(`${Object.keys(obj1)} already exists`)