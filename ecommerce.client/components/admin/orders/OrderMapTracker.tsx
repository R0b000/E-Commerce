import React, { useState, useRef, useEffect } from 'react';
import {
  EnvironmentOutlined,
  CompassOutlined,
  CarOutlined,
  PhoneOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ShoppingOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  MinusOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
  SyncOutlined,
} from '@ant-design/icons';
import { Tag, Spin } from 'antd';
import { Order } from '../../../types/ecommerce.types';
import { StatusBadge, AppSelect, AppInput, AppButton } from 'shared-components';

interface OrderMapTrackerProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: string, paymentStatus: string, trackingNumber: string) => Promise<void>;
  updating?: boolean;
  isSeller?: boolean;
}

type MapMode = 'streets' | 'satellite' | 'dark';

export const OrderMapTracker: React.FC<OrderMapTrackerProps> = ({
  order,
  onClose,
  onUpdateStatus,
  updating = false,
  isSeller = false,
}) => {
  const [mapMode, setMapMode] = useState<MapMode>('dark');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Status editing
  const [status, setStatus] = useState(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || `TRK-NP-${order.orderNumber.replace(/\D/g, '') || '892147'}`);

  // Determine stage percentage along route based on status
  const getProgressPercent = () => {
    switch (status) {
      case 'delivered':
        return 1.0;
      case 'shipped':
        return 0.68;
      case 'processing':
        return 0.32;
      case 'pending':
        return 0.08;
      case 'cancelled':
        return 0.0;
      default:
        return 0.5;
    }
  };

  const progress = getProgressPercent();

  // SVG route geometry path (Curved bezier route through city districts)
  // Origin: (100, 360) - Patan Artisan Fulfillment Hub
  // Waypoint 1: (260, 290) - Ring Road South Interchange
  // Waypoint 2: (420, 200) - Bagmati River Bridge & Baneshwor
  // Waypoint 3: (580, 230) - Central Transit Distribution Depot
  // Destination: (720, 130) - Customer Residence / Delivery Address
  const startX = 110;
  const startY = 360;
  const destX = 710;
  const destY = 130;

  // Courier position interpolated along the cubic bezier curve
  // B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
  const p0 = { x: startX, y: startY };
  const p1 = { x: 260, y: 370 };
  const p2 = { x: 460, y: 150 };
  const p3 = { x: destX, y: destY };

  const t = progress;
  const courierX =
    Math.pow(1 - t, 3) * p0.x +
    3 * Math.pow(1 - t, 2) * t * p1.x +
    3 * (1 - t) * Math.pow(t, 2) * p2.x +
    Math.pow(t, 3) * p3.x;

  const courierY =
    Math.pow(1 - t, 3) * p0.y +
    3 * Math.pow(1 - t, 2) * t * p1.y +
    3 * (1 - t) * Math.pow(t, 2) * p2.y +
    Math.pow(t, 3) * p3.y;

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard: ${text}`);
  };

  const orderId = order._id || order.id || '';

  const handleSave = async () => {
    if (onUpdateStatus) {
      await onUpdateStatus(orderId, status, paymentStatus, trackingNumber);
    }
  };

  // Map theme styles
  const getMapTheme = () => {
    switch (mapMode) {
      case 'satellite':
        return {
          bg: '#14211a',
          water: '#0c4a6e',
          roadMain: '#64748b',
          roadSec: '#475569',
          land: '#1c2e24',
          text: '#a7f3d0',
        };
      case 'streets':
        return {
          bg: '#f1f5f9',
          water: '#93c5fd',
          roadMain: '#ffffff',
          roadSec: '#e2e8f0',
          land: '#f8fafc',
          text: '#334155',
        };
      case 'dark':
      default:
        return {
          bg: '#0f172a',
          water: '#0284c7',
          roadMain: '#1e293b',
          roadSec: '#334155',
          land: '#1e293b/40',
          text: '#94a3b8',
        };
    }
  };

  const theme = getMapTheme();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200 font-['Poppins','Inter',sans-serif]">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col border border-slate-200">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#0096c7] text-white flex items-center justify-center text-sm shadow-sm">
              <CompassOutlined />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Live Dispatch & GPS Tracker
                </h2>
                <Tag color="cyan" className="font-mono text-[10px] px-2 rounded-full m-0 font-bold">
                  {order.orderNumber}
                </Tag>
              </div>
              <p className="text-[11px] text-slate-300">
                Real-time route mapping from Artisan Hub to recipient delivery address.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <CloseOutlined className="text-xs" />
            </button>
          </div>
        </div>

        {/* Modal Body: Map + Detail Grid */}
        <div className="flex-1 overflow-y-auto">
          {/* =========================================================================
              INTERACTIVE MAP CANVAS SECTION
             ========================================================================= */}
          <div className="relative w-full h-[360px] sm:h-[400px] overflow-hidden bg-slate-950 select-none">
            {/* Live GPS Status Floating Pill */}
            <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
              <div className="px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-bold">LIVE TELEMETRY</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-200">Courier: Himalayan Express (#KTM-4821)</span>
              </div>

              {status === 'shipped' && (
                <div className="px-2.5 py-1 rounded-full bg-[#0096c7]/90 text-white text-[10px] font-bold shadow-md">
                  Moving · 38 km/h · ETA ~22 mins
                </div>
              )}
            </div>

            {/* Map Mode & Zoom Controls */}
            <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
              {/* Map Type Switcher */}
              <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-white/10 flex items-center gap-1 shadow-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setMapMode('dark')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    mapMode === 'dark' ? 'bg-[#0096c7] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Night GPS
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('streets')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    mapMode === 'streets' ? 'bg-[#0096c7] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Streets
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('satellite')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    mapMode === 'satellite' ? 'bg-[#0096c7] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Satellite
                </button>
              </div>

              {/* Zoom Buttons */}
              <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-white/10 flex flex-col gap-1 shadow-lg">
                <button
                  type="button"
                  title="Zoom In"
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
                  className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
                >
                  <PlusOutlined className="text-xs" />
                </button>
                <button
                  type="button"
                  title="Zoom Out"
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
                  className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
                >
                  <MinusOutlined className="text-xs" />
                </button>
                <button
                  type="button"
                  title="Recenter Map"
                  onClick={handleResetMap}
                  className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
                >
                  <CompassOutlined className="text-xs" />
                </button>
              </div>
            </div>

            {/* SVG Interactive Map Drawing */}
            <svg
              className="w-full h-full cursor-grab active:cursor-grabbing"
              viewBox="0 0 840 460"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                backgroundColor: theme.bg,
              }}
            >
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                </pattern>

                {/* Animated Gradient for Polyline Route */}
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#0096c7" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                {/* Pulse Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="840" height="460" fill="url(#grid)" />

              {/* Waterway (Bagmati River stylized curve) */}
              <path
                d="M -20,280 C 180,320 280,210 460,260 C 640,310 740,240 880,260"
                fill="none"
                stroke={theme.water}
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.25"
              />

              {/* Road Network (Background City Arterials) */}
              {/* Ring Road South */}
              <path
                d="M 20,410 C 200,430 400,400 600,420 C 750,430 800,380 860,350"
                fill="none"
                stroke={theme.roadSec}
                strokeWidth="4"
                opacity="0.35"
              />
              {/* Ring Road North */}
              <path
                d="M -10,70 C 180,50 360,70 540,60 C 680,50 780,90 860,110"
                fill="none"
                stroke={theme.roadSec}
                strokeWidth="4"
                opacity="0.35"
              />
              {/* Cross Street Arterials */}
              <path d="M 220,10 L 220,450" fill="none" stroke={theme.roadSec} strokeWidth="2.5" opacity="0.25" strokeDasharray="6,4" />
              <path d="M 440,10 L 440,450" fill="none" stroke={theme.roadSec} strokeWidth="2.5" opacity="0.25" strokeDasharray="6,4" />
              <path d="M 640,10 L 640,450" fill="none" stroke={theme.roadSec} strokeWidth="2.5" opacity="0.25" strokeDasharray="6,4" />
              <path d="M 10,210 L 830,210" fill="none" stroke={theme.roadSec} strokeWidth="2.5" opacity="0.25" strokeDasharray="6,4" />

              {/* City Zone Labels */}
              <text x="60" y="420" fill={theme.text} fontSize="10" fontWeight="bold" opacity="0.4">
                PATAN / LALITPUR ARTISAN GUILD ZONE
              </text>
              <text x="320" y="100" fill={theme.text} fontSize="10" fontWeight="bold" opacity="0.4">
                KATHMANDU CENTRAL METRO HUB
              </text>
              <text x="610" y="80" fill={theme.text} fontSize="10" fontWeight="bold" opacity="0.4">
                DESTINATION SECTOR / BHAKTAPUR
              </text>
              <text x="470" y="275" fill={theme.text} fontSize="9" fontWeight="bold" opacity="0.3">
                ~ Bagmati Corridor ~
              </text>

              {/* Main Delivery Route Highway (Backdrop Shadow) */}
              <path
                d={`M ${startX},${startY} C 260,370 460,150 ${destX},${destY}`}
                fill="none"
                stroke="#000"
                strokeWidth="8"
                opacity="0.5"
                strokeLinecap="round"
              />

              {/* Main Delivery Route Polyline */}
              <path
                d={`M ${startX},${startY} C 260,370 460,150 ${destX},${destY}`}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="8,6"
                filter="url(#glow)"
              />

              {/* =======================================================
                  ORIGIN PIN: Artisan Workshop & Warehouse
                 ======================================================= */}
              <g transform={`translate(${startX}, ${startY})`}>
                <circle r="16" fill="#f59e0b" opacity="0.2" className="animate-ping" />
                <circle r="11" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                <circle r="4" fill="#ffffff" />
                {/* Pin Tooltip */}
                <rect x="-65" y="-38" width="130" height="24" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="0" y="-22" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  Origin: Artisan Hub
                </text>
              </g>

              {/* =======================================================
                  DESTINATION PIN: Customer Delivery Location
                 ======================================================= */}
              <g transform={`translate(${destX}, ${destY})`}>
                <circle r="18" fill="#10b981" opacity="0.25" className="animate-pulse" />
                <circle r="12" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                <circle r="4" fill="#ffffff" />
                {/* Pin Tooltip */}
                <rect x="-70" y="-38" width="140" height="24" rx="12" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
                <text x="0" y="-22" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  Dest: {order.shippingAddress?.city || 'Customer Doorstep'}
                </text>
              </g>

              {/* =======================================================
                  COURIER VEHICLE IN TRANSIT
                 ======================================================= */}
              <g transform={`translate(${courierX}, ${courierY})`}>
                {/* Radar pulse ripples */}
                <circle r="24" fill="#0096c7" opacity="0.2" className="animate-ping" />
                <circle r="16" fill="#0096c7" opacity="0.35" />
                <circle r="12" fill="#0096c7" stroke="#ffffff" strokeWidth="2.5" filter="url(#glow)" />
                {/* Vehicle icon core */}
                <circle r="5" fill="#ffffff" />

                {/* Floating telemetry label */}
                <rect x="-65" y="-42" width="130" height="22" rx="11" fill="#0096c7" stroke="#ffffff" strokeWidth="1" />
                <text x="0" y="-28" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold">
                  {status === 'delivered' ? 'Arrived at Doorstep' : 'Courier in Transit'}
                </text>
              </g>
            </svg>

            {/* Bottom Floating Map Legend */}
            <div className="absolute left-4 bottom-4 z-20 flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-[11px] shadow-lg">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Artisan Origin
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0096c7]" /> Express Courier
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Customer Destination
              </span>
              <span className="text-slate-400 text-[10px]">· Click & drag to pan map</span>
            </div>
          </div>

          {/* =========================================================================
              DELIVERY TIMELINE PIPELINE
             ========================================================================= */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/80">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
              <span>Fulfillment & Dispatch Milestones</span>
              <span className="text-[11px] font-normal text-slate-500">
                Tracking ID: <b className="font-mono text-[#0096c7]">{trackingNumber}</b>
              </span>
            </div>

            {/* 5-Step Visual Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Step 1: Placed */}
              <div className={`p-3 rounded-xl border transition ${progress >= 0.08 ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircleOutlined className={progress >= 0.08 ? 'text-emerald-500 text-sm' : 'text-slate-400 text-sm'} />
                  <span className="text-xs font-bold text-slate-800">1. Order Placed</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Step 2: Processing */}
              <div className={`p-3 rounded-xl border transition ${progress >= 0.32 ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircleOutlined className={progress >= 0.32 ? 'text-emerald-500 text-sm' : 'text-slate-400 text-sm'} />
                  <span className="text-xs font-bold text-slate-800">2. Artisan Packaged</span>
                </div>
                <div className="text-[10px] text-slate-500">Quality Verified & Boxed</div>
              </div>

              {/* Step 3: Courier Pickup */}
              <div className={`p-3 rounded-xl border transition ${progress >= 0.68 ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CarOutlined className={progress >= 0.68 ? 'text-[#0096c7] text-sm' : 'text-slate-400 text-sm'} />
                  <span className="text-xs font-bold text-slate-800">3. In Transit</span>
                </div>
                <div className="text-[10px] text-slate-500">Dispatched via Courier</div>
              </div>

              {/* Step 4: Out for Delivery */}
              <div className={`p-3 rounded-xl border transition ${progress >= 0.85 ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <ClockCircleOutlined className={progress >= 0.85 ? 'text-[#0096c7] text-sm' : 'text-slate-400 text-sm'} />
                  <span className="text-xs font-bold text-slate-800">4. Out for Delivery</span>
                </div>
                <div className="text-[10px] text-slate-500">Courier near location</div>
              </div>

              {/* Step 5: Delivered */}
              <div className={`p-3 rounded-xl border transition ${progress >= 1.0 ? 'bg-white border-emerald-500 shadow-2xs' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircleOutlined className={progress >= 1.0 ? 'text-emerald-600 text-sm' : 'text-slate-400 text-sm'} />
                  <span className="text-xs font-bold text-slate-800">5. Delivered</span>
                </div>
                <div className="text-[10px] text-slate-500">{progress >= 1.0 ? 'Signed & Completed' : 'Pending drop-off'}</div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              LOGISTICS DETAILS & CONTROLS GRID
             ========================================================================= */}
          <div className="p-5 space-y-5">
            {/* Courier Rider Card + Destination Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Courier Partner Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#0096c7] flex items-center justify-center text-sm">
                      <CarOutlined />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Himalayan Express Logistics</div>
                      <div className="text-[10px] text-slate-400">Assigned Delivery Partner</div>
                    </div>
                  </div>
                  <Tag color="blue" className="text-[10px] font-bold rounded-full">
                    COURIER ASSIGNED
                  </Tag>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Courier Driver</span>
                    <div className="font-semibold text-slate-800">Bikash Shrestha</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Vehicle Registration</span>
                    <div className="font-semibold text-slate-800 font-mono">BA 2 CHA 4821</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Direct Phone</span>
                    <div className="font-semibold text-[#0096c7] flex items-center gap-1">
                      <PhoneOutlined /> +977 9841-234567
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Fulfillment Route</span>
                    <div className="font-semibold text-slate-800">Lalitpur → Kathmandu</div>
                  </div>
                </div>
              </div>

              {/* Destination Address Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                      <EnvironmentOutlined />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Destination Delivery Address</div>
                      <div className="text-[10px] text-slate-400">Customer Location Details</div>
                    </div>
                  </div>
                  <Tag color="green" className="text-[10px] font-bold rounded-full">
                    VERIFIED GPS
                  </Tag>
                </div>

                <div className="text-xs space-y-1 text-slate-700">
                  <div className="font-bold text-slate-900">{order.customer?.name}</div>
                  <div>{order.shippingAddress?.street}</div>
                  <div>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
                  </div>
                  <div className="text-slate-500">{order.shippingAddress?.country}</div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Contact: {order.customer?.email} {order.customer?.phone && `· ${order.customer?.phone}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin / Seller Order Status Update Panel */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <SafetyCertificateOutlined className="text-[#0096c7]" />
                <span>Admin / Seller Dispatch Controls</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <AppSelect
                  label="Order Fulfillment Status"
                  value={status}
                  onChange={(val) => setStatus(val as any)}
                  options={[
                    { label: 'Pending (At Workshop)', value: 'pending' },
                    { label: 'Processing (Packaging)', value: 'processing' },
                    { label: 'In Transit (With Courier)', value: 'shipped' },
                    { label: 'Delivered (Completed)', value: 'delivered' },
                    { label: 'Cancelled', value: 'cancelled' },
                  ]}
                />

                <AppSelect
                  label="Payment Status"
                  value={paymentStatus}
                  onChange={(val) => setPaymentStatus(val as any)}
                  options={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'Paid', value: 'paid' },
                    { label: 'Refunded', value: 'refunded' },
                  ]}
                />

                <AppInput
                  label="Courier Tracking Number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="TRK-NP-..."
                />
              </div>

              <div className="flex justify-end pt-1">
                <AppButton
                  type="primary"
                  loading={updating}
                  onClick={handleSave}
                  style={{ backgroundColor: '#0096c7' }}
                  icon={<SaveOutlined />}
                >
                  {updating ? 'Updating Dispatch...' : 'Save Dispatch & Sync Map'}
                </AppButton>
              </div>
            </div>

            {/* Purchased Items List */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Package Contents ({order.items?.length || 0} Items)
              </div>
              <div className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-200 overflow-hidden">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                        />
                      )}
                      <div>
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Qty: {item.quantity} × ${item.price?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">${(item.quantity * item.price)?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="text-slate-600">
                Payment Method: <b className="text-slate-800 uppercase">{order.paymentMethod || 'Credit Card / Escrow'}</b>
              </div>
              <div className="text-base font-bold text-slate-900">
                Total Settlement: <span className="text-[#0096c7]">${order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderMapTracker;
