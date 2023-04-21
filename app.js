const path = require('path');

//Required Packages
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
// const csrf = require('csurf')

const bookingController = require('./controllers/bookingController');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

//Required Routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();
// const csrfProtection = csrf({ cookie: true });

//GLOBAL MIDDLEWARES:run on each request
//Log requests during development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Cors headers
app.use(cors());

//browser sends this request when there is non-simpple requsts:PUT,PATCH,DELETE,CONTAIN COOKIE
app.options('*', cors());

// // add the csrf middleware
// app.use(csrfProtection);

//HANDLING STRIPE WEBHOOK "CHECKOUT.SESSION.COMPLETED" EVENT
app.post(
  '/webhook-checkout-completed',
  express.raw({ type: 'application/json' }),
  bookingController.bookMyTour
);

//Parse incoming json data
app.use(express.json());

//Parse cookie
app.use(cookieParser());

//Video Streaming
app.get('/api/v1/tourista-tours-video', (req,res,next)=>{
  //Check if there is range
  const range = req.headers.range;
  if(!range){
    return res.status(500).send('Range is required')
  }

  const filePath = path.join(__dirname, 'public','videos','tourista-tours.mp4');
  const fileSize = fs.statSync(filePath).size;

  //Decide max chunk size you want to send
  const CHUNK_SIZE = 10**6; //1MB

  //Parse start range, range will be in "bytes=233243-" form
  const start = parseInt(range.replace(/\D/g, ''))//remove non digit nums from range

  //Determine end byte, Math.min to not cross file actual size
  const end = Math.min(start + CHUNK_SIZE,fileSize - 1)

  //Content legth = end - start
  const contentLength = end - start + 1;

  //Prepare important headers
  const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length':contentLength,
      'Content-Type': 'video/mp4'
  }
  //Set response headers with status code 206 that says partial content
  res.writeHead(206, headers)

  //Create a stream
  const readStream = fs.createReadStream(filePath, {start, end})

  //Pipe stream to writable stream
  readStream.pipe(res)
})

// Serve static files from the "public" directory
app.use(express.static(path.join(`${__dirname}`, 'public')));

//Set security http headers
app.use(helmet());

//Limit incoming requests in between an hour
const limiter = rateLimit({
  max: 1000000000,
  windowMs: 60 * 60 * 1000,
  message: 'To many request from this IP, please try again after an hour',
});
app.use('/api', limiter);

//Senitize Data:NOSQL Querry Injuction
app.use(mongoSanitize());

//Senitize Data: XSS
app.use(xss());

//Prevent against parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'ratingsAverage',
      'price',
      'difficulty',
    ],
  })
);

app.use(compression());




//ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);


//404 response:When no route match
app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} route!`, 404));
});

//Global error handler:All errors come at this central place
app.use(globalErrorHandler);

module.exports = app;
