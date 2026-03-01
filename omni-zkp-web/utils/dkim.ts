import PostalMime from 'postal-mime';

export const parseEmailDKIM = async (file: File) => {
  const parser = new PostalMime();
  const email = await parser.parse(file as any);
  
  let dkimSignature = "";
  for (const h of email.headers) {
    if (h.key.toLowerCase() === 'dkim-signature') {
      dkimSignature = h.value as string;
      break;
    }
  }

  const dTagMatch = dkimSignature.match(/d=([^;]+)/);
  const signingDomain = dTagMatch ? dTagMatch[1].trim() : null;

  if (!dkimSignature) throw new Error("No DKIM Signature found.");

  return { signer: signingDomain };
};