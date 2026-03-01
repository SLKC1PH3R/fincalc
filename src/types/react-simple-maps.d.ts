declare module 'react-simple-maps' {
  import { ComponentType, ReactNode, SVGProps } from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    style?: React.CSSProperties
    className?: string
    width?: number
    height?: number
    [key: string]: unknown
  }

  export interface ZoomableGroupProps {
    zoom?: number
    center?: [number, number]
    [key: string]: unknown
  }

  export interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: Geography[] }) => ReactNode
    [key: string]: unknown
  }

  export interface Geography {
    rsmKey: string
    id: string
    properties: Record<string, unknown>
    [key: string]: unknown
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: Geography
    style?: {
      default?: SVGProps<SVGPathElement>
      hover?: SVGProps<SVGPathElement>
      pressed?: SVGProps<SVGPathElement>
    }
    [key: string]: unknown
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
  export const Marker: ComponentType<Record<string, unknown>>
  export const Line: ComponentType<Record<string, unknown>>
  export const Annotation: ComponentType<Record<string, unknown>>
}
