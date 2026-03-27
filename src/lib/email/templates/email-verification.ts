import { baseLayout } from './base'

export function emailVerificationEmail({ url, userName }: { url: string; userName: string }): {
  subject: string
  html: string
} {
  const subject = 'Verify your email address on Notely'
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#171717;letter-spacing:-0.5px;">Verify your email</h1>
    <p style="margin:0 0 8px;font-size:15px;color:#404040;line-height:1.6;">Hi ${userName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#404040;line-height:1.6;">
      Please verify your email address to get started with Notely.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td>
          <a href="${url}"
             style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#737373;">If you didn't create an account, you can ignore this email.</p>
  `
  return { subject, html: baseLayout(content) }
}
