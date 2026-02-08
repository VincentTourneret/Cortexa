import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail,
} from "@getbrevo/brevo";

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

const getSender = () => {
  const from = process.env.BREVO_SENDER_EMAIL;
  const name = process.env.BREVO_SENDER_NAME || "Cortexa Support";
  if (!from) {
    throw new Error("BREVO_SENDER_EMAIL est requis. Configurez-le dans .env.local");
  }
  return { name, email: from };
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Confirmez votre adresse email</h2>
      <p>Merci de vous être inscrit sur Cortexa via Ju.</p>
      <p>Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">
        Confirmer mon email
      </a>
      <p>Ou copiez ce lien dans votre navigateur :</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
    </div>
  `;

  const sendSmtpEmail = new SendSmtpEmail();
  sendSmtpEmail.subject = "Confirmation de votre compte Cortexa";
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = getSender();
  sendSmtpEmail.to = [{ email }];

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Vous avez demandé une réinitialisation de mot de passe pour votre compte Cortexa.</p>
      <p>Pour définir un nouveau mot de passe, cliquez sur le lien ci-dessous :</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">
        Réinitialiser mon mot de passe
      </a>
      <p>Ce lien expirera dans 1 heure.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    </div>
  `;

  const sendSmtpEmail = new SendSmtpEmail();
  sendSmtpEmail.subject = "Réinitialisation de votre mot de passe Cortexa";
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = getSender();
  sendSmtpEmail.to = [{ email }];

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

export const sendGroupInvitationEmail = async (email: string, groupName: string, inviteLink: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Invitation à rejoindre un groupe</h2>
      <p>Vous avez été invité à rejoindre le groupe <strong>${groupName}</strong> sur Cortexa.</p>
      <p>Pour accepter l'invitation, cliquez sur le bouton ci-dessous :</p>
      <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">
        Rejoindre le groupe
      </a>
      <p>Ou copiez ce lien dans votre navigateur :</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
      <p>Si vous n'avez pas de compte, vous serez invité à en créer un rapidement.</p>
    </div>
  `;

  const sendSmtpEmail = new SendSmtpEmail();
  sendSmtpEmail.subject = `Invitation à rejoindre le groupe ${groupName}`;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = getSender();
  sendSmtpEmail.to = [{ email }];

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

export const sendShareInvitationEmail = async (email: string, resourceName: string, inviteLink: string, isFolder: boolean) => {
  const resourceType = isFolder ? "dossier" : "document";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Partage de ${resourceType}</h2>
      <p>On vous a partagé le ${resourceType} <strong>${resourceName}</strong> sur Cortexa.</p>
      <p>Pour y accéder, cliquez sur le bouton ci-dessous :</p>
      <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">
        Voir le ${resourceType}
      </a>
      <p>Ou copiez ce lien dans votre navigateur :</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
    </div>
  `;

  const sendSmtpEmail = new SendSmtpEmail();
  sendSmtpEmail.subject = `Partage de document : ${resourceName}`;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = getSender();
  sendSmtpEmail.to = [{ email }];

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};
