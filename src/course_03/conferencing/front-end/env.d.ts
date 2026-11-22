/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly APP_SIGNALING_SERVER_IP: string;
  readonly APP_SIGNALING_SERVER_PORT: number;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
