# WELCOME TO TOURISTA TOURS WEB APP SERVICE
Welcome to Tourista Tours, a comprehensive tour booking web service that offers an immersive travel experience. With our platform, users can easily discover, book, and enjoy memorable tours around the world.

Note: The frontend code for this web service is available in a separate repository. You can find it at (https://github.com/parvesh001/tourista-front-end). To use the web service, make sure to set up and run the frontend code as well. Refer to the frontend repository for instructions on installing and running the frontend application.

## Features
- Authentication and Authorization: Secure your account with JWT-based authentication and bcrypt password encryption. Reset and update your password for enhanced security.
- Admin-Specific APIs: Admins have access to restricted APIs for managing users, bookings, tours, and reviews. Admins can efficiently handle administrative tasks and ensure smooth operations.
- Analysis APIs: The administration get valuable insights with analysis APIs that provide information about average ratings, total ratings, and average prices for tours of different difficulty levels. Explore bookings month plans for specific periods.
- User Profile Management: Users can create and update their profiles, ensuring a personalized experience. Manage bookings, reviews, and enjoy a seamless journey with Tourista Tours.
- Tour Booking: Explore a wide range of available tours and book your preferred ones. Make informed decisions by accessing details about guides, ratings, difficulty levels, and prices.
- Tour Filtering: Filter tours based on difficulty levels, ratings, and prices, enabling you to find the perfect match for your preferences.
- Payment Integration: Securely make tour bookings using the Stripe payment interface, ensuring a smooth and hassle-free payment process.

## Technologies
- Node
- Express
- MongoDB
- Mongoose
- JSON Web Token
- Stripe
- Sendgrid
- Multer

## Getting Started
To get started with Tourista Tours, follow these steps:
- Clone the repository: git clone https://github.com/parvesh001/tourista-back-end.
- Install dependencies: npm install.
- Configure the environment variables: MONGO_DATABASE, MONGO_USER_PASSWORD, JWT_SECRET_KEY, JWT_EXPIRESIN, JWT_COOKIE_EXPIRESIN, SENDGRID_API_KEY, SENDGRID_USER_EMAIL, FRONT_END_DOMAIN, STRIPE_API_KEY, and STRIPE_WEBHOOK_SECRET_KEY.
- Run the server: npm start.
- Access the web service locally at http://localhost:8080.

## Contributions
We welcome contributions from the open-source community to enhance Tourista Tours. If you have any ideas, bug fixes, or feature suggestions, please feel free to submit a pull request.

