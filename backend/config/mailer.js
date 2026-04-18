const nodemailer = require('nodemailer')

// In development without email creds, log OTP to console instead of crashing
let transporter

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
} else {
  // Fake transporter — logs to console, never crashes
  transporter = {
    sendMail: async (opts) => {
      console.log('\n📧 DEV EMAIL (not sent):')
      console.log('  To:', opts.to)
      console.log('  Subject:', opts.subject)
      // Extract OTP from HTML if present
      const otpMatch = opts.html?.match(/>(\d{6})</)
      if (otpMatch) console.log('  OTP:', otpMatch[1])
      console.log('')
      return { messageId: 'dev-' + Date.now() }
    }
  }
}

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
const wrap = (body) => `
  <div style="
    font-family: 'Segoe UI', sans-serif;
    background: #0a0f1e;
    color: #f1f5f9;
    padding: 32px;
    border-radius: 16px;
    max-width: 600px;
    margin: 0 auto;
  ">
    <div style="margin-bottom:24px">
      <span style="font-size:22px;font-weight:700;color:#3b82f6;">Budget</span>
      <span style="font-size:22px;font-weight:700;color:#10b981;">OS</span>
    </div>
    ${body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1f2937;font-size:11px;color:#6b7280;">
      This is an automated message from BudgetOS. Do not reply to this email.
    </div>
  </div>
`

// ─── OTP Email ────────────────────────────────────────────────────────────────
exports.sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"BudgetOS" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'BudgetOS — Email Verification OTP',
    html: wrap(`
      <h2 style="margin:0 0 8px">Verify Your Email</h2>
      <p style="color:#9ca3af;margin:0 0 24px">Use the OTP below to verify your official government email address.</p>
      <div style="
        background:#111827;
        border:1px solid #1f2937;
        border-radius:12px;
        padding:24px;
        text-align:center;
        letter-spacing:16px;
        font-size:32px;
        font-weight:700;
        color:#10b981;
        margin-bottom:24px;
      ">${otp}</div>
      <p style="color:#6b7280;font-size:13px;">
        ⏱ Valid for <strong style="color:#f59e0b;">10 minutes</strong>. 
        Do not share this OTP with anyone.
      </p>
    `)
  })
}

// ─── Admin Approval Notification ─────────────────────────────────────────────
exports.sendApprovalEmail = async (to, name) => {
  await transporter.sendMail({
    from: `"BudgetOS" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'BudgetOS — Admin Access Approved ✅',
    html: wrap(`
      <h2 style="margin:0 0 8px">Access Granted</h2>
      <p style="color:#9ca3af;margin:0 0 16px">Dear <strong style="color:#f1f5f9;">${name}</strong>,</p>
      <p style="color:#9ca3af;margin:0 0 24px">
        Your admin access to BudgetOS has been verified and approved by the superadmin.
        You can now log in and begin managing budget allocations for your region.
      </p>
      <a href="${process.env.CLIENT_URL}/admin/login" style="
        display:inline-block;
        background:#3b82f6;
        color:white;
        padding:12px 28px;
        border-radius:8px;
        text-decoration:none;
        font-weight:600;
        font-size:14px;
      ">Login to BudgetOS →</a>
    `)
  })
}

// ─── Admin Rejection Notification ────────────────────────────────────────────
exports.sendRejectionEmail = async (to, name, reason = '') => {
  await transporter.sendMail({
    from: `"BudgetOS" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'BudgetOS — Admin Access Request Update',
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#ef4444;">Access Request Not Approved</h2>
      <p style="color:#9ca3af;margin:0 0 16px">Dear <strong style="color:#f1f5f9;">${name}</strong>,</p>
      <p style="color:#9ca3af;margin:0 0 16px">
        After review, your admin access request could not be approved at this time.
      </p>
      ${reason ? `
        <div style="background:#1f2937;border-left:3px solid #ef4444;padding:12px 16px;border-radius:4px;margin-bottom:16px;">
          <span style="color:#6b7280;font-size:12px;">REASON</span>
          <p style="color:#f1f5f9;margin:4px 0 0;">${reason}</p>
        </div>
      ` : ''}
      <p style="color:#6b7280;font-size:13px;">
        If you believe this is an error, please contact your department's IT administrator.
      </p>
    `)
  })
}

// ─── Report Email ─────────────────────────────────────────────────────────────
exports.sendReportEmail = async (to, name, report) => {
  const allocRows = report.allocations
    ? [...report.allocations.entries()].map(([sector, frac]) => `
        <tr>
          <td style="padding:10px 12px;color:#f1f5f9;">${sector}</td>
          <td style="padding:10px 12px;color:#10b981;text-align:right;font-weight:600;">
            ${(frac * 100).toFixed(1)}%
          </td>
          <td style="padding:10px 12px;color:#9ca3af;text-align:right;">
            ₹${((frac * report.totalBudget) / 1e7).toFixed(2)} Cr
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" style="color:#6b7280;padding:10px;">No allocation data</td></tr>'

  const deltaRows = report.allocationDelta
    ? [...report.allocationDelta.entries()].map(([sector, delta]) => `
        <tr>
          <td style="padding:8px 12px;color:#f1f5f9;">${sector}</td>
          <td style="padding:8px 12px;text-align:right;font-weight:600;color:${delta >= 0 ? '#10b981' : '#ef4444'};">
            ${delta >= 0 ? '+' : ''}${delta}%
          </td>
        </tr>
      `).join('')
    : ''

  await transporter.sendMail({
    from: `"BudgetOS" <${process.env.EMAIL_USER}>`,
    to,
    subject: `BudgetOS Report — ${report.title}`,
    html: wrap(`
      <h2 style="margin:0 0 4px;">${report.title}</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">
        FY ${report.fiscalYear} &nbsp;·&nbsp; Generated for ${report.regionName || report.regionId}
        &nbsp;·&nbsp; ${new Date(report.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
      </p>

      ${report.summary ? `
        <div style="background:#111827;border:1px solid #1f2937;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="color:#9ca3af;margin:0;font-size:14px;line-height:1.6;">${report.summary}</p>
        </div>
      ` : ''}

      <h3 style="color:#3b82f6;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">
        Sector Allocations
      </h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="border-bottom:1px solid #1f2937;">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:12px;font-weight:500;">SECTOR</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-size:12px;font-weight:500;">SHARE</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-size:12px;font-weight:500;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>${allocRows}</tbody>
        <tfoot>
          <tr style="border-top:1px solid #1f2937;">
            <td style="padding:10px 12px;font-weight:700;">Total</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;">100%</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#3b82f6;">
              ₹${(report.totalBudget / 1e7).toFixed(2)} Cr
            </td>
          </tr>
        </tfoot>
      </table>

      ${deltaRows ? `
        <h3 style="color:#f59e0b;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">
          Change vs Previous Year
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tbody>${deltaRows}</tbody>
        </table>
      ` : ''}

      ${report.paretoStrategy ? `
        <h3 style="color:#8b5cf6;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">
          Optimization Metrics
        </h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
          <div style="background:#111827;border:1px solid #1f2937;border-radius:8px;padding:12px 20px;flex:1;min-width:120px;text-align:center;">
            <div style="color:#6b7280;font-size:11px;margin-bottom:4px;">HDI SCORE</div>
            <div style="font-size:20px;font-weight:700;color:#10b981;">${report.paretoStrategy.hdi?.toFixed(3) ?? 'N/A'}</div>
          </div>
          <div style="background:#111827;border:1px solid #1f2937;border-radius:8px;padding:12px 20px;flex:1;min-width:120px;text-align:center;">
            <div style="color:#6b7280;font-size:11px;margin-bottom:4px;">GINI COEFF</div>
            <div style="font-size:20px;font-weight:700;color:#f59e0b;">${report.paretoStrategy.gini?.toFixed(3) ?? 'N/A'}</div>
          </div>
          <div style="background:#111827;border:1px solid #1f2937;border-radius:8px;padding:12px 20px;flex:1;min-width:120px;text-align:center;">
            <div style="color:#6b7280;font-size:11px;margin-bottom:4px;">SHOCK INDEX</div>
            <div style="font-size:20px;font-weight:700;color:#ef4444;">${report.paretoStrategy.shock?.toFixed(3) ?? 'N/A'}</div>
          </div>
        </div>
      ` : ''}

      <a href="${process.env.CLIENT_URL}/admin/reports" style="
        display:inline-block;
        background:#3b82f6;
        color:white;
        padding:12px 28px;
        border-radius:8px;
        text-decoration:none;
        font-weight:600;
        font-size:14px;
      ">View Full Report in BudgetOS →</a>
    `)
  })
}