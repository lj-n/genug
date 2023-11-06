/**
 * Get a list of the last `n` months.
 */
export function getLastMonthsNames(n = 12): { name: string; date: string }[] {
	const currentDate = new Date();
	const months: { name: string; date: string }[] = [];

	for (let i = 0; i < n; i++) {
		months.push({
			name: currentDate.toLocaleString('default', { month: 'long' }),
			date: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
				.toString()
				.padStart(2, '0')}`
		});
		currentDate.setMonth(currentDate.getMonth() - 1);
	}

	return months;
}
