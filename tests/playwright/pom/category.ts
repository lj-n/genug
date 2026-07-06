import { expect, type Page } from '@playwright/test';

import { BasePage } from './base-page';

export class CategoryPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	async create(name: string) {
		await this.page.getByRole('button', { name: 'Create Category' }).click();

		const input = this.page.getByRole('textbox', { name: 'Category Name' });
		await input.fill(name);
		await input.press('Enter');

		await expect(this.page.getByRole('link', { exact: true, name })).toBeVisible();
	}

	async editName(currentName: string, newName: string) {
		// Budget nav links share names with categories; disambiguate by href.
		await this.page
			.getByRole('link', { exact: true, name: currentName })
			.and(this.page.locator('[href*="/categories/"]'))
			.click();

		const dialog = this.page.getByRole('dialog');
		await expect(dialog).toBeVisible();

		const nameInput = dialog.getByRole('textbox', { name: 'Category Name' });
		await expect(nameInput).toHaveValue(currentName);
		await nameInput.clear();
		await nameInput.fill(newName);
		await nameInput.blur();

		await expect(dialog.getByText('Saved')).toBeVisible();

		// The "Saved" toast uses a Svelte fly transition (200ms). Wait for
		// all animations inside the dialog to finish so the close button is
		// stable and not covered by a still-moving toast element.
		await this.page.waitForFunction(
			(dialogEl) => {
				if (!dialogEl) return true;
				return dialogEl
					.getAnimations({ subtree: true })
					.every((a: Animation) => a.playState !== 'running');
			},
			await dialog.elementHandle()
		);

		await dialog.getByRole('button', { name: 'Close' }).first().click();
		await expect(dialog).not.toBeVisible();

		await expect(this.page.getByRole('link', { exact: true, name: newName })).toBeVisible();
	}
}
