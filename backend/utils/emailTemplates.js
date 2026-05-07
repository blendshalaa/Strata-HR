/**
 * emailTemplates.js
 * Centralised, branded email templates for HR Genie.
 * Usage: const { buildEmail } = require('./emailTemplates');
 *        sendEmail(to, buildEmail('leaveDecision', data).subject, buildEmail(...).html);
 */

const APP_NAME = 'HR Genie';
const BRAND_COLOR = '#18181b'; // zinc-900
const ACCENT_GREEN = '#10b981';
const ACCENT_RED = '#ef4444';
const ACCENT_AMBER = '#f59e0b';

// ─── Shared shell ────────────────────────────────────────────────────────────

const shell = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:20px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">${APP_NAME}</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f4f4f5;background:#fafafa;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                This is an automated message from <strong>${APP_NAME}</strong>. Please do not reply to this email.<br/>
                You are receiving this because you are a registered member of your organisation's HR Genie workspace.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Shared helpers ───────────────────────────────────────────────────────────

const statusBadge = (label, color) =>
  `<span style="display:inline-block;padding:3px 10px;border-radius:4px;background:${color}20;color:${color};font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${label}</span>`;

const infoTable = (rows) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;margin:20px 0;font-size:14px;">
    ${rows.map(([label, value], i) => `
      <tr style="background:${i % 2 === 0 ? '#fafafa' : '#ffffff'};">
        <td style="padding:10px 14px;color:#71717a;width:40%;">${label}</td>
        <td style="padding:10px 14px;color:#18181b;font-weight:600;">${value}</td>
      </tr>`).join('')}
  </table>`;

const btn = (label, url) =>
  `<a href="${url}" style="display:inline-block;margin-top:8px;padding:10px 22px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">${label}</a>`;

const fmtDate = (d) => new Date(d).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
const fmtMoney = (n) => `$${parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Templates ────────────────────────────────────────────────────────────────

/**
 * Sent to HR when an employee submits a leave request.
 * @param {{ employeeName, type, days, startDate, endDate, reason, dashboardUrl }} data
 */
const leaveSubmitted = (data) => ({
    subject: `New Leave Request – ${data.employeeName}`,
    html: shell(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">New Leave Request</h2>
        <p style="margin:0 0 20px;color:#52525b;font-size:14px;line-height:1.6;">
            <strong>${data.employeeName}</strong> has submitted a leave request that requires your attention.
        </p>
        ${infoTable([
            ['Employee', data.employeeName],
            ['Leave Type', data.type.charAt(0).toUpperCase() + data.type.slice(1)],
            ['Duration', `${data.days} day${data.days !== 1 ? 's' : ''}`],
            ['Period', `${fmtDate(data.startDate)} – ${fmtDate(data.endDate)}`],
            ['Reason', data.reason || 'No reason provided'],
        ])}
        ${btn('Review in Dashboard', data.dashboardUrl || process.env.APP_URL || 'https://hrgenie.app')}
    `),
    text: `New leave request from ${data.employeeName}: ${data.type} leave, ${data.days} day(s), ${data.startDate} to ${data.endDate}. Reason: ${data.reason || 'N/A'}.`
});

/**
 * Sent to the employee when their leave request is approved or rejected.
 * @param {{ employeeName, type, days, startDate, endDate, status, approverName }} data
 */
const leaveDecision = (data) => {
    const approved = data.status === 'approved';
    const statusColor = approved ? ACCENT_GREEN : ACCENT_RED;
    const statusLabel = approved ? 'Approved' : 'Rejected';
    return {
        subject: `Leave Request ${statusLabel} – ${data.days} day${data.days !== 1 ? 's' : ''} ${data.type}`,
        html: shell(`
            <h2 style="margin:0 0 8px;font-size:20px;color:${statusColor};">Leave Request ${statusLabel}</h2>
            <p style="margin:0 0 20px;color:#52525b;font-size:14px;line-height:1.6;">
                Hi <strong>${data.employeeName}</strong>,<br/>
                Your leave request has been ${statusBadge(statusLabel, statusColor)} by <strong>${data.approverName}</strong>.
            </p>
            ${infoTable([
                ['Leave Type', data.type.charAt(0).toUpperCase() + data.type.slice(1)],
                ['Duration', `${data.days} day${data.days !== 1 ? 's' : ''}`],
                ['Period', `${fmtDate(data.startDate)} – ${fmtDate(data.endDate)}`],
                ['Decision', statusLabel],
                ['Decided by', data.approverName],
            ])}
            ${approved
                ? `<p style="font-size:13px;color:#71717a;margin-top:16px;">Your leave balance has been updated to reflect this request.</p>`
                : `<p style="font-size:13px;color:#71717a;margin-top:16px;">If you have questions, please contact your HR team directly.</p>`
            }
        `),
        text: `Hi ${data.employeeName}, your ${data.type} leave request (${data.days} days, ${data.startDate} to ${data.endDate}) has been ${data.status} by ${data.approverName}.`
    };
};

/**
 * Sent to the employee when their payroll is marked as paid.
 * @param {{ employeeName, periodStart, periodEnd, baseSalary, bonus, taxDeduction, netSalary }} data
 */
const payrollPaid = (data) => ({
    subject: `Payslip Ready – ${fmtDate(data.periodStart)} to ${fmtDate(data.periodEnd)}`,
    html: shell(`
        <h2 style="margin:0 0 8px;font-size:20px;color:${ACCENT_GREEN};">Your Payslip is Ready</h2>
        <p style="margin:0 0 20px;color:#52525b;font-size:14px;line-height:1.6;">
            Hi <strong>${data.employeeName}</strong>,<br/>
            Your payroll for the period below has been processed and marked as ${statusBadge('Paid', ACCENT_GREEN)}.
        </p>
        ${infoTable([
            ['Pay Period', `${fmtDate(data.periodStart)} – ${fmtDate(data.periodEnd)}`],
            ['Base Salary', fmtMoney(data.baseSalary)],
            ['Bonus', fmtMoney(data.bonus)],
            ['Tax Deduction', fmtMoney(data.taxDeduction)],
            ['Net Pay', `<strong style="color:${ACCENT_GREEN};font-size:16px;">${fmtMoney(data.netSalary)}</strong>`],
        ])}
        <p style="font-size:13px;color:#71717a;margin-top:8px;">Log in to HR Genie to view and download your full payslip.</p>
    `),
    text: `Hi ${data.employeeName}, your payroll for ${data.periodStart} to ${data.periodEnd} has been processed. Net pay: ${fmtMoney(data.netSalary)}.`
});

/**
 * Sent to HR when a new employee registers.
 * @param {{ newEmployeeName, newEmployeeEmail, orgName }} data
 */
const newEmployeeRegistered = (data) => ({
    subject: `New Employee Registered – ${data.newEmployeeName}`,
    html: shell(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">New Employee Joined</h2>
        <p style="margin:0 0 20px;color:#52525b;font-size:14px;line-height:1.6;">
            A new employee has registered and joined <strong>${data.orgName}</strong>.
        </p>
        ${infoTable([
            ['Name', data.newEmployeeName],
            ['Email', data.newEmployeeEmail],
            ['Organisation', data.orgName],
            ['Joined', fmtDate(new Date())],
        ])}
        <p style="font-size:13px;color:#71717a;margin-top:8px;">You may want to complete their onboarding setup in the dashboard.</p>
        ${btn('Go to Dashboard', process.env.APP_URL || 'https://hrgenie.app')}
    `),
    text: `New employee registered: ${data.newEmployeeName} (${data.newEmployeeEmail}) joined ${data.orgName}.`
});

module.exports = { leaveSubmitted, leaveDecision, payrollPaid, newEmployeeRegistered };
