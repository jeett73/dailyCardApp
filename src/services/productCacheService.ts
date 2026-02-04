import { getItem, setItem } from './storage';

const PRODUCT_CACHE_KEY = 'cached_shop_products';

export type CachedProduct = {
    _id?: any;
    productId: string;
    price: number;
    productName?: string;
    icon: string;
};

/**
 * Get cached products from storage
 * Returns null if cache doesn't exist or is invalid
 */
export async function getCachedProducts(): Promise<CachedProduct[] | null> {
    try {
        const cached = await getItem(PRODUCT_CACHE_KEY);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        if (!Array.isArray(parsed)) return null;

        return parsed;
    } catch (error) {
        console.error('Error reading product cache:', error);
        return null;
    }
}

/**
 * Store products in cache
 */
export async function setCachedProducts(products: CachedProduct[]): Promise<void> {
    try {
        await setItem(PRODUCT_CACHE_KEY, JSON.stringify(products));
    } catch (error) {
        console.error('Error setting product cache:', error);
    }
}

/**
 * Clear product cache
 * Useful for logout or manual refresh scenarios
 */
export async function clearProductCache(): Promise<void> {
    try {
        await setItem(PRODUCT_CACHE_KEY, '');
    } catch (error) {
        console.error('Error clearing product cache:', error);
    }
}
