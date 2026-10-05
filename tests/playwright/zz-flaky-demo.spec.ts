import { expect, test } from './fixture';

// Deliberately flaky (throwaway demo for #417): fails on the first attempt and
// passes on retry. Must never be merged.
test('deliberately flaky demo', async () => {
	expect(test.info().retry).toBe(1);
});
