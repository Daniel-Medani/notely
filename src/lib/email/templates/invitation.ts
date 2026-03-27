import { baseLayout } from './base'

export function invitationEmail({
  organizationName,
  acceptUrl,
}: {
  organizationName: string
  acceptUrl: string
}): { subject: string; html: string } {
  const subject = `You've been invited to join ${organizationName} on Notely`
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#171717;letter-spacing:-0.5px;">You've been invited!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#404040;line-height:1.6;">
      You've been invited to join <strong>${organizationName}</strong> on Notely.
      Click the button below to accept your invitation and get started.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td>
          <a href="${acceptUrl}"
             style="display:inline-block;background-color:#171717;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#737373;">This link will expire in 48 hours.</p>
  `
  return { subject, html: baseLayout(content) }
}
