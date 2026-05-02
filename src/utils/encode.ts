/**
 * Form-urlencoded percent-encoder (UTF-8) used by the API before signing.
 *
 * Differences vs `encodeURIComponent`:
 *  - space -> "+"  (encodeURIComponent uses "%20")
 *  - "!", "'", "(", ")", "~" are percent-encoded here but kept by encodeURIComponent.
 *  - "*", "-", "_", "." are kept as-is.
 */
export const javaUrlEncode = (s: string): string =>
  encodeURIComponent(s)
    .replace(/%20/g, '+')
    .replace(/[!'()~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
