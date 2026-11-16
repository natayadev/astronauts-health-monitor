/**
 * Plate.tsx · The frame behind the figure: figure number, title and one readout line. Server-safe.
 */
export function Plate({ readout }: { readout: string }) {
  return (
    <div className="twin-plate">
      <span className="twin-plate-fig">Fig 1</span>
      <span className="twin-plate-title">Suit checkout stand</span>
      <span className="twin-plate-readout" data-readout="">{readout}</span>
    </div>
  );
}
