import { json, type RequestHandler } from '@sveltejs/kit';
import Nodemailer from 'nodemailer';

export const GET: RequestHandler = async () => {
	const transporter = Nodemailer.createTransport({
		host: process.env.SMTP_URL,
		port: 465,
		secure: true,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASSWORD
		}
	});

	const info = await transporter.sendMail({
		from: '"Fred Foo 👻" <verify@genug.app>', // sender address
		to: 'linus.johannsen@outlook.com', // list of receivers
		subject: 'Hello ✔', // Subject line
		text: 'Hello world?', // plain text body
		html: '<b>Hello world?</b>' // html body
	});

	console.log('🛸 < info =', info);

	return json({ message: 'No Error!' });
};
