import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ setHeaders, url }) => {
	const userId = url.searchParams.get('u');

	if (!userId) {
		error(400, 'Missing user ID');
	}

	const avatar = avatarQuery.get({ userId });

	const imageBlob = avatar?.image;
	const imageType = avatar?.imageType;

	if (!imageBlob || !imageType) {
		error(404, 'Avatar not found')
	}

	setHeaders({
		'Content-Type': imageType,
		'Content-Length': imageBlob.byteLength.toString()
	});

	return new Response(imageBlob);
};

const avatarQuery = db.query.userAvatar
	.findFirst({
		where: (avatar, { eq, sql }) => eq(avatar.userId, sql.placeholder('userId'))
	})
	.prepare();
