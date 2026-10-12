"use client";
import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import styles from "./AccountControls.module.css";

export default function AccountControls({
	signedIn,
	returnTo
}: {
	signedIn: boolean;
	returnTo: string;
}): React.ReactElement {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	async function authenticate(): Promise<void> {
		setPending(true);
		setError(false);
		try {
			if (signedIn) await signOut({ redirectTo: "/store" });
			else await signIn("google", { redirectTo: returnTo });
		} catch {
			setError(true);
		} finally {
			setPending(false);
		}
	}
	return (
		<div className={styles.account}>
			<button
				type="button"
				onClick={authenticate}
				disabled={pending}
				aria-busy={pending}
			>
				{pending ? "Please wait…" : signedIn ? "Log out" : "Log in with Google"}
			</button>
			{error && <p role="alert">Could not connect. Please try again.</p>}
		</div>
	);
}
