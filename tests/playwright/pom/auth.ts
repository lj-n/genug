import { faker } from '@faker-js/faker';
import { expect } from '@playwright/test';

import { BasePage } from './base-page';

export class AuthPage extends BasePage {
	readonly admin = ['Admin', '1234admin!$5678'] as const;

	async createAdmin(username = this.admin[0], password = this.admin[1]) {
		await this.page.goto('/login/first');

		await this.page.getByLabel('Username').click();
		await this.page.getByLabel('Username').fill(username);
		await this.page.getByLabel('Password').click();
		await this.page.getByLabel('Password').fill(password);

		await this.page.getByRole('button', { name: 'Create Admin' }).click();

		await expect(
			this.page.getByRole('heading', { name: 'Create Your First Budget Plan' })
		).toBeVisible();

		return [username, password] as const;
	}

	async createUser(username = faker.string.alphanumeric(8).toUpperCase()) {
		await this.page.goto('/admin');
		await this.page.getByLabel('Username').click();
		await this.page.getByLabel('Username').fill(username);
		await this.page.getByRole('button', { name: 'Create User' }).click();

		const passwordLocator = this.page.getByLabel('generated-password');
		await expect(passwordLocator).toBeVisible();

		await this.page.getByRole('button', { name: 'Close' }).first().click();

		await expect(this.page.getByText(username)).toBeVisible();

		const password = await passwordLocator.textContent();

		if (!password) throw new Error('Could not copy password');

		return [username, password] as const;
	}

	async createUserAndLogin(username = faker.string.alphanumeric(8).toUpperCase()) {
		await this.login(...this.admin);
		const user = await this.createUser(username);
		await this.signout();
		await this.login(...user);
		return user;
	}

	async login(username: string, password: string) {
		await this.page.goto('/login');

		await this.page.getByLabel('Username').click();
		await this.page.getByLabel('Username').fill(username);
		await this.page.getByLabel('Password').click();
		await this.page.getByLabel('Password').fill(password);

		await this.page.getByRole('button', { name: 'Login' }).click();

		if (!this.isDesktop) {
			await this.openMobileNavigation();
		}

		await expect(this.page.getByRole('button', { name: 'Sign out' })).toBeVisible();
	}

	async signout() {
		if (!this.isDesktop) {
			await this.openMobileNavigation();
		}
		await this.page.getByRole('button', { name: 'Sign out' }).click();
	}
}
