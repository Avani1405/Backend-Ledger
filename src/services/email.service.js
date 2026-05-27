const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email server error:', error);
  } else {
    console.log('✅ Email server ready');
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log('📧 Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to Backend Ledger!';
  const text = `Hi ${name}, Welcome!`;

  const html = `
    <h2>Welcome ${name} 🎉</h2>
    <p>Your account is successfully created.</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(toEmail, fromName, amount, toName) {
  const subject = 'Transaction Alert';
  const text = `You received ${amount} from ${fromName}`;
  const html = `
    <h2>Transaction Alert</h2>
    <p>You received ${amount} from ${fromName}.</p>
  `;

  await sendEmail(toEmail, subject, text, html);
}

async function sendTransactionfailureEmail(toEmail, fromName, amount, toName) {
  const subject = 'Transaction Failed';
  const text = `Your transaction of ${amount} from ${fromName} to ${toName} failed. Please try again.`;
  const html = `
    <h2>Transaction Failed</h2>
    <p>Your transaction of ${amount} from ${fromName} to ${toName} failed. Please try again.</p>
  `;

  await sendEmail(toEmail, subject, text, html);
}

module.exports = {
  sendRegistrationEmail
};