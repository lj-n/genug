import { SMTP_PASSWORD, SMTP_URL, SMTP_USER } from '$env/static/private';
import { dev } from '$app/environment';
import Nodemailer from 'nodemailer';
import type { User } from 'lucia';

const TRANSPORTER = Nodemailer.createTransport({
	host: SMTP_URL,
	port: 465,
	secure: true,
	auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
});

export async function sendMail(options: {
	from: string;
	to: string;
	subject: string;
	html: string;
}) {
	const info = await TRANSPORTER.sendMail(options);
	return info.messageId;
}

export async function sendEmailVerificationLink(user: User, token: string) {
	const base = dev ? 'http://localhost:5173' : 'https://real-url.com';
	const url = new URL('/email-verification', base);
	url.searchParams.set('token', token);

	const html = `
		<p>Hi ${user.name} 👋,</p>
		<p>Please verify your email address by clicking the link below.</p>
		<a href="${url.href}">Verify your email address</a>
	`;

	try {
		await sendMail({
			from: '"genug.app" <verify@genug.app>',
			to: user.email,
			subject: 'Verify your email address',
			html
		});
	} catch (error) {
		console.log('🛸 < file: email.ts:41 < error =', error);
	}
}

export async function sendPasswordResetLink(user: User, token: string) {
	const base = dev ? 'http://localhost:5173' : 'https://real-url.com';
	const url = new URL(`/password-reset/${token}`, base);

	const html = `
		<p>Hi ${user.name} 👋,</p>
		<p>Click the link below to reset your password.</p>
		<a href="${url.href}">Reset your password</a>
	`;

	try {
		await sendMail({
			from: '"genug.app" <password-reset@genug.app>',
			to: user.email,
			subject: 'Reset your password',
			html
		});
	} catch (error) {
		console.log('🛸 < file: email.ts:64 < error =', error);
	}
}

export function isValidEmailAddress(email: unknown) {
	return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
