const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
})

exports.sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"BudgetOS" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your BudgetOS Verification OTP',
    html: `
      <div style="font-family:sans-serif;padding:24px;background:#0a0f1e;color:#f1f5f9;border-radius:12px">
        <h2 style="color:#3b82f6">BudgetOS — Email Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:12px;color:#10b981">${otp}</h1>
        <p style="color:#6b7280;font-size:12px">Valid for 10 minutes. Do not share this.</p>
      </div>
    `
  })
}

exports.sendApprovalEmail = async (to, name) => {
  await transporter.sendMail({
    from: `"BudgetOS" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'BudgetOS — Admin Access Approved',
    html: `<p>Dear ${name}, your admin access to BudgetOS has been approved.</p>`
  })
}