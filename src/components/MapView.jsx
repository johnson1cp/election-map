import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { feature } from 'topojson-client';
import { getResultColor } from '../utils/colorScale';
import { STATE_FIPS, STATE_NAMES, STATE_TO_FIPS } from '../utils/constants';

const MAP_STYLE = {
  version: 8,
  name: 'election-map',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#ffffff' },
    },
  ],
};

// US bounds for initial view
const US_BOUNDS = [[-130, 24], [-65, 50]];

export default function MapView({
  statesGeo,
  countiesGeo,
  results,
  stateData,
  year,
  selectedState,
  onStateClick,
  onStateHover,
  onCountyHover,
  onMapReady,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      bounds: US_BOUNDS,
      fitBoundsOptions: { padding: 20 },
      maxZoom: 10,
      minZoom: 2,
    });

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
      onMapReady?.();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Add states source and layers when geo data is available
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !statesGeo) return;

    const statesGeojson = feature(statesGeo, statesGeo.objects.states);

    if (map.getSource('states')) {
      map.getSource('states').setData(statesGeojson);
    } else {
      map.addSource('states', {
        type: 'geojson',
        data: statesGeojson,
      });

      map.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'states',
        paint: {
          'fill-color': '#555',
          'fill-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'states-border',
        type: 'line',
        source: 'states',
        paint: {
          'line-color': '#888',
          'line-width': 0.8,
        },
      });

      map.addLayer({
        id: 'states-hover',
        type: 'line',
        source: 'states',
        paint: {
          'line-color': '#333',
          'line-width': 2,
        },
        filter: ['==', 'id', ''],
      });

      // Click handler
      map.on('click', 'states-fill', (e) => {
        if (e.features?.length > 0) {
          const feat = e.features[0];
          const fips = String(feat.id).padStart(2, '0');
          const stateAbbr = STATE_FIPS[fips];
          if (stateAbbr) {
            onStateClick?.(stateAbbr, feat);
          }
        }
      });

      // Hover handlers
      map.on('mousemove', 'states-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features?.length > 0) {
          const feat = e.features[0];
          const fips = String(feat.id).padStart(2, '0');
          const stateAbbr = STATE_FIPS[fips];
          map.setFilter('states-hover', ['==', ['id'], feat.id]);
          onStateHover?.(e, stateAbbr);
        }
      });

      map.on('mouseleave', 'states-fill', () => {
        map.getCanvas().style.cursor = '';
        map.setFilter('states-hover', ['==', ['id'], '']);
        onStateHover?.(null);
      });
    }
  }, [mapLoaded, statesGeo, onStateClick, onStateHover]);

  // Add counties source and layers when geo data is available
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !countiesGeo) return;

    const countiesGeojson = feature(countiesGeo, countiesGeo.objects.counties);

    if (map.getSource('counties')) {
      map.getSource('counties').setData(countiesGeojson);
    } else {
      map.addSource('counties', {
        type: 'geojson',
        data: countiesGeojson,
      });

      map.addLayer({
        id: 'counties-fill',
        type: 'fill',
        source: 'counties',
        paint: {
          'fill-color': '#555',
          'fill-opacity': 0.9,
        },
        layout: { visibility: 'none' },
      });

      map.addLayer({
        id: 'counties-border',
        type: 'line',
        source: 'counties',
        paint: {
          'line-color': '#999',
          'line-width': 0.4,
        },
        layout: { visibility: 'none' },
      });

      // Labels for selected state (white on colored fills)
      map.addLayer({
        id: 'counties-labels',
        type: 'symbol',
        source: 'counties',
        layout: {
          visibility: 'none',
          'text-field': ['upcase', ['get', 'name']],
          'text-size': 11,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-letter-spacing': 0.05,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Labels for non-selected states (black on grey)
      map.addLayer({
        id: 'counties-labels-bg',
        type: 'symbol',
        source: 'counties',
        layout: {
          visibility: 'none',
          'text-field': ['upcase', ['get', 'name']],
          'text-size': 10,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-letter-spacing': 0.05,
        },
        paint: {
          'text-color': '#333333',
        },
      });

      // County hover
      map.on('mousemove', 'counties-fill', (e) => {
        if (e.features?.length > 0) {
          const feat = e.features[0];
          const fips = String(feat.id).padStart(5, '0');
          const name = feat.properties?.name || null;
          onCountyHover?.(e, fips, name);
        }
      });

      map.on('mouseleave', 'counties-fill', () => {
        onCountyHover?.(null);
      });
    }
  }, [mapLoaded, countiesGeo, onCountyHover]);

  // Update state colors when results or year changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !results || !year || !results[year]) return;

    const yearData = results[year];
    const colorExpr = ['match', ['to-string', ['id']]];

    Object.entries(STATE_FIPS).forEach(([fips, abbr]) => {
      const stateResult = yearData.states?.[abbr];
      const color = getResultColor(stateResult);
      colorExpr.push(String(Number(fips)), color);
    });
    colorExpr.push('#555'); // default

    if (map.getLayer('states-fill')) {
      map.setPaintProperty('states-fill', 'fill-color', colorExpr);
    }
  }, [mapLoaded, results, year]);

  // Update county colors when state data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedState || !stateData) return;

    const stateYearData = stateData[year];
    if (!stateYearData?.counties) return;

    const colorExpr = ['match', ['to-string', ['id']]];
    let hasEntries = false;

    Object.entries(stateYearData.counties).forEach(([fips, result]) => {
      const color = getResultColor(result);
      colorExpr.push(String(Number(fips)), color);
      hasEntries = true;
    });

    if (!hasEntries) return;
    colorExpr.push('#555'); // default

    if (map.getLayer('counties-fill')) {
      map.setPaintProperty('counties-fill', 'fill-color', colorExpr);
    }
  }, [mapLoaded, selectedState, stateData, year]);

  // Show/hide county layer based on selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const visibility = selectedState ? 'visible' : 'none';
    if (map.getLayer('counties-fill')) {
      map.setLayoutProperty('counties-fill', 'visibility', visibility);
      map.setLayoutProperty('counties-border', 'visibility', visibility);
      map.setLayoutProperty('counties-labels', 'visibility', visibility);

      if (selectedState) {
        const fips = STATE_TO_FIPS[selectedState];
        const minId = Number(fips) * 1000;
        const maxId = minId + 999;
        const stateFilter = [
          'all',
          ['>=', ['id'], minId],
          ['<=', ['id'], maxId],
        ];
        const bgFilter = [
          'any',
          ['<', ['id'], minId],
          ['>', ['id'], maxId],
        ];
        map.setFilter('counties-fill', stateFilter);
        map.setFilter('counties-border', stateFilter);
        map.setFilter('counties-labels', stateFilter);
        map.setFilter('counties-labels-bg', bgFilter);
        map.setLayoutProperty('counties-labels-bg', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('counties-labels-bg', 'visibility', 'none');
      }
    }

    // Adjust state layer when zoomed into a state
    if (map.getLayer('states-fill')) {
      if (selectedState) {
        map.setPaintProperty('states-fill', 'fill-color', '#E9E9E9');
        map.setPaintProperty('states-fill', 'fill-opacity', 1);
        map.setPaintProperty('states-border', 'line-width', 0.5);
        map.setPaintProperty('states-border', 'line-color', '#bbb');
      } else {
        // Restore election colors
        const yearData = results?.[year];
        if (yearData) {
          const colorExpr = ['match', ['to-string', ['id']]];
          Object.entries(STATE_FIPS).forEach(([fips, abbr]) => {
            const stateResult = yearData.states?.[abbr];
            const color = getResultColor(stateResult);
            colorExpr.push(String(Number(fips)), color);
          });
          colorExpr.push('#555');
          map.setPaintProperty('states-fill', 'fill-color', colorExpr);
        }
        map.setPaintProperty('states-fill', 'fill-opacity', 0.9);
        map.setPaintProperty('states-border', 'line-width', 0.8);
        map.setPaintProperty('states-border', 'line-color', '#888');
      }
    }
  }, [mapLoaded, selectedState, results, year]);

  // Fly to state or reset
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !statesGeo) return;

    if (selectedState) {
      // Find the state feature and compute its bounds
      const statesGeojson = feature(statesGeo, statesGeo.objects.states);
      const stateFeat = statesGeojson.features.find((f) => {
        const fips = String(f.id).padStart(2, '0');
        return STATE_FIPS[fips] === selectedState;
      });

      if (stateFeat) {
        const bounds = new maplibregl.LngLatBounds();
        const addCoords = (coords) => {
          if (typeof coords[0] === 'number') {
            bounds.extend(coords);
          } else {
            coords.forEach(addCoords);
          }
        };
        addCoords(stateFeat.geometry.coordinates);

        map.flyTo({
          center: bounds.getCenter(),
          zoom: getStateZoom(selectedState),
          duration: 1200,
          essential: true,
        });
      }
    } else {
      map.flyTo({
        center: [-97, 39],
        zoom: 3.5,
        duration: 1000,
        essential: true,
      });
    }
  }, [mapLoaded, selectedState, statesGeo]);

  return <div ref={containerRef} className="map-container" />;
}

function getStateZoom(stateAbbr) {
  // Larger states get less zoom, smaller states get more
  const smallStates = ['CT', 'DE', 'DC', 'HI', 'MA', 'MD', 'NH', 'NJ', 'RI', 'VT'];
  const largeStates = ['AK', 'TX', 'CA', 'MT', 'NM'];
  if (smallStates.includes(stateAbbr)) return 7;
  if (largeStates.includes(stateAbbr)) return 5;
  return 6;
}
