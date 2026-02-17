import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  twitterHandle?: string;
  jsonLd?: Record<string, unknown>;
  breadcrumbs?: BreadcrumbItem[];
}

const BASE_URL = 'https://4e3b7e75-c600-4d5e-9594-ee3d0c7c09a6.lovableproject.com';
const DEFAULT_IMAGE = '/nexus-touch-og.png';
const SITE_NAME = 'NexusTouch';
const DEFAULT_TWITTER_HANDLE = '@NexusTouch';

const getDefaultJsonLd = (title: string, description: string, url: string, image: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  description,
  url,
  image,
  applicationCategory: 'CreativeApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  creator: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
  },
});

const getBreadcrumbJsonLd = (breadcrumbs: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
  })),
});

export function SEOHead({
  title = 'NexusTouch - AI Creative Journey',
  description = 'Transform your imagination into stunning visuals with NexusTouch AI-powered creative platform. Generate images, create personas, and explore endless possibilities.',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  twitterHandle = DEFAULT_TWITTER_HANDLE,
  jsonLd,
  breadcrumbs,
}: SEOHeadProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = url || BASE_URL;
  const fullImageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;
  const structuredData = jsonLd || getDefaultJsonLd(fullTitle, description, canonicalUrl, fullImageUrl);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Breadcrumb Schema */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(getBreadcrumbJsonLd(breadcrumbs))}
        </script>
      )}
    </Helmet>
  );
}
