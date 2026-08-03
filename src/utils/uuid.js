/**
 * Validates whether a given string is a valid UUID (v1-v5).
 * Useful for checking Supabase Auth user IDs before inserting into database foreign keys.
 * 
 * @param {string} id 
 * @returns {boolean}
 */
export const isValidUUID = (id) => {
  if (!id || typeof id !== 'string') return false;
  if (id === '00000000-0000-0000-0000-000000000000') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};
