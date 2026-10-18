"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { tagManager, tagManagerOpPad } from "@/config";

export const TOESTEMMING_SLEUTEL = "tk-cookies"; // "ja" | "nee"

/**
 * Google Tag Manager met Consent Mode v2: standaard staat alles wat cookies
 * plaatst uit. Heeft de bezoeker eerder "Accepteren" gekozen, dan gaat het
 * direct aan; anders pas na een keuze in de cookiemelding.
 */
export function TagManager() {
  const pad = usePathname();
  if (!tagManagerOpPad(pad)) return null;
  const code = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
try{if(localStorage.getItem('${TOESTEMMING_SLEUTEL}')==='ja'){gtag('consent','update',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});}}catch(e){}
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${tagManager.id}');`;
  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {code}
    </Script>
  );
}
