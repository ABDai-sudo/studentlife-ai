import Script from "next/script";

/**
 * Official Microsoft Clarity manual tracking snippet.
 * Clarity project Settings > Setup > Get tracking code
 * https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
 *
 * Exact tag URL form: https://www.clarity.ms/tag/{projectId}
 * (no NPM ?ref=npm suffix)
 */
export function MicrosoftClarity() {
  if (process.env.NODE_ENV !== "production") return null;

  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() ?? "";
  if (!/^[a-z0-9]+$/i.test(projectId)) return null;

  const snippet = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${projectId}");`;

  return (
    <Script id="microsoft-clarity" strategy="beforeInteractive">
      {snippet}
    </Script>
  );
}
