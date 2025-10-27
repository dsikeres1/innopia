const nextConfig = {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH,
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
                pathname: '/t/p/**',
            },
            {
                protocol: 'https',
                hostname: '**.samplelib.com',
            },
            {
                protocol: 'https',
                hostname: '**.mux.dev',
            },
            {
                protocol: 'https',
                hostname: '**.videodelivery.net',
            },
            {
                protocol: 'https',
                hostname: 'dummyimage.com',
            },
            {
                protocol: 'https',
                hostname: 'asset.innopia.org'
            },
        ],
        domains: ["loremflickr.com", "d4mcg1l3fmmr.cloudfront.net", "picsum.photos"],
    },
};

export default nextConfig;