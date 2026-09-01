import React, { useEffect, useState } from 'react';
import { Bus as BusIcon, MapPin, Save, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Bus } from '../../types.js';

export const AdminBusManagement: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/buses');
      if (res.ok) {
        const data = await res.json();
        setBuses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleUpdateBus = async (bus: Bus) => {
    try {
      const res = await fetch(`/api/admin/buses/${bus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: bus.status,
          current_stop: bus.current_stop,
          driver_name: bus.driver_name,
          driver_phone: bus.driver_phone,
        }),
      });

      if (res.ok) {
        setMsg(`Updated tracking status for ${bus.bus_no}`);
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFieldChange = (idx: number, field: keyof Bus, value: any) => {
    const updated = [...buses];
    (updated[idx] as any)[field] = value;
    setBuses(updated);
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#f0f9ff', color: '#0284c7', borderRadius: '14px' }}>
              <BusIcon size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                  Campus Bus Fleet Dispatch & Live Tracking Control
                </h1>
                <span className="badge badge-demo">Demo Dispatcher</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Update live stops, route progress, and status for college transport buses across Kochi routes
              </p>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={fetchBuses} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '12px 18px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* Buses Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bus No</th>
                <th>Route Name & Stops</th>
                <th>Current Live Stop</th>
                <th>Transit Status</th>
                <th>Driver Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((bus, idx) => (
                <tr key={bus.id}>
                  <td>
                    <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '1rem' }}>{bus.bus_no}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{bus.route_name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                      {bus.stops.map((st, sIdx) => {
                        const isCurrent = st === bus.current_stop;
                        const isLast = sIdx === bus.stops.length - 1;
                        return (
                          <React.Fragment key={sIdx}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isCurrent ? '#bae6fd' : '#f1f5f9',
                                color: isCurrent ? '#0369a1' : '#475569',
                                fontWeight: isCurrent ? 700 : 500,
                                border: isCurrent ? '1px solid #7dd3fc' : '1px solid #e2e8f0',
                              }}
                            >
                              {st}
                            </span>
                            {!isLast && (
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>→</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <select
                      className="select-field"
                      value={bus.current_stop}
                      onChange={(e) => handleFieldChange(idx, 'current_stop', e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    >
                      {bus.stops.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="select-field"
                      value={bus.status}
                      onChange={(e) => handleFieldChange(idx, 'status', e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    >
                      <option value="On Route">On Route</option>
                      <option value="Arriving Soon">Arriving Soon</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Reached Campus">Reached Campus</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{bus.driver_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{bus.driver_phone}</div>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleUpdateBus(bus)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      <Save size={14} />
                      <span>Update</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
