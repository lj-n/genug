import { protectRoute } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { icons } from 'feather-icons';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = protectRoute(
	({ setHeaders }, { userId }) => {
		const avatar = avatarQuery.get({ userId });

		const imageBlob = avatar?.image;
		const imageType = avatar?.imageType;

		if (!imageBlob || !imageType) {
			/** Return default user avatar */
			const svgString = icons.smile.toSvg({ width: '14px' });
			setHeaders({ 'Content-Type': 'image/svg+xml' });
			return new Response(svgString);
		}

		setHeaders({
			'Content-Type': imageType,
			'Content-Length': imageBlob.byteLength.toString()
		});

		return new Response(imageBlob);
	}
);

const avatarQuery = db.query.userAvatar
	.findFirst({
		where: (avatar, { eq, sql }) => eq(avatar.userId, sql.placeholder('userId'))
	})
	.prepare();
