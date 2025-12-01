import { createClient } from './supabase/server';

/**
 * Portuguese character mapping for proper slug generation
 */
const PORTUGUESE_CHAR_MAP: Record<string, string> = {
  // Vowels with tilde
  'ã': 'a', 'Ã': 'A',
  'ẽ': 'e', 'Ẽ': 'E', 
  'ĩ': 'i', 'Ĩ': 'I',
  'õ': 'o', 'Õ': 'O',
  'ũ': 'u', 'Ũ': 'U',
  
  // Vowels with acute accent
  'á': 'a', 'Á': 'A',
  'é': 'e', 'É': 'E',
  'í': 'i', 'Í': 'I', 
  'ó': 'o', 'Ó': 'O',
  'ú': 'u', 'Ú': 'U',
  
  // Vowels with grave accent
  'à': 'a', 'À': 'A',
  'è': 'e', 'È': 'E',
  'ì': 'i', 'Ì': 'I',
  'ò': 'o', 'Ò': 'O',
  'ù': 'u', 'Ù': 'U',
  
  // Vowels with circumflex
  'â': 'a', 'Â': 'A',
  'ê': 'e', 'Ê': 'E',
  'î': 'i', 'Î': 'I',
  'ô': 'o', 'Ô': 'O',
  'û': 'u', 'Û': 'U',
  
  // Vowels with diaeresis
  'ä': 'a', 'Ä': 'A',
  'ë': 'e', 'Ë': 'E',
  'ï': 'i', 'Ï': 'I',
  'ö': 'o', 'Ö': 'O',
  'ü': 'u', 'Ü': 'U',
  
  // Cedilla
  'ç': 'c', 'Ç': 'C',
  
  // Other common characters
  'ñ': 'n', 'Ñ': 'N',
  'ý': 'y', 'Ý': 'Y',
};

/**
 * Normalizes Portuguese characters to ASCII equivalents
 */
function normalizePortugueseChars(text: string): string {
  let normalized = text;
  for (const [accented, base] of Object.entries(PORTUGUESE_CHAR_MAP)) {
    normalized = normalized.replace(new RegExp(accented, 'g'), base);
  }
  return normalized;
}

/**
 * Removes emojis and other Unicode symbols from text
 */
function removeEmojis(text: string): string {
  // Remove emojis, symbols, and other non-printable Unicode characters
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
}

/**
 * Generates a URL-friendly slug from a title
 * Handles Portuguese characters, emojis, and special characters
 */
export function generateSlug(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }

  let slug = title.trim();
  
  // Remove emojis first
  slug = removeEmojis(slug);
  
  // Normalize Portuguese characters
  slug = normalizePortugueseChars(slug);
  
  // Convert to lowercase
  slug = slug.toLowerCase();
  
  // Remove apostrophes (don't replace with hyphens)
  slug = slug.replace(/'/g, '');
  
  // Replace spaces and other special characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Replace multiple consecutive hyphens with single hyphen
  slug = slug.replace(/-+/g, '-');
  
  // Ensure slug isn't empty
  if (!slug) {
    slug = 'post';
  }
  
  return slug;
}

/**
 * Checks if a slug already exists in the database
 */
async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  let query = supabase
    .from('posts')
    .select('id')
    .eq('slug', slug);
    
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  
  const { data, error } = await query.single();
  
  // If there's an error (like no rows found), slug doesn't exist
  if (error) {
    return false;
  }
  
  // If we found a row, slug exists
  return !!data;
}

/**
 * Generates a unique slug by appending a number if necessary
 */
export async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let uniqueSlug = baseSlug;
  let counter = 2;
  
  // Check if base slug exists
  while (await slugExists(uniqueSlug, excludeId)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
}

/**
 * Generates a unique slug from a title
 * This is the main function to use when creating/updating posts
 */
export async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(title);
  return await ensureUniqueSlug(baseSlug, excludeId);
}

/**
 * Updates slug only if needed (when title changes and no custom slug exists)
 * Returns the current or new slug
 */
export async function updateSlugIfNeeded(postId: string, newTitle: string, currentSlug?: string): Promise<string> {
  // If there's no current slug, generate one from the new title
  if (!currentSlug) {
    return await generateUniqueSlug(newTitle, postId);
  }
  
  // If slug already exists, keep it (maintains link stability)
  // This assumes users have manually set a custom slug or we want to preserve existing slugs
  return currentSlug;
}

/**
 * Validates if a slug format is acceptable
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  // Check if slug contains only lowercase letters, numbers, and hyphens
  // Must not start or end with hyphen, and no consecutive hyphens
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
}