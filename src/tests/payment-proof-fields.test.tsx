// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PaymentProofFields from "@/components/store/PaymentProofFields";

afterEach(cleanup);
it("preserves accessible labels, validation and multipart field names", () => {
	render(
		createElement(
			"form",
			{},
			createElement(PaymentProofFields, {
				file: null,
				onFileChange: vi.fn(),
				disabled: false
			})
		)
	);
	const utr = screen.getByLabelText(
		"UTR / reference number"
	) as HTMLInputElement;
	expect(utr.name).toBe("utr");
	expect(utr.required).toBe(true);
	expect(utr.minLength).toBe(6);
	expect(utr.maxLength).toBe(40);
	const payer = screen.getByLabelText("Payer name") as HTMLInputElement;
	expect(payer.name).toBe("payerName");
	expect(payer.minLength).toBe(2);
	const date = screen.getByLabelText(
		"Transaction date and time"
	) as HTMLInputElement;
	expect(date.name).toBe("transactionAt");
	expect(date.type).toBe("datetime-local");
	expect(date.required).toBe(true);
});
