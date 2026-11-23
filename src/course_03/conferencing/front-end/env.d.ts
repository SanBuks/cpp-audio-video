/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_SIGNALING_SERVER_IP: string;
  readonly VITE_APP_SIGNALING_SERVER_PORT: number;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
