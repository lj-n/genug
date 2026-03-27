import { encodeBase64 } from "@oslojs/encoding";

export function createSessionToken(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(12));
    return encodeBase64(randomBytes);
}

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;

    it("createSessionToken", () => {
        const token = createSessionToken();
        expect(token).toHaveLength(16);
        expect(token).toMatch(/^[A-Za-z0-9+/]+$/);
    });
}
