import { withAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { icons } from 'feather-icons';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = withAuth(({ setHeaders }, user) => {
	const profile = profileQuery.get({ userId: user.id });

	const imageBlob = profile?.image;
	const imageType = profile?.imageType;

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
});

const profileQuery = db.query.userProfile
	.findFirst({
		where: (profile, { eq, sql }) =>
			eq(profile.userId, sql.placeholder('userId'))
	})
	.prepare();
