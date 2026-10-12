/** @type {import('next').NextConfig} */
const nextConfig = {
	reactCompiler: true,
	output: "standalone",
	outputFileTracingIncludes: { "/*": ["./designs/**/*"] }
};

export default nextConfig;
