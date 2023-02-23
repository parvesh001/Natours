// module.exports = (fn) => {
//   return  async(req, res, next) => {
//     try{
//         await fn(req,res,next)
//     }catch(err){
//         next(err)
//     }
//   };
// };

//wrap the controller and return this function which handles errors 
//As our controller is async function it returns promise, in case of rejection err results come in catch block
module.exports = (fn) => {
  return  (req, res, next) => {
    fn(req,res,next).catch(next)
  };
};

