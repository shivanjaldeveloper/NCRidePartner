export interface DecodedLatLng {
  latitude: number;
  longitude: number;
}

/**
 * Decodes a Google-encoded polyline string (the standard algorithm used
 * by Google's Directions/Roads APIs — same format as the EncodedPolyline
 * field on Route in every ride response) into an array of lat/lng points
 * suitable for react-native-maps' <Polyline coordinates={...} />.
 */
export function decodePolyline(
  encoded: string,
  precision: number = 5,
): DecodedLatLng[] {
  if (!encoded) return [];

  const factor = Math.pow(10, precision);
  const points: DecodedLatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 1;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / factor, longitude: lng / factor });
  }

  return points;
}
