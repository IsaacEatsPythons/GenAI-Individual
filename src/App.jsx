import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'embedded-market-field-node-bom';

const starterProject = {
  revision: 5,
  constraints: {
    currentLimit: 200,
    voltage: 3.3,
    interfaces: 'I²C / SPI / GPIO',
    minimumClock: 48,
    flash: 256,
    ram: 64,
  },
  components: [
    { id: 'u1', ref: 'U1', name: 'EX-MCU32', quantity: 1, kind: 'controller', voltage: '3.3 V', current: 40, spec: '48 MHz · 40 mA', detail: '256 KB flash / 64 KB RAM', allocation: '20 usable pins', pins: 0, price: 4.8 },
    { id: 'u2', ref: 'U2', name: 'EX-TEMP33', quantity: 1, kind: 'peripheral', voltage: '3.3 V', current: 10, spec: '10 mA · address 0x48', detail: 'U4 CH0 → U2 · SDA / SCL', allocation: '0 extra MCU pins', pins: 0, price: 1.25 },
    { id: 'u3', ref: 'U3', name: 'EX-DISP50', quantity: 1, kind: 'peripheral', voltage: '5 V', current: 80, spec: 'MISO · SPI full duplex', detail: '80 mA · SPI1 → U1', allocation: 'PB0–PB4 · 5 pins', pins: 5, price: 6.2 },
    { id: 'c1', ref: 'C1', name: 'USER-LED2', quantity: 1, kind: 'custom circuit', voltage: '3.3 V', current: null, spec: 'status-light circuit', detail: 'Maximum current unknown', allocation: 'PC0 / PC1 · 2 pins', pins: 2, price: 0.45 },
    { id: 'u4', ref: 'U4', name: 'EX-I2CMUX8', quantity: 1, kind: 'peripheral', voltage: '3.3 V', current: 2, spec: '2 mA · address 0x70', detail: 'I²C1 → U1 · 8 channels', allocation: 'PA0 / PA1 · 2 pins', pins: 2, price: 2.9 },
  ],
};

function readProject() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterProject;
  } catch {
    return starterProject;
  }
}

function formatCurrent(value) {
  return value === null || value === '' || value === undefined ? 'Unknown' : `${value} mA`;
}

function App() {
  const [project, setProject] = useState(readProject);
  const [modal, setModal] = useState(null);
  const [draft, setDraft] = useState(null);
  const [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  const totalPins = useMemo(() => project.components.reduce((total, item) => total + Number(item.pins || 0) * Number(item.quantity || 1), 0), [project.components]);
  const totalKnownCurrent = useMemo(() => project.components.reduce((total, item) => total + (item.current === null ? 0 : Number(item.current) * Number(item.quantity || 1)), 0), [project.components]);
  const hasUnknownCurrent = project.components.some((item) => item.current === null);

  function openComponentEditor(component = null) {
    setDraft(component ? { ...component } : {
      id: `part-${Date.now()}`, ref: 'U5', name: '', quantity: 1, kind: 'peripheral', voltage: '3.3 V', current: '',
      spec: '', detail: '', allocation: 'Unassigned', pins: 0, price: '',
    });
    setModal({ type: 'component', editing: Boolean(component) });
  }

  function saveComponent(event) {
    event.preventDefault();
    const cleaned = {
      ...draft,
      quantity: Math.max(1, Number(draft.quantity) || 1),
      current: draft.current === '' ? null : Number(draft.current),
      pins: Math.max(0, Number(draft.pins) || 0),
      price: Number(draft.price) || 0,
    };
    setProject((current) => {
      const exists = current.components.some((item) => item.id === cleaned.id);
      return {
        ...current,
        revision: current.revision + 1,
        components: exists ? current.components.map((item) => item.id === cleaned.id ? cleaned : item) : [...current.components, cleaned],
      };
    });
    setModal(null);
    setDraft(null);
    setNotice('Changes saved to this BOM.');
    window.setTimeout(() => setNotice(''), 2600);
  }

  function openConstraintEditor() {
    setDraft({ ...project.constraints });
    setModal({ type: 'constraints' });
  }

  function saveConstraints(event) {
    event.preventDefault();
    setProject((current) => ({ ...current, revision: current.revision + 1, constraints: { ...draft } }));
    setModal(null);
    setDraft(null);
    setNotice('Project constraints saved.');
    window.setTimeout(() => setNotice(''), 2600);
  }

  function closeModal() {
    setModal(null);
    setDraft(null);
  }

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">HARDWARE / WORKBENCH</div>
        <nav aria-label="Primary navigation">
          <button type="button" onClick={() => setNotice('Field node project is open.')}>Field node</button>
          <span>/</span>
          <button type="button" className="nav-current">BOM</button>
          <span>/</span>
          <button type="button" onClick={() => setChecked(true)}>Compatibility</button>
        </nav>
      </header>

      <main className="page-content">
        <div className="eyebrow-row">
          <p className="eyebrow">01 / CREATE &amp; EDIT</p>
          <p className="saved-status">BOM r{String(project.revision).padStart(2, '0')} · Saved draft</p>
        </div>
        <section className="page-heading" aria-labelledby="page-title">
          <h1 id="page-title">Your bill of materials</h1>
          <p>Field node · 1 controller + {project.components.filter((part) => part.kind === 'peripheral').length} peripherals + {project.components.filter((part) => part.kind === 'custom circuit').length} custom circuit</p>
        </section>

        <section className="constraints-card card" aria-labelledby="constraints-heading">
          <div className="section-title-row">
            <h2 id="constraints-heading">Project-wide constraints</h2>
            <button type="button" className="button button-outline" onClick={openConstraintEditor}>Edit constraints</button>
          </div>
          <div className="constraint-values">
            <strong>≤ {project.constraints.currentLimit} mA @ {project.constraints.voltage} V</strong>
            <span>{project.constraints.interfaces}</span>
            <span>≥ {project.constraints.minimumClock} MHz</span>
            <span>{project.constraints.flash} KB flash / {project.constraints.ram} KB RAM</span>
          </div>
        </section>

        <section className="components-section" aria-labelledby="components-heading">
          <div className="section-title-row components-title">
            <h2 id="components-heading">Components · {project.components.length}</h2>
            <button type="button" className="button button-outline" onClick={() => openComponentEditor()}>＋ Add component</button>
          </div>
          <div className="table-wrap card">
            <table>
                <colgroup>
                  <col className="component-column" />
                  <col className="spec-column" />
                  <col className="allocation-column" />
                  <col className="edit-column" />
                </colgroup>
              <thead>
                <tr>
                  <th scope="col">Component / quantity</th>
                  <th scope="col">Specs / connection</th>
                  <th scope="col">Allocation</th>
                  <th scope="col">Edit</th>
                </tr>
              </thead>
              <tbody>
                {project.components.map((part) => (
                  <tr key={part.id}>
                    <td>{part.ref} · {part.name || 'New component'} · ×{part.quantity}</td>
                    <td><span>{part.voltage}{part.spec ? ` · ${part.spec}` : ` · ${formatCurrent(part.current)}`}</span><span>{part.detail || `${formatCurrent(part.current)} · ${part.pins} pins`}</span></td>
                    <td>{part.allocation}</td>
                    <td><button type="button" className="text-button" onClick={() => openComponentEditor(part)} aria-label={`Edit ${part.ref} ${part.name}`}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="summary-grid" aria-label="BOM summary">
          <article className="summary-card card">
            <p>Pin allocation</p>
            <strong>{totalPins} / 20</strong>
            <span>2 I²C + 5 SPI + 2 GPIO</span>
          </article>
          <article className="summary-card card">
            <p>Power estimate</p>
            <strong>{totalKnownCurrent} mA{hasUnknownCurrent ? ' + ?' : ''}</strong>
            <span>{hasUnknownCurrent ? 'C1 current remains unknown' : 'Known component current'}</span>
          </article>
          <article className="summary-card card">
            <p>Check coverage</p>
            <strong>{checked ? 'Review ready' : 'Not current'}</strong>
            <span>{checked ? 'Compatibility findings are available below' : 'Routing changed since r04'}</span>
          </article>
        </section>

        <p className="missing-note">⚠ Missing specifications will be flagged. Add / Edit opens a draft editor; Save retains this project, Cancel discards only the edit.</p>

        {checked && <CompatibilityPanel components={project.components} onClose={() => setChecked(false)} />}

        <footer className="page-footer">
          <button type="button" className="button button-outline" onClick={() => setNotice('Project list is not part of this BOM view.')}>Projects</button>
          <button type="button" className="button button-primary" onClick={() => setChecked(true)}>Check compatibility <span aria-hidden="true">→</span></button>
        </footer>
        <p className="safety-note">ⓘ Compatibility checks do not guarantee circuit safety.</p>
        <p className="sample-note">Fictional example data only · EX-* parts, source documents, and supplier offers are unverified.</p>
      </main>

      {notice && <div className="toast" role="status">{notice}</div>}
      {modal?.type === 'component' && <ComponentModal draft={draft} editing={modal.editing} updateDraft={updateDraft} onSave={saveComponent} onCancel={closeModal} />}
      {modal?.type === 'constraints' && <ConstraintModal draft={draft} updateDraft={updateDraft} onSave={saveConstraints} onCancel={closeModal} />}
    </div>
  );
}

function CompatibilityPanel({ components, onClose }) {
  const display = components.find((item) => item.ref === 'U3');
  const alternatives = [
    { name: 'EX-DISP33', detail: '3.3 V · SPI · 62 mA', price: '$4.90' },
    { name: 'EX-OLED128', detail: '3.3 V · I²C · 18 mA', price: '$6.10' },
  ];

  return (
    <section className="compatibility-panel card" aria-labelledby="compat-heading">
      <div className="section-title-row">
        <div><p className="eyebrow">02 / REVIEW</p><h2 id="compat-heading">Compatibility check</h2></div>
        <button type="button" className="text-button" onClick={onClose}>Close</button>
      </div>
      <div className="finding finding-warning">
        <span className="finding-icon" aria-hidden="true">!</span>
        <div><strong>{display ? `${display.ref} · ${display.name}` : 'Component voltage mismatch'}</strong><p>Voltage mismatch: this display requires 5 V, while the project controller and supply constraint are 3.3 V. Add a compatible supply or choose a 3.3 V display.</p></div>
      </div>
      <div className="finding finding-info">
        <span className="finding-icon" aria-hidden="true">i</span>
        <div><strong>Incomplete power estimate</strong><p>C1 has no maximum-current specification, so total system current cannot be confirmed against the 200 mA limit.</p></div>
      </div>
      <h3>Compatible alternatives · ranked by sample price</h3>
      <div className="alternatives-list">
        {alternatives.map((item, index) => <div className="alternative" key={item.name}><span className="rank">0{index + 1}</span><div><strong>{item.name}</strong><span>{item.detail}</span></div><strong className="price">{item.price}</strong></div>)}
      </div>
      <p className="sample-note">Illustrative recommendations and prices only. Verify specifications and supplier listings before purchase.</p>
    </section>
  );
}

function ComponentModal({ draft, editing, updateDraft, onSave, onCancel }) {
  return (
    <Modal title={editing ? 'Edit component' : 'Add component'} onCancel={onCancel}>
      <form onSubmit={onSave}>
        <div className="form-grid">
          <label>Reference<input value={draft.ref} onChange={(event) => updateDraft('ref', event.target.value)} required /></label>
          <label>Part name<input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="e.g. EX-SENSOR12" required /></label>
          <label>Quantity<input type="number" min="1" value={draft.quantity} onChange={(event) => updateDraft('quantity', event.target.value)} required /></label>
          <label>Voltage<input value={draft.voltage} onChange={(event) => updateDraft('voltage', event.target.value)} placeholder="e.g. 3.3 V" /></label>
          <label>Current (mA)<input type="number" min="0" step="any" value={draft.current ?? ''} onChange={(event) => updateDraft('current', event.target.value)} placeholder="Leave blank if unknown" /></label>
          <label>Pin count<input type="number" min="0" value={draft.pins} onChange={(event) => updateDraft('pins', event.target.value)} /></label>
          <label className="form-wide">Specs / connection<input value={draft.spec} onChange={(event) => updateDraft('spec', event.target.value)} placeholder="Interface, current, address…" /></label>
          <label className="form-wide">Connection details<input value={draft.detail} onChange={(event) => updateDraft('detail', event.target.value)} placeholder="e.g. SPI1 → U1" /></label>
          <label className="form-wide">Pin allocation<input value={draft.allocation} onChange={(event) => updateDraft('allocation', event.target.value)} /></label>
          <label>Sample unit price ($)<input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} /></label>
        </div>
        <div className="modal-actions"><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button><button type="submit" className="button button-primary">Save component</button></div>
      </form>
    </Modal>
  );
}

function ConstraintModal({ draft, updateDraft, onSave, onCancel }) {
  return (
    <Modal title="Edit project constraints" onCancel={onCancel}>
      <form onSubmit={onSave}>
        <div className="form-grid">
          <label>Maximum current (mA)<input type="number" min="0" value={draft.currentLimit} onChange={(event) => updateDraft('currentLimit', Number(event.target.value))} /></label>
          <label>Supply voltage (V)<input type="number" min="0" step="0.1" value={draft.voltage} onChange={(event) => updateDraft('voltage', Number(event.target.value))} /></label>
          <label>Minimum clock (MHz)<input type="number" min="0" value={draft.minimumClock} onChange={(event) => updateDraft('minimumClock', Number(event.target.value))} /></label>
          <label>Flash (KB)<input type="number" min="0" value={draft.flash} onChange={(event) => updateDraft('flash', Number(event.target.value))} /></label>
          <label>RAM (KB)<input type="number" min="0" value={draft.ram} onChange={(event) => updateDraft('ram', Number(event.target.value))} /></label>
          <label className="form-wide">Interfaces<input value={draft.interfaces} onChange={(event) => updateDraft('interfaces', event.target.value)} /></label>
        </div>
        <div className="modal-actions"><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button><button type="submit" className="button button-primary">Save constraints</button></div>
      </form>
    </Modal>
  );
}

function Modal({ title, onCancel, children }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="modal card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="section-title-row"><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" onClick={onCancel} aria-label="Close editor">×</button></div>
        {children}
      </section>
    </div>
  );
}

export default App;
