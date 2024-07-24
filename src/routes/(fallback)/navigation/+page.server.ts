import { protectRoute } from "$lib/server/auth";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = protectRoute(() => {})