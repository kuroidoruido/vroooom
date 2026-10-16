export const environment = {
  production: false,
  appVersion: '0.1.0',
  apiUrl: 'http://127.0.0.1:8080/api',
  argon2: {
    memory: 21504, // 21 MB (reduced for dev if needed)
    iterations: 2,
    parallelism: 2
  }
};
