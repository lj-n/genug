import { db } from '$lib/server/db';
import { icons } from 'feather-icons';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ setHeaders, url }) => {
	const userId = url.searchParams.get('u');

	const defaultAvatar = icons.smile.toSvg({ width: '14px' });

	if (!userId) {
		setHeaders({ 'Content-Type': 'image/svg+xml' });
		return new Response(defaultAvatar);
	}

	const avatar = avatarQuery.get({ userId });

	const imageBlob = avatar?.image;
	const imageType = avatar?.imageType;

	if (!imageBlob || !imageType) {
		setHeaders({ 'Content-Type': 'image/svg+xml' });
		return new Response(defaultAvatar);
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
