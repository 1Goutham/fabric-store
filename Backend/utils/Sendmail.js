const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "525a7acb7656a5",
        pass: "cf6e78d59de69f"
    }
    });


    const mailOptions = {
        from: '"Auth Support" <no-reply@authapp.com>',
        to: options.email,
        subject: options.subject,
        text:options.message, 
    };
    await transporter.sendMail(mailOptions);
}
module.exports = sendEmail;