import React, { useEffect, useState } from 'react';
import {
  Bus as BusIcon,
  MapPin,
  Phone,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Milestone,
  Flag,
  ListOrdered,
  LayoutGrid,
  Radio,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Bus } from '../../types.js';

export const StudentBusTracking: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusNo, setSelectedBusNo] = useState<string>('RSET-03');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'schedule'>('timeline');

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/buses');
      if (res.ok) {
        const data = await res.json();
        setBuses(data);
      }
    } catch (err) {
      console.error('Failed to load buses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const activeBus = buses.find((b) => b.bus_no === selectedBusNo) || buses[0];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'On Route':
        return 'badge-info';
      case 'Arriving Soon':
        return 'badge-safe';
      case 'Delayed':
        return 'badge-warning';
      case 'Reached Campus':
        return 'badge-safe';
      default:
        return 'badge-info';
    }
  };

  // Calculate route progression stats
  const currentStopIndex = activeBus ? activeBus.stops.indexOf(activeBus.current_stop) : 0;
  const isAllReached = activeBus?.status === 'Reached Campus';
  const effectivePassedIndex = isAllReached ? activeBus?.stops.length || 0 : currentStopIndex;
  const progressPercent = activeBus?.stops.length
    ? Math.round((effectivePassedIndex / (activeBus.stops.length - 1 || 1)) * 100)
    : 0;
  const nextStop =
    activeBus && currentStopIndex < activeBus.stops.length - 1 && !isAllReached
      ? activeBus.stops[currentStopIndex + 1]
      : isAllReached
      ? 'At Rajagiri Campus'
      : 'Destination';

  return (
    <div className="page-body">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                padding: '12px',
                background: '#f0f9ff',
                color: '#0284c7',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BusIcon size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                  RSMS Bus Tracking
                </h1>
                <span className="badge badge-demo">Demo Tracking Engine</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Live stop-by-stop transit tracking for Rajagiri college bus fleet across Kochi routes
              </p>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchBuses}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Updating...' : 'Refresh Status'}</span>
          </button>
        </div>
      </div>

      {/* Bus Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '24px',
        }}
      >
        {buses.map((bus) => {
          const isSelected = selectedBusNo === bus.bus_no;
          return (
            <button
              key={bus.id}
              type="button"
              onClick={() => setSelectedBusNo(bus.bus_no)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: `1.5px solid ${isSelected ? '#0284c7' : 'var(--border-light)'}`,
                background: isSelected ? '#0284c7' : '#ffffff',
                color: isSelected ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <BusIcon size={16} />
              <span>{bus.bus_no}</span>
            </button>
          );
        })}
      </div>

      {/* Active Bus Information Card */}
      {activeBus && (
        <div
          className="card"
          style={{
            marginBottom: '28px',
            border: '1.5px solid #bae6fd',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            padding: '28px',
          }}
        >
          {/* Top Info Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                  {activeBus.bus_no}
                </span>
                <span className={`badge ${getStatusBadgeClass(activeBus.status)}`}>
                  {activeBus.status}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0369a1', marginTop: '2px' }}>
                {activeBus.route_name}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Current Live Stop
                </div>
                <div
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '2px',
                  }}
                >
                  <MapPin size={16} color="#0284c7" />
                  <span>{activeBus.current_stop}</span>
                </div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Driver / Contact
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {activeBus.driver_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>
                  {activeBus.driver_phone}
                </div>
              </div>
            </div>
          </div>

          {/* Route Progression Section */}
          <div style={{ marginTop: '24px' }}>
            {/* Header & View Switcher */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                marginBottom: '18px',
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Milestone size={18} color="#0284c7" />
                  <span>Route Structure & Progression</span>
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  {activeBus.stops.length} designated transit stops connecting to Rajagiri Valley Campus
                </p>
              </div>

              {/* View Toggle */}
              <div
                style={{
                  display: 'inline-flex',
                  background: '#f1f5f9',
                  padding: '3px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: viewMode === 'timeline' ? '#ffffff' : 'transparent',
                    color: viewMode === 'timeline' ? '#0f172a' : '#64748b',
                    boxShadow: viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <LayoutGrid size={14} />
                  <span>Linear Highway View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('schedule')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: viewMode === 'schedule' ? '#ffffff' : 'transparent',
                    color: viewMode === 'schedule' ? '#0f172a' : '#64748b',
                    boxShadow: viewMode === 'schedule' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListOrdered size={14} />
                  <span>Stop Schedule</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                padding: '14px 18px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                marginBottom: '20px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Progress
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {isAllReached ? activeBus.stops.length : currentStopIndex + 1} of {activeBus.stops.length} Stops ({progressPercent}%)
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '5px',
                    background: '#f1f5f9',
                    borderRadius: '3px',
                    marginTop: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: isAllReached
                        ? '#10b981'
                        : 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Next Target Stop
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ArrowRight size={14} />
                  <span>{nextStop}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Final Destination
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#059669',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Flag size={14} color="#059669" />
                  <span>Rajagiri Campus</span>
                </div>
              </div>
            </div>

            {/* View Mode 1: Perfectly Aligned Linear Highway Stepper */}
            {viewMode === 'timeline' && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  boxShadow: 'var(--shadow-sm)',
                  overflowX: 'auto',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    minWidth: `${Math.max(activeBus.stops.length * 150, 680)}px`,
                    position: 'relative',
                    padding: '8px 0 16px 0',
                  }}
                >
                  {activeBus.stops.map((stop, idx) => {
                    const currentIdx = activeBus.stops.indexOf(activeBus.current_stop);
                    const isPassed = idx < currentIdx || activeBus.status === 'Reached Campus';
                    const isCurrent = stop === activeBus.current_stop && activeBus.status !== 'Reached Campus';
                    const isDestination = idx === activeBus.stops.length - 1;
                    const isLastItem = idx === activeBus.stops.length - 1;

                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative',
                        }}
                      >
                        {/* Connecting Line to next stop - Centered precisely at 50% vertical center */}
                        {!isLastItem && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '24px',
                              transform: 'translateY(-50%)',
                              left: '50%',
                              width: '100%',
                              height: '4px',
                              borderRadius: '2px',
                              backgroundColor: isPassed ? '#10b981' : '#e2e8f0',
                              zIndex: 1,
                              transition: 'background-color 0.3s ease',
                            }}
                          />
                        )}

                        {/* Node Container (Fixed 48px height slot ensuring mathematical vertical alignment) */}
                        <div
                          style={{
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            zIndex: 2,
                            width: '100%',
                          }}
                        >
                          <div
                            style={{
                              width: isCurrent ? '42px' : isPassed ? '34px' : '32px',
                              height: isCurrent ? '42px' : isPassed ? '34px' : '32px',
                              borderRadius: '50%',
                              background: isCurrent
                                ? '#0284c7'
                                : isPassed
                                ? '#10b981'
                                : isDestination
                                ? '#0f172a'
                                : '#ffffff',
                              border: isCurrent
                                ? '3px solid #bae6fd'
                                : isPassed
                                ? '2px solid #10b981'
                                : isDestination
                                ? '2px solid #0f172a'
                                : '2px solid #cbd5e1',
                              color: isCurrent || isPassed || isDestination ? '#ffffff' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isCurrent
                                ? '0 0 0 5px rgba(2, 132, 199, 0.2), 0 4px 10px rgba(2, 132, 199, 0.3)'
                                : isPassed
                                ? '0 2px 6px rgba(16, 185, 129, 0.25)'
                                : 'none',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              fontWeight: 700,
                              fontSize: isCurrent ? '0.85rem' : '0.78rem',
                            }}
                          >
                            {isPassed ? (
                              <CheckCircle2 size={18} color="#ffffff" />
                            ) : isCurrent ? (
                              <Navigation size={18} color="#ffffff" />
                            ) : isDestination ? (
                              <Flag size={14} color="#ffffff" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                        </div>

                        {/* Stop Sequence Indicator */}
                        <div
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: isCurrent ? '#0284c7' : isPassed ? '#10b981' : '#94a3b8',
                            marginTop: '6px',
                            height: '16px',
                            lineHeight: '16px',
                          }}
                        >
                          {isDestination ? 'Destination' : `Stop ${idx + 1}`}
                        </div>

                        {/* Stop Label (Constrained height with multi-line wrapping and centered text) */}
                        <div
                          style={{
                            marginTop: '4px',
                            padding: '0 8px',
                            textAlign: 'center',
                            width: '100%',
                            minHeight: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.86rem',
                              fontWeight: isCurrent ? 800 : isPassed ? 700 : 600,
                              color: isCurrent ? '#0284c7' : isPassed ? '#0f172a' : '#475569',
                              lineHeight: 1.3,
                            }}
                          >
                            {stop}
                          </span>
                        </div>

                        {/* Status / Live Badge Container (Consistent vertical slot) */}
                        <div
                          style={{
                            marginTop: '6px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isCurrent && (
                            <span
                              className="badge badge-info"
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 700,
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#0284c7',
                                  display: 'inline-block',
                                }}
                              />
                              Bus is here
                            </span>
                          )}
                          {!isCurrent && isPassed && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: '#10b981',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              ✓ Passed
                            </span>
                          )}
                          {!isCurrent && !isPassed && (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View Mode 2: Detailed Vertical Stop Schedule */}
            {viewMode === 'schedule' && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  {activeBus.stops.map((stop, idx) => {
                    const currentIdx = activeBus.stops.indexOf(activeBus.current_stop);
                    const isPassed = idx < currentIdx || activeBus.status === 'Reached Campus';
                    const isCurrent = stop === activeBus.current_stop && activeBus.status !== 'Reached Campus';
                    const isDestination = idx === activeBus.stops.length - 1;
                    const isLastItem = idx === activeBus.stops.length - 1;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'stretch',
                          gap: '16px',
                          position: 'relative',
                        }}
                      >
                        {/* Timeline Column */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '40px',
                            flexShrink: 0,
                            position: 'relative',
                          }}
                        >
                          {/* Node Icon */}
                          <div
                            style={{
                              width: isCurrent ? '38px' : '32px',
                              height: isCurrent ? '38px' : '32px',
                              borderRadius: '50%',
                              background: isCurrent
                                ? '#0284c7'
                                : isPassed
                                ? '#10b981'
                                : isDestination
                                ? '#0f172a'
                                : '#ffffff',
                              border: isCurrent
                                ? '3px solid #bae6fd'
                                : isPassed
                                ? '2px solid #10b981'
                                : isDestination
                                ? '2px solid #0f172a'
                                : '2px solid #cbd5e1',
                              color: isCurrent || isPassed || isDestination ? '#ffffff' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isCurrent ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : 'none',
                              zIndex: 2,
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              marginTop: '8px',
                            }}
                          >
                            {isPassed ? (
                              <CheckCircle2 size={16} color="#ffffff" />
                            ) : isCurrent ? (
                              <Navigation size={16} color="#ffffff" />
                            ) : isDestination ? (
                              <Flag size={14} color="#ffffff" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          {/* Vertical Connector Line */}
                          {!isLastItem && (
                            <div
                              style={{
                                width: '3px',
                                flex: 1,
                                minHeight: '36px',
                                backgroundColor: isPassed ? '#10b981' : '#e2e8f0',
                                margin: '4px 0',
                                zIndex: 1,
                              }}
                            />
                          )}
                        </div>

                        {/* Stop Details Card */}
                        <div
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            marginBottom: '12px',
                            borderRadius: '12px',
                            background: isCurrent ? '#f0f9ff' : '#f8fafc',
                            border: `1px solid ${isCurrent ? '#bae6fd' : '#e2e8f0'}`,
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: isCurrent ? '#0284c7' : '#64748b',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {isDestination ? 'Final Destination' : `Stop #${idx + 1}`}
                              </span>
                              {isCurrent && (
                                <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                  Live Location
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: '1rem',
                                fontWeight: 800,
                                color: isCurrent ? '#0284c7' : '#0f172a',
                                marginTop: '2px',
                              }}
                            >
                              {stop}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isPassed && (
                              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                                ✓ Completed
                              </span>
                            )}
                            {isCurrent && (
                              <span style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 800 }}>
                                Transit In-Progress
                              </span>
                            )}
                            {!isPassed && !isCurrent && (
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                                Next in Route
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Meta */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.8rem',
              color: '#64748b',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>Campus GPS Dispatch & Route Verified</span>
            </span>
            <span>Managed by: Rajagiri Campus Transport Division</span>
          </div>
        </div>
      )}
    </div>
  );
};

