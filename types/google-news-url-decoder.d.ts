declare module "google-news-url-decoder" {
  export class GoogleDecoder {
    decode(url: string): Promise<{ status?: boolean; decoded_url?: string; message?: string }>;
    decodeBatch(urls: string[]): Promise<
      Array<{ status?: boolean; decoded_url?: string; source_url?: string; message?: string }>
    >;
  }
}
