const nodemailer = require("nodemailer");

/**
 * Send an email
 *
 * @param {object} options - Object data of {destination, subject, content}
 */
const send = async (options) => {
  return new Promise(async (resolve, reject) => {
    try {
      let transporterConfig = {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_GMAIL_USER,
          pass: process.env.EMAIL_GMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      };
      let emailSender = process.env.EMAIL_GMAIL_USER;
      if (process.env.EMAIL_PROVIDER == "WIT") {
        transporterConfig = {
          host: process.env.EMAIL_WIT_SMTP,
          port: process.env.EMAIL_WIT_PORT,
          tls: { secureProtocol: "TLSv1_method" },
        };
        emailSender = options.emailSender
          ? options.emailSender
          : process.env.EMAIL_WIT_USER;
      }
      options.from = emailSender;

      // set email to user test if development
      if (process.env.NODE_ENV === "development") {
        Object.assign(options, { to: process.env.EMAIL_TESTING });
        if (options.cc) {
          Object.assign(options, { cc: process.env.EMAIL_TESTING });
        }
      }

      const transporter = nodemailer.createTransport(transporterConfig);
      await transporter.sendMail(options, function (error, info) {
        if (error) {
          resolve({ success: true, info: error });
        } else {
          resolve({ success: true, info: info });
        }
      });
    } catch (error) {
      resolve({ success: true, info: error });
    }
  });
};

module.exports = {
  send,
};
