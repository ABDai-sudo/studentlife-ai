import { LOGIN_ARTWORK } from "@/lib/avatar/login-preview";

/** Static dusk campus plate — photographic, not a geometric silhouette. */
export function LoginCampusScene() {
  return (
    <div className="login-campus-scene" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGIN_ARTWORK.campus}
        alt=""
        className="login-campus-photo"
        width={768}
        height={1024}
        decoding="sync"
        fetchPriority="high"
      />
    </div>
  );
}
