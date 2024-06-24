declare module 'ambient' {
  declare global {
    namespace NodeJS {
      interface ProcessEnv {
        JWT_SECRET_KEY: string;
        JWT_EXPIRES_IN: string;
        JWT_COOKIE_EXPIRES_IN: number;
        NODE_ENV: 'development' | 'production';
        PORT?: string;
        PWD: string;
        DATABASE: string;
        DATABASE_PASSWORD: string;
        EMAIL_USERNAME: string;
        EMAIL_PASSWORD: string;
        EMAIL_HOST: string;
        EMAIL_PORT: string;
      }
    }
  }
}
