const anFn = async () => {
  const arr = [1, 2, 3, 4];

  const p = Promise.all(arr.map(async (el) => {
      return new Promise((res) => res(console.log('resolved')));
    }))
 
  console.log(p.then(()=>console.log('resolved')))
  console.log('bottom');
};
anFn();

