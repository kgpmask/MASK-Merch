// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductGallery from "@/components/store/ProductGallery";
import ProductSizeChart from "@/components/store/ProductSizeChart";

afterEach(cleanup);

describe("product images and size guide", () => {
	it("switches front/back views with accessible thumbnails and full-size links", () => {
		render(
			createElement(ProductGallery, {
				title: "Design 1",
				images: ["/front.png", "/back.png"]
			})
		);
		expect(screen.getByAltText("Design 1 — view 1").getAttribute("src")).toBe(
			"/front.png"
		);
		fireEvent.click(
			screen.getByRole("button", { name: "View Design 1 image 2" })
		);
		expect(screen.getByAltText("Design 1 — view 2").getAttribute("src")).toBe(
			"/back.png"
		);
		expect(
			screen
				.getByRole("link", { name: "Open Design 1 image 2 at full size" })
				.getAttribute("href")
		).toBe("/back.png");
	});
	it("shows a chart image and measurement table in the size guide", () => {
		render(
			createElement(ProductSizeChart, {
				title: "Design 1",
				chart: {
					image: "/chart.png",
					columns: ["Size", "Chest (cm)"],
					rows: [["M", "50"]],
					note: "Measured flat"
				}
			})
		);
		expect(screen.getByRole("heading", { name: "Size guide" })).toBeDefined();
		expect(
			screen.getByRole("columnheader", { name: "Chest (cm)" })
		).toBeDefined();
		expect(screen.getByRole("cell", { name: "50" })).toBeDefined();
		expect(screen.getByAltText("Design 1 size chart").getAttribute("src")).toBe(
			"/chart.png"
		);
		expect(screen.getByText("Measured flat")).toBeDefined();
	});
	it("cycles images from side arrows and keeps the selected thumbnail in sync", () => {
		render(
			createElement(ProductGallery, {
				title: "Design 1",
				images: ["/front.png", "/back.png"]
			})
		);
		fireEvent.click(screen.getByRole("button", { name: "Next image" }));
		expect(screen.getByAltText("Design 1 — view 2").getAttribute("src")).toBe(
			"/back.png"
		);
		expect(
			screen
				.getByRole("button", { name: "View Design 1 image 2" })
				.getAttribute("aria-pressed")
		).toBe("true");
		fireEvent.click(screen.getByRole("button", { name: "Next image" }));
		expect(screen.getByAltText("Design 1 — view 1").getAttribute("src")).toBe(
			"/front.png"
		);
		fireEvent.click(screen.getByRole("button", { name: "Previous image" }));
		expect(screen.getByAltText("Design 1 — view 2").getAttribute("src")).toBe(
			"/back.png"
		);
	});
	it("hides navigation arrows for a single picture", () => {
		render(
			createElement(ProductGallery, { title: "Design 1", images: ["/front.png"] })
		);
		expect(screen.queryByRole("button", { name: "Next image" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Previous image" })).toBeNull();
	});
	it("scrolls the image strip for arrows and thumbnails instead of replacing the picture", () => {
		render(
			createElement(ProductGallery, {
				title: "Design 1",
				images: ["/front.png", "/back.png"]
			})
		);
		const viewport = screen.getByRole("group", { name: "Product image slides" });
		const scrollTo = vi.fn();
		Object.defineProperty(viewport, "clientWidth", { value: 640 });
		Object.defineProperty(viewport, "scrollTo", { value: scrollTo });
		const firstImage = screen.getByAltText("Design 1 — view 1");
		fireEvent.click(screen.getByRole("button", { name: "Next image" }));
		expect(scrollTo).toHaveBeenLastCalledWith({ left: 640 });
		expect(screen.getByAltText("Design 1 — view 1")).toBe(firstImage);
		fireEvent.click(
			screen.getByRole("button", { name: "View Design 1 image 1" })
		);
		expect(scrollTo).toHaveBeenLastCalledWith({ left: 0 });
	});
});
