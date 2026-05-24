/* eslint-disable @typescript-eslint/no-explicit-any */
export function debounce(callback: (...args: any[]) => void, time: number) {
	let timeoutId: NodeJS.Timeout;
	return (...args: any[]) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => callback(...args), time);
	};
}
