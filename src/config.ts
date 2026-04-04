import * as path from 'node:path';
import * as dotenv from 'dotenv';

const ROOT_DIR = path.resolve(import.meta.dirname, '../');

class Configuration {
    readonly username: string;
    readonly password: string;

    readonly authToken: string;

    private static instance: Configuration | undefined;

    private constructor() {
        console.log(path.resolve(ROOT_DIR, '.env'));
        dotenv.config({ path: path.resolve(ROOT_DIR, '.env'), quiet: true });

        this.validateEnvVariables();

        this.username = process.env.USERNAME!;
        this.password = process.env.PASSWORD!;

        this.authToken = process.env.AUTH_TOKEN!;
    }

    public static getInstance(): Configuration {
        Configuration.instance ??= new Configuration();

        return Configuration.instance;
    }

    private validateEnvVariables(): void {
        const requiredVars = ['USERNAME', 'PASSWORD', 'AUTH_TOKEN'];

        const missingVars = requiredVars.filter((key) => !process.env[key]);
        if (missingVars.length > 0) {
            throw new Error(`Configuration Error: Missing required environment variables: ${missingVars.join(', ')}`);
        }
    }
}

export const config = Configuration.getInstance();
