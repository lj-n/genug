import { SOURCE_REPOSITORY_URL } from '$lib/constants';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import SourceLink from './source-link.svelte';

describe('SourceLink', () => {
	it('links to the public source repository in a new tab', () => {
		render(SourceLink);

		const link = screen.getByRole('link', { name: 'Source code' });
		expect(link).toHaveAttribute('href', SOURCE_REPOSITORY_URL);
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});
});
