import { useEffect } from 'react';

/**
 * SEOHelmet Component
 * Dynamically updates page metadata for SEO optimization
 * 
 * @param {string} title - Page title
 * @param {string} description - Page meta description
 * @param {string} keywords - Comma-separated keywords
 * @param {string} ogType - Open Graph type (website, article, etc.)
 * @param {string} ogImage - Open Graph image URL
 * @param {string} canonicalUrl - Canonical URL for the page
 * @param {boolean} noindex - Whether to prevent indexing (for private pages)
 * @param {object} structuredData - JSON-LD structured data object
 */
const SEOHelmet = ({
    title = 'FreelanceCo - Freelance Marketplace',
    description = 'Connect with top freelancers or find your next project on FreelanceCo. The premier platform for freelance work worldwide.',
    keywords = 'freelance, marketplace, freelancers, projects, hire, remote work, gig economy',
    ogType = 'website',
    ogImage = '/og-image.png',
    canonicalUrl = '',
    noindex = false,
    structuredData = null,
}) => {
    useEffect(() => {
        // Update page title
        document.title = title;

        // Helper function to update or create meta tags
        const updateMetaTag = (selector, attribute, value) => {
            let element = document.querySelector(selector);
            if (element) {
                element.setAttribute(attribute, value);
            } else {
                element = document.createElement('meta');
                const [attr, attrValue] = selector.replace(/[\[\]]/g, '').split('=');
                element.setAttribute(attr, attrValue.replace(/['"]/g, ''));
                element.setAttribute(attribute, value);
                document.head.appendChild(element);
            }
        };

        // Update basic meta tags
        updateMetaTag('[name="description"]', 'content', description);
        updateMetaTag('[name="keywords"]', 'content', keywords);

        // Update robots meta tag
        if (noindex) {
            updateMetaTag('[name="robots"]', 'content', 'noindex, nofollow');
        } else {
            updateMetaTag('[name="robots"]', 'content', 'index, follow');
        }

        // Update Open Graph tags
        updateMetaTag('[property="og:title"]', 'content', title);
        updateMetaTag('[property="og:description"]', 'content', description);
        updateMetaTag('[property="og:type"]', 'content', ogType);
        updateMetaTag('[property="og:image"]', 'content', ogImage);
        updateMetaTag('[property="og:url"]', 'content', canonicalUrl || window.location.href);

        // Update Twitter Card tags
        updateMetaTag('[name="twitter:title"]', 'content', title);
        updateMetaTag('[name="twitter:description"]', 'content', description);
        updateMetaTag('[name="twitter:image"]', 'content', ogImage);

        // Update canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        const finalCanonicalUrl = canonicalUrl || window.location.href;
        if (canonical) {
            canonical.setAttribute('href', finalCanonicalUrl);
        } else {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            canonical.setAttribute('href', finalCanonicalUrl);
            document.head.appendChild(canonical);
        }

        // Update structured data
        let scriptTag = document.querySelector('script[type="application/ld+json"]#dynamic-structured-data');
        if (structuredData) {
            if (scriptTag) {
                scriptTag.textContent = JSON.stringify(structuredData);
            } else {
                scriptTag = document.createElement('script');
                scriptTag.setAttribute('type', 'application/ld+json');
                scriptTag.setAttribute('id', 'dynamic-structured-data');
                scriptTag.textContent = JSON.stringify(structuredData);
                document.head.appendChild(scriptTag);
            }
        } else if (scriptTag) {
            scriptTag.remove();
        }
    }, [title, description, keywords, ogType, ogImage, canonicalUrl, noindex, structuredData]);

    return null; // This component doesn't render anything
};

export default SEOHelmet;
