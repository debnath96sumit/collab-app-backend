import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 2525,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendInvitationEmail(
    toEmail: string,
    documentTitle: string,
    shareToken: string,
  ) {
    const inviteLink = `${process.env.FRONTEND_URL}/doc/${shareToken}`;

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: toEmail,
      subject: `You've been invited to collaborate on "${documentTitle}"`,
      html: `
        <h2>Document Collaboration Invitation</h2>
        <p>You've been invited to collaborate on the document: <strong>${documentTitle}</strong></p>
        <p>Click the link below to access the document:</p>
        <a href="${inviteLink}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
        ">Access Document</a>
        <p>Or copy this link: ${inviteLink}</p>
        <p>This invitation was sent from CollabDocs.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
