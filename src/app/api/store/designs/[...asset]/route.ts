import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { designDirectory, imageTypes } from "@/lib/store/design-files";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ asset: string[] }> }
): Promise<Response> {
	const { asset } = await params;
	if (
		asset.length !== 2 ||
		asset.some(
			(part) => !part || part === "." || part === ".." || /[/\\:\0]/.test(part)
		)
	)
		return new Response(null, { status: 404 });
	const contentType = imageTypes[path.extname(asset[1]).toLowerCase()];
	if (!contentType) return new Response(null, { status: 404 });
	try {
		const root = await realpath(path.join(designDirectory, "artwork"));
		const target = await realpath(path.join(root, ...asset));
		const relative = path.relative(root, target);
		if (relative.startsWith("..") || path.isAbsolute(relative))
			return new Response(null, { status: 404 });
		const bytes = await readFile(target);
		return new Response(bytes, {
			headers: {
				"Content-Type": contentType,
				"X-Content-Type-Options": "nosniff",
				"Cache-Control": "no-cache"
			}
		});
	} catch (error) {
		if (
			["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")
		)
			return new Response(null, { status: 404 });
		throw error;
	}
}
