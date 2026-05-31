/** Tactile film-grain + soft vignette over the whole app — the "handcrafted" base layer. */
export function Texture() {
  return (
    <>
      <div className="texture-grain" aria-hidden />
      <div className="texture-vignette" aria-hidden />
    </>
  );
}
