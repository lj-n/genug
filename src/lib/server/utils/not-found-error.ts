export class NotFoundError extends Error {
	status = 404;

	constructor() {
		super('Not found');
		this.name = 'NotFoundError';
	}
}
