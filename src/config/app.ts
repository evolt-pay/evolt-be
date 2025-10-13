import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in .env');
}


export const config = {
    app: {
        port: 8080,
    },
    jwt: {
        secret: process.env.JWT_SECRET!,
        sign: { expiresIn: '1h' },
    }
}
