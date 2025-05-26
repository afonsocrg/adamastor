export interface MetadataResult {
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogType?: string;
  ogImage?: Array<{
    url: string;
    width?: string;
    height?: string;
    type?: string;
  }>;
  ogSiteName?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: Array<{
    url: string;
    width?: string;
    height?: string;
    alt?: string;
  }>;
  // requestUrl: string;
  // success: boolean;

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
}
