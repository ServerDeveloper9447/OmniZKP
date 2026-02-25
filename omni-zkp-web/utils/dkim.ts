import PostalMime from 'postal-mime';

export const parseEmailDKIM = async (file: File) => {
  const parser = new PostalMime();
  const email = await parser.parse(file);
  
  // Extract Headers
  const headers = email.headers;
  let dkimSignature = "";
  let fromDomain = "";

  // 1. Find DKIM-Signature Header
  for (const h of headers) {
    if (h.key.toLowerCase() === 'dkim-signature') {
      dkimSignature = h.value as string;
      break;
    }
  }

  // 2. Extract "From" Domain
  if (email.from && email.from.length > 0) {
    const address = email.from[0].address;
    fromDomain = address.split('@')[1];
  }

  // 3. Extract the 'd=' tag from DKIM signature (The signing domain)
  // Example header: v=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; ...
  const dTagMatch = dkimSignature.match(/d=([^;]+)/);
  const signingDomain = dTagMatch ? dTagMatch[1].trim() : null;

  if (!dkimSignature) {
    throw new Error("No DKIM Signature found in this email.");
  }

  return {
    subject: email.subject,
    from: fromDomain,
    signer: signingDomain, // This is what we prove! (e.g., "google.com")
    isValid: signingDomain === fromDomain || signingDomain?.endsWith("." + fromDomain) // Simple alignment check
  };
};