// @vitest-environment jsdom
import { createElement } from "react";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import AccountControls from "@/components/AccountControls";
const { signIn, signOut } = vi.hoisted(() => ({
	signIn: vi.fn(),
	signOut: vi.fn()
}));
vi.mock("next-auth/react", () => ({ signIn, signOut }));
afterEach(() => {
	cleanup();
	vi.resetAllMocks();
});
it("starts Google login and returns to the current page", async () => {
	render(
		createElement(AccountControls, { signedIn: false, returnTo: "/store/cart" })
	);
	fireEvent.click(screen.getByRole("button", { name: "Log in with Google" }));
	await waitFor(() =>
		expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/store/cart" })
	);
});
it("logs out through Auth.js and returns to the public store", async () => {
	render(
		createElement(AccountControls, { signedIn: true, returnTo: "/store/orders" })
	);
	fireEvent.click(screen.getByRole("button", { name: "Log out" }));
	await waitFor(() =>
		expect(signOut).toHaveBeenCalledWith({ redirectTo: "/store" })
	);
});
it("reports a connection failure without leaving the button disabled", async () => {
	signIn.mockRejectedValueOnce(new Error("offline"));
	render(
		createElement(AccountControls, { signedIn: false, returnTo: "/store" })
	);
	fireEvent.click(screen.getByRole("button", { name: "Log in with Google" }));
	expect(await screen.findByRole("alert")).toBeDefined();
	expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
});
