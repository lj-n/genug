import z from "zod";

export const schema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters long")
        .max(25, "Username must be at most 25 characters long"),
    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(120, "Password must be at most 120 characters long"),
});
