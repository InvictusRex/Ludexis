// Shown while the session is checked, so pages never flash a signed-out state.
export function BootScreen() {
  return (
    <div className="grid min-h-dvh place-items-center bg-night" role="status" aria-label="Loading Ludexis">
      <img
        src="/brand/shield.png"
        alt=""
        width={72}
        height={72}
        className="size-[72px] motion-safe:animate-[mark-pulse_1.6s_ease-in-out_infinite]"
      />
    </div>
  );
}
