const BENEFITS = [
  {
    number: '01',
    title: 'Mechanical Precision',
    body: 'Every shutter timed to factory spec using electronic calibration equipment.',
  },
  {
    number: '02',
    title: 'Optical Clarity',
    body: 'Every lens element inspected and cleaned in a positive-pressure clean room.',
  },
  {
    number: '03',
    title: 'Historical Documentation',
    body: 'A dated restoration log and serial records ship with every instrument.',
  },
  {
    number: '04',
    title: 'Lifetime Support',
    body: 'If a shutter fails after purchase, we service it. No exceptions.',
  },
];

export default function CraftsmanshipSection() {
  return (
    <section id="craftsmanship" className="craft-section">
      <div className="craft-header">
        <p className="t-eyebrow">Our Standards</p>
        <h2 className="t-section-title">
          A Better Way
          <br />
          to Archive
        </h2>
      </div>

      <div className="craft-grid">
        {BENEFITS.map((benefit) => (
          <div key={benefit.number} className="craft-card">
            <div className="craft-card-img">
              <span className="craft-card-number t-eyebrow">{benefit.number}</span>
            </div>
            <div className="craft-card-text">
              <h3 className="craft-card-title">{benefit.title}</h3>
              <p className="t-body">{benefit.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
