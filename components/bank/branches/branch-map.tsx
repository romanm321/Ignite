'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import type { Branch } from '@/lib/bank-data'

function pinIcon(branch: Branch, selected: boolean) {
  const label = branch.openNow ? (branch.waitMins === 0 ? 'Now' : `${branch.waitMins}m`) : 'Closed'
  const bg = selected ? '#c8f169' : branch.openNow ? '#0a8a3a' : '#6b7c72'
  const fg = selected ? '#0b2a1a' : '#ffffff'
  return L.divIcon({
    className: '',
    iconSize: [56, 36],
    iconAnchor: [28, 36],
    html: `<div style="display:flex;flex-direction:column;align-items:center;font-family:var(--font-sans),system-ui;">
      <span style="background:${bg};color:${fg};font-weight:700;font-size:12px;padding:4px 8px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,.25);border:2px solid #fff;white-space:nowrap">${label}</span>
      <span style="width:2px;height:8px;background:${bg}"></span>
    </div>`,
  })
}

function FlyTo({ branch }: { branch?: Branch }) {
  const map = useMap()
  useEffect(() => {
    if (branch) map.flyTo([branch.lat, branch.lng], 14, { duration: 0.6 })
  }, [branch, map])
  return null
}

export default function BranchMap({
  branches,
  selectedId,
  onSelect,
}: {
  branches: Branch[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const selected = branches.find((b) => b.id === selectedId)
  return (
    <MapContainer
      center={[40.7225, -73.9985]}
      zoom={12}
      zoomControl={false}
      className="size-full"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        className="grayscale-[0.6]"
      />
      {branches.map((b) => (
        <Marker
          key={b.id}
          position={[b.lat, b.lng]}
          icon={pinIcon(b, b.id === selectedId)}
          zIndexOffset={b.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(b.id) }}
          title={b.name}
        />
      ))}
      <FlyTo branch={selected} />
    </MapContainer>
  )
}
