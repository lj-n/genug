export function createMonthParam(date = new Date()) {
	return date.getFullYear() * 100 + (date.getMonth() + 1);
}
