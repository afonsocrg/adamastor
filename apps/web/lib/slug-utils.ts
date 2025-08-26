/**
 * Shared slug utilities that work in both server and client environments
 * These functions contain no server-specific or client-specific code
 */

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
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
}

/**
 * Generates a URL-friendly slug from a title
 * This is a pure function that works in both server and client environments
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
 * Validates if a slug format is acceptable
 * This is a pure function that works in both server and client environments
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