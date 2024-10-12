import { getAccounts } from "$lib/server/accounts";
import { protectRoute } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { getTeam, getTeamRole, getTeams } from "$lib/server/teams";
import { fail, message, superValidate } from "sveltekit-superforms";
import type { Actions, PageServerLoad } from "./$types";
import { zod } from "sveltekit-superforms/adapters";
import { createAccountFormSchema } from "./schema";
import { schema } from "$lib/server/schema";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = protectRoute(async (_, user) => {
    return {
        teams: getTeams(db, user.id)
            .map(({ team }) => getTeam(db, team.id))
            .filter((team) => team !== undefined),
        form: await superValidate(zod(createAccountFormSchema)),
        initialTeamSelect: Number(null)
    }
})


export const actions = {
    default: protectRoute(async ({ request, cookies }, user) => {
        const form = await superValidate(request, zod(createAccountFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { accountName, accountDescription, teamId } = form.data;

		let account: typeof schema.account.$inferSelect;
		try {
			if (teamId) {
				const role = getTeamRole(db, teamId, user.id);
				if (role !== 'OWNER') {
					return message(
						form,
						{
							type: 'error',
							text: 'You do not have permission to create an account in this team.'
						},
						{ status: 403 }
					);
				}
			}

			account = db
				.insert(schema.account)
				.values({
					userId: user.id,
					name: accountName,
					description: accountDescription,
					teamId
				})
				.returning()
				.get();
		} catch (error) {
			return message(
				form,
				{
					type: 'error',
					text: 'Something went wrong, sorry.'
				},
				{ status: 500 }
			);
		}

		if (cookies.get('shallowRoute')) {
			redirect(302, cookies.get('shallowRoute')!);
		}

		redirect(302, `/accounts/${account.id}`);
    })
} satisfies Actions