/**
 * Generates an IFC-compatible GUID (base64-encoded 22 characters)
 * IFC uses a compressed GUID format based on base64 encoding
 */
export function generateIFCGuid(): string {
  // Characters used in IFC GUID encoding (base64 variant)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
  
  // Generate a random 22-character IFC GUID
  let guid = '';
  for (let i = 0; i < 22; i++) {
    guid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return guid;
}
