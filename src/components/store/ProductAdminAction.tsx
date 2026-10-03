"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AdminAction.module.css";
export default function ProductAdminAction({ productId, action, label }: { productId: string; action: "publish" | "archive" | "move_up" | "move_down"; label: string }): React.ReactElement { const router = useRouter(); const [message, setMessage] = useState(""); async function run(): Promise<void> { const response = await fetch("/api/store/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, action }) }); const body = await response.json() as { error?: string }; setMessage(response.ok ? "Done" : body.error ?? "Failed"); if (response.ok) router.refresh(); } return <span className={styles.form}><button type="button" onClick={run}>{label}</button>{message && <small>{message}</small>}</span>; }
