import { baseLayout } from './base'

export function passwordResetEmail({ url, userName }: { url: string; userName: string }): {
  subject: string
  html: string
} {
  const subject = 'Reset your password on Notely'
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#171717;letter-spacing:-0.5px;">Reset your password</h1>
    <p style="margin:0 0 8px;font-size:15px;color:#404040;line-height:1.6;">Hi ${userName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#404040;line-height:1.6;">
      We received a request to reset your password. Click the button below to choose a new password.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td>
          <a href="${url}"
             style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#737373;">This link will expire in 1 hour.</p>
    <p style="margin:0;font-size:13px;color:#737373;">If you didn't request a password reset, you can ignore this email.</p>
  `
  return { subject, html: baseLayout(content) }
}
