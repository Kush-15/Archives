interface StationData {
  number: string;
  label: string;
  title: string;
  body: string;
  shape: 'circle' | 'square' | 'diamond' | 'hexagon';
}

export default function CraftsmanshipStation({ station }: { station: StationData }) {
  const shapeClipPath: Record<string, string> = {
    circle: 'circle(50% at 50% 50%)',
    square: 'inset(10% 10% 10% 10%)',
    diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  };

  return (
    <div className="craft-station">
      <div className="craft-station-number">{station.number}</div>

      <div
        className="craft-shape"
        style={{
          clipPath: shapeClipPath[station.shape],
          background: 'rgba(10, 10, 10, 0.04)',
          width: '280px',
          height: '280px',
          transition: 'clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      <div className="craft-station-content">
        <div className="craft-station-label">{station.label}</div>
        <h3 className="craft-station-title">{station.title}</h3>
        <p className="craft-station-body">{station.body}</p>
      </div>
    </div>
  );
}

export const STATIONS: StationData[] = [
  {
    number: '01',
    label: 'Step One',
    title: 'Source',
    body: 'Each camera arrives from estates, collections, and specialist dealers worldwide. We verify provenance and assess mechanical condition before a single tool touches the body.',
    shape: 'circle',
  },
  {
    number: '02',
    label: 'Step Two',
    title: 'Disassemble',
    body: '47 components separated, catalogued, and inspected under 10× magnification. Every spring tension measured, every gear tooth examined for wear.',
    shape: 'square',
  },
  {
    number: '03',
    label: 'Step Three',
    title: 'Restore',
    body: 'Watchmaker-grade lubricants, recalibrated light meters, hand-polished optics. Shutter speeds tested to within ±5% of factory specification.',
    shape: 'diamond',
  },
  {
    number: '04',
    label: 'Step Four',
    title: 'Archive',
    body: 'Full condition report, provenance documentation, and custom packaging. Each camera leaves with a certificate and its own serial number in our permanent registry.',
    shape: 'hexagon',
  },
];
