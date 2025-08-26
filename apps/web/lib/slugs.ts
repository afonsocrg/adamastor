import { createClient } from './supabase/server';
import { generateSlug, isValidSlug } from './slug-utils';

// Re-export the shared utilities so they can be imported from this module
export { generateSlug, isValidSlug };

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

