/** @type {import('next').NextConfig} */
const nextConfig = {
	reactCompiler: true,
	output: "standalone",
	outputFileTracingIncludes: { "/*": ["./designs/**/*"] },
	transpilePackages: ["next-auth"]
};

export default nextConfig;
