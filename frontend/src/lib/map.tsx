/**
 * FoodExpress map helpers — Leaflet + OpenStreetMap (no premium tiles).
 *
 * Tiles: OpenStreetMap standard (free, no key).
 * All map features — storefront restaurant pins, rider live tracking,
 * delivery-address picker on checkout, zone polygon editor in the admin —
 * use OpenStreetMap and Leaflet only, as the user requested.
 */

import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import type { Zone } from '../types'

/** Default OpenStreetMap tiles (free, no key, no premium). */
export function OSMTileLayer() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  )
}

/** Wrapper so Leaflet works with React ref-based control rendering. */
export function MapView(props: React.ComponentProps<typeof MapContainer>) {
  return <MapContainer {...props} />
}

/** Pin marker with brand color + optional label. */
export function PinMarker({
  position,
  color = '#D70F64',
  label,
  onClick,
}: {
  position: LatLngExpression
  color?: string
  label?: string
  onClick?: () => void
}) {
  const icon = L.divIcon({
    className: 'fe-marker-pin-custom',
    html: `<div class="fe-marker-pin" style="background:${color}">${label ? `<span style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:700;color:#111;background:#fff;padding:1px 5px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3)">${label}</span>` : ''}</div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -48],
  })
  return (
    <Marker position={position} icon={icon} eventHandlers={{ click: onClick ?? (() => {}) }}>
      {label ? <Popup><div className="fe-popup"><div className="fe-popup-title">{label}</div></div></Popup> : null}
    </Marker>
  )
}

/** Rider marker (hot pink). */
export function RiderMarker({ position, label }: { position: LatLngExpression; label?: string }) {
  return <PinMarker position={position} color="#FF2B85" label={label ?? '🛵 Rider'} />
}

/** Customer marker (info blue). */
export function CustomerMarker({ position, label }: { position: LatLngExpression; label?: string }) {
  return <PinMarker position={position} color="#2B6BE1" label={label ?? '📍 You'} />
}

/** Restaurant marker (primary pink). */
export function RestaurantMarker({ position, label }: { position: LatLngExpression; label?: string }) {
  return <PinMarker position={position} color="#D70F64" label={label} />
}

/** Simple polygon overlay for zone previews in the admin map. */
export function PolygonOverlay({
  coordinates,
  color = '#D70F64',
  fillOpacity = 0.15,
  strokeWeight = 2,
}: {
  coordinates: [number, number][]
  color?: string
  fillOpacity?: number
  strokeWeight?: number
}) {
  if (!coordinates || coordinates.length < 3) return null
  const latlngs = coordinates.map(([lng, lat]) => [lat, lng] as LatLngExpression)
  return (
    <Polygon
      positions={latlngs as [number, number][]}
      pathOptions={{ color, weight: strokeWeight, opacity: 0.9, fillColor: color, fillOpacity }}
    />
  )
}

/** Admin marker (black). */
export function AdminMarker({ position, label }: { position: LatLngExpression; label?: string }) {
  return <PinMarker position={position} color="#111111" label={label ?? '📍 Admin'} />
}

/** Draw a FoodExpress delivery zone as a pink outline polygon. */
export function ZonePolygon({ zone, selected }: { zone: Zone; selected?: boolean }) {
  if (!zone.polygon || zone.polygon.length < 3) return null
  const latlngs = (zone.polygon as [number, number][]).map(([lat, lng]) => [lat, lng] as LatLngExpression)
  return (
    <Polygon
      positions={latlngs}
      pathOptions={{
        color: zone.color || '#D70F64',
        weight: selected ? 4 : 2.5,
        opacity: 0.95,
        fillColor: zone.color || '#D70F64',
        fillOpacity: selected ? 0.18 : 0.1,
      }}
    >
      <Popup>
        <div className="fe-popup">
          <div className="fe-popup-title">{zone.name}</div>
          <div className="fe-popup-sub">{zone.city} · {zone.deliveryFee}৳ delivery · {zone.minOrder}৳ minimum</div>
        </div>
      </Popup>
    </Polygon>
  )
}

/** Static map that fits a set of restaurant markers plus a home pin. */
export function RestaurantsMap({
  restaurants,
  home,
  onSelect,
}: {
  restaurants?: RestaurantLatLng[]
  home?: LatLngExpression
  onSelect?: (slug: string) => void
}) {
  if (!restaurants && !home) return null
  const pts: LatLngExpression[] = (restaurants ?? []).map((r) => [r.lat, r.lng])
  if (home) pts.unshift(home)
  if (pts.length === 0) return null

  return (
    <MapView center={pts[0]} zoom={14} style={{ height: '100%', width: '100%' }}>
      <OSMTileLayer />
      {home && <CustomerMarker position={home} label="You" />}
      {restaurants?.map((r) => (
        <PinMarker
          key={r.slug}
          position={[r.lat, r.lng]}
          label={r.name}
          onClick={() => onSelect?.(r.slug)}
        />
      ))}
    </MapView>
  )
}

export interface RestaurantLatLng { name: string; slug: string; lat: number; lng: number }

/** Leaflet draw-like click-to-place pin for the address picker. */
export function AddressPickerMap({
  position,
  onPlace,
  markerLabel = '📍 Your address',
}: {
  position?: LatLngExpression
  onPlace: (lat: number, lng: number) => void
  markerLabel?: string
}) {
  const [marker, setMarker] = useState<L.Marker | null>(null)
  const map = useMap()

  // Keep marker in sync.
  useEffect(() => {
    if (!map) return
    if (position) {
      const id = L.marker(position as LatLngExpression, {
        icon: L.divIcon({
          className: 'fe-marker-pin-custom',
          html: `<div class="fe-marker-pin" style="background:#2B6BE1">${markerLabel}</div>`,
          iconSize: [34, 44],
          iconAnchor: [17, 44],
          popupAnchor: [0, -48],
        }),
      }).addTo(map)
      setMarker(id)
    } else if (marker) {
      marker.remove()
      setMarker(null)
    }
  }, [map, position, markerLabel])

  // Click on map to place.
  useMapEvents({
    click: (e) => {
      if (!map) return
      const { lat, lng } = e.latlng
      // Remove previous marker first.
      if (marker) marker.remove()
      const id = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'fe-marker-pin-custom',
          html: `<div class="fe-marker-pin" style="background:#2B6BE1">${markerLabel}</div>`,
          iconSize: [34, 44],
          iconAnchor: [17, 44],
          popupAnchor: [0, -48],
        }),
      }).addTo(map)
      setMarker(id)
      onPlace(lat, lng)
    },
  })

  return null
}

/** Dismissable popup helper used for temporary info popups on the map. */
export function InfoPopup({ children, closed, onClose }: { children: React.ReactNode; closed?: boolean; onClose?: () => void }) {
  if (closed) return null
  return (
    <div className="fe-popup mt-3">
      <div className="fe-popup-title">{children}</div>
      {onClose ? (
        <button className="fe-btn fe-btn.ghost fe-btn.sm" onClick={onClose}>Close</button>
      ) : null}
    </div>
  )
}
