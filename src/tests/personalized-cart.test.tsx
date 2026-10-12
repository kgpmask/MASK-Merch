// @vitest-environment jsdom
import { createElement } from "react";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor
} from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import {
	CartProvider,
	useCart,
	type CartLine
} from "@/components/store/CartProvider";
import { cartLineKey } from "@/lib/store/personalization";

const base: CartLine = {
	variantId: "v1",
	productSlug: "1",
	productTitle: "Design 1",
	garmentType: "normal_tshirt",
	size: "M",
	colour: "Black",
	sku: "SKU",
	unitPricePaise: 59900,
	quantity: 1
};
function Harness(): React.ReactElement {
	const { lines, add, update, remove } = useCart();
	return (
		<>
			<button onClick={() => add({ ...base, backName: "Arul" })}>Add Arul</button>
			<button onClick={() => add({ ...base, backName: "MASK" })}>Add MASK</button>
			<button
				onClick={() => update(cartLineKey({ ...base, backName: "Arul" }), 3)}
			>
				Update Arul
			</button>
			<button onClick={() => remove(cartLineKey({ ...base, backName: "MASK" }))}>
				Remove MASK
			</button>
			<output>{JSON.stringify(lines)}</output>
		</>
	);
}
afterEach(() => {
	cleanup();
	localStorage.clear();
});
it("merges identical names, isolates quantity/removal and persists personalization", async () => {
	render(createElement(CartProvider, { children: createElement(Harness) }));
	await waitFor(() =>
		expect(localStorage.getItem("mask-merch-cart-v1")).toBe("[]")
	);
	fireEvent.click(screen.getByText("Add Arul"));
	fireEvent.click(screen.getByText("Add MASK"));
	fireEvent.click(screen.getByText("Add Arul"));
	let lines = JSON.parse(
		screen.getByRole("status").textContent ?? "[]"
	) as CartLine[];
	expect(lines.map((line) => [line.backName, line.quantity])).toEqual([
		["Arul", 2],
		["MASK", 1]
	]);
	fireEvent.click(screen.getByText("Update Arul"));
	fireEvent.click(screen.getByText("Remove MASK"));
	lines = JSON.parse(
		screen.getByRole("status").textContent ?? "[]"
	) as CartLine[];
	expect(lines.map((line) => [line.backName, line.quantity])).toEqual([
		["Arul", 3]
	]);
	await waitFor(() =>
		expect(
			JSON.parse(localStorage.getItem("mask-merch-cart-v1") ?? "[]")
		).toEqual(lines)
	);
});
