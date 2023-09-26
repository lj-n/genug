import { SMTP_PASSWORD, SMTP_URL, SMTP_USER } from '$env/static/private';
import Nodemailer from 'nodemailer';
import { render } from 'svelte-email';

import EmailVerification from '$lib/mails/EmailVerification.svelte';

export const sendEmailVerificationLink = async (token: string) => {
	const url = `http://localhost:5173/email-verification/${token}`;
	console.log(`Your email verification link: ${url}`);
};

export const sendPasswordResetLink = async (token: string) => {
	const url = `http://localhost:5173/password-reset/${token}`;
	console.log(`Your password reset link: ${url}`);
};

export const isValidEmail = (maybeEmail: unknown): maybeEmail is string => {
	if (typeof maybeEmail !== 'string') return false;
	if (maybeEmail.length > 255) return false;
	const emailRegexp = /^.+@.+$/; // [one or more character]@[one or more character]
	return emailRegexp.test(maybeEmail);
};

const transporter = Nodemailer.createTransport({
	host: SMTP_URL,
	port: 465,
	secure: true,
	auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
});

export async function sendEmailVerificationMail(user: Lucia.DatabaseUserAttributes, token: string) {
	const { email } = user;

	const emailHtml = render({
		template: EmailVerification,
		props: {
			name: user.name,
			token
		}
	});

	const options = {
		from: '"genug.app" <verify@genug.app>',
		to: email,
		subject: 'Verify your email address',
		html: emailHtml
	};

	return await transporter.sendMail(options);
}
