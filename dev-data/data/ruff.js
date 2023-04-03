const startDates = [
  '2021-04-25T09:00:00.000Z',
  '2021-07-20T09:00:00.000Z',
  '2021-10-05T09:00:00.000Z',
];

const BookingsPerStartDate = [
  {
    startDate: '2021-04-25T09:00:00.000Z',
    participants: [1, 2, 3, 4, 5],
    availabeCapacity: 5,
  },
  {
    startDate: '2021-07-20T09:00:00.000Z',
    participants: [1, 2, 3],
    availabeCapacity: 2,
  },
  {
    startDate: '2021-10-05T09:00:00.000Z',
    participants: [],
    availabeCapacity: 0,
  },
];

BookingsPerStartDate.forEach(BPST=>{
  BPST.availabeCapacity === 0 ? console.log('full'): console.log(BPST.availabeCapacity)
})

