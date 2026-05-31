import { env } from '$env/dynamic/private';
import pino from 'pino';

export const logger = pino({
	level: env.LOG_LEVEL ?? 'info',
	...(env.NODE_ENV !== 'production' && { transport: { target: 'pino-pretty' } })
});
