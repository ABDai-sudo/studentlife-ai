/** Static campus silhouette — architectural, not cartoon. */
export function LoginCampusScene() {
  return (
    <svg
      className="login-campus-scene"
      viewBox="0 0 720 900"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="loginSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="720" height="900" fill="url(#loginSky)" />
      <g fill="currentColor" opacity="0.18">
        <rect x="72" y="318" width="168" height="268" rx="4" />
        <rect x="258" y="268" width="132" height="318" rx="4" />
        <rect x="408" y="338" width="198" height="248" rx="4" />
        <rect x="92" y="292" width="22" height="86" rx="2" />
        <rect x="286" y="232" width="18" height="54" rx="2" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.28">
        <path d="M40 586 H680" />
        <path d="M118 360 v180 M150 360 v180 M182 360 v180" />
        <path d="M286 318 v200 M318 318 v200 M350 318 v200" />
        <path d="M448 372 v170 M480 372 v170 M512 372 v170 M544 372 v170" />
        <path d="M258 268 l66 -46 66 46" />
      </g>
      <g fill="currentColor" opacity="0.12">
        <ellipse cx="168" cy="612" rx="46" ry="14" />
        <ellipse cx="546" cy="618" rx="58" ry="16" />
        <rect x="148" y="538" width="8" height="74" rx="2" />
        <rect x="528" y="528" width="8" height="88" rx="2" />
        <circle cx="152" cy="522" r="28" />
        <circle cx="532" cy="508" r="34" />
      </g>
      <rect
        x="0"
        y="586"
        width="720"
        height="314"
        fill="currentColor"
        opacity="0.07"
      />
    </svg>
  );
}
