declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CLOUDFLARE_R2_ACCOUNT_ID?: string
      CLOUDFLARE_R2_ACCESS_KEY_ID?: string
      CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string
      CLOUDFLARE_R2_BUCKET_NAME?: string
      NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL?: string
    }
  }

  interface Process {
    env: NodeJS.ProcessEnv
  }

  const process: Process
}

export {}
