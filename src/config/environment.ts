interface Environment {
  API_BASE_URL: string;
  SOCKET_URL: string;
  MAPBOX_TOKEN: string;
  NODE_ENV: string;
}

const environment: Environment = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001',
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example',
  NODE_ENV: import.meta.env.MODE || 'development',
};

export default environment; 