const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const sendEmail = async (options) => {
  //1)Create Transporter
  const transporter = nodemailer.createTransport(
    sendgridTransport({
      auth: {
        api_key: process.env.SENDGRID_API_KEY,
      },
    })
  );

  //2) Define email options
  const emailOptions = {
    from: options.from,
    to: options.email,
    subject: options.subject,
    html:options.html
  };

  //3) Send email now
  await transporter.sendMail(emailOptions);
  
};

module.exports = sendEmail;
