import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendInvitationEmail(
    toEmail: string,
    documentTitle: string,
    invitationToken: string,
    inviterName: string,
  ) {
    const inviteLink = `${process.env.FRONTEND_URL}/invitation?token=${invitationToken}`;

    const mailOptions = {
      from: process.env.MAIL_FROM || '"CollabDocs" <noreply@collabdocs.com>',
      to: toEmail,
      subject: `You're invited to collaborate on "${documentTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f4f4f4; 
              margin: 0; 
              padding: 0; 
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 8px; 
              overflow: hidden; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            }
            .header { 
              background: #4f46e5; 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
            }
            .content { 
              padding: 30px; 
            }
            .document-info { 
              background: #f9fafb; 
              border-left: 4px solid #4f46e5; 
              padding: 15px; 
              margin: 20px 0; 
            }
            .document-title { 
              font-size: 18px; 
              font-weight: bold; 
              color: #4f46e5; 
              margin: 0; 
            }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              background: #4f46e5; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: bold; 
              margin: 20px 0; 
            }
            .button:hover { 
              background: #4338ca; 
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              color: #6b7280; 
              font-size: 14px; 
              background: #f9fafb; 
            }
            .link-text { 
              color: #6b7280; 
              font-size: 12px; 
              word-break: break-all; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 You're Invited!</h1>
            </div>
            
            <div class="content">
              <p>Hi there!</p>
              
              <p><strong>${inviterName}</strong> has invited you to collaborate on:</p>
              
              <div class="document-info">
                <p class="document-title">${documentTitle}</p>
              </div>
              
              <p>Click the button below to accept the invitation and create your account:</p>
              
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Or copy and paste this link into your browser:<br>
                <span class="link-text">${inviteLink}</span>
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                ⏰ This invitation will expire in 7 days.
              </p>
            </div>
            
            <div class="footer">
              <p>This invitation was sent from CollabDocs</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Invitation email sent to ${toEmail}`);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }
  }

  /**
   * Send notification email to existing registered users
   * They just need to log in, no signup required
   */
  async sendCollaborationNotification(
    toEmail: string,
    documentTitle: string,
    userName: string,
    inviterName: string,
    shareToken: string,
  ) {
    const documentLink = `${process.env.FRONTEND_URL}/doc/${shareToken}`;

    const mailOptions = {
      from: process.env.MAIL_FROM || '"CollabDocs" <noreply@collabdocs.com>',
      to: toEmail,
      subject: `You've been added to "${documentTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f4f4f4; 
              margin: 0; 
              padding: 0; 
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 8px; 
              overflow: hidden; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            }
            .header { 
              background: #10b981; 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
            }
            .content { 
              padding: 30px; 
            }
            .document-info { 
              background: #f9fafb; 
              border-left: 4px solid #10b981; 
              padding: 15px; 
              margin: 20px 0; 
            }
            .document-title { 
              font-size: 18px; 
              font-weight: bold; 
              color: #10b981; 
              margin: 0; 
            }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              background: #10b981; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: bold; 
              margin: 20px 0; 
            }
            .button:hover { 
              background: #059669; 
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              color: #6b7280; 
              font-size: 14px; 
              background: #f9fafb; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ You're a Collaborator!</h1>
            </div>
            
            <div class="content">
              <p>Hi ${userName}!</p>
              
              <p><strong>${inviterName}</strong> has added you as a collaborator on:</p>
              
              <div class="document-info">
                <p class="document-title">${documentTitle}</p>
              </div>
              
              <p>Click the button below to view and start collaborating:</p>
              
              <div style="text-align: center;">
                <a href="${documentLink}" class="button">View Document</a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Log in to CollabDocs to access the document and start collaborating with your team.
              </p>
            </div>
            
            <div class="footer">
              <p>This notification was sent from CollabDocs</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Collaboration notification sent to ${toEmail}`);
    } catch (error) {
      console.error('Error sending notification email:', error);
      throw error;
    }
  }
}
