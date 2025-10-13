export const Options = {
    routePrefix: '/docs',
    exposeRoute: true,
    swagger: {
        info: {
            title: 'Volt Backend ',
            description: 'Building the Volt Backend V1',
            version: '2.0.0',
        },
        securityDefinitions: {
            bearerAuth: {
                type: 'apiKey' as const,
                name: 'Authorization',
                in: 'header',
                description: 'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"',
            },
        },
        externalDocs: {
            url: 'https://swagger.io',
            description: 'Find more info here',
        },
        host: 'localhost:8080',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
    },
};
