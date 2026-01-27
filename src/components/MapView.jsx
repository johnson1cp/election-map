import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { BasemapStyle } from '@esri/maplibre-arcgis';
import { feature } from 'topojson-client';
import { getResultColor, getMarginColor } from '../utils/colorScale';
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
  dotsData,
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
  const basemapLabelLayerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const selectedStateRef = useRef(selectedState);
  selectedStateRef.current = selectedState;

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

      const arcgisKey = import.meta.env.VITE_ARCGIS_API_KEY;
      if (arcgisKey) {
        const basemapStyle = BasemapStyle.applyStyle(map, {
          style: 'arcgis/navigation-night',
          token: arcgisKey,
        });

        basemapStyle.on('BasemapStyleLoad', () => {
          map.once('idle', () => {
            // Find the first symbol (label) layer from the basemap so we
            // can insert our choropleth fills below it, letting basemap
            // labels, roads, and terrain details render on top.
            const layers = map.getStyle().layers || [];
            const firstLabel = layers.find((l) => l.type === 'symbol');
            basemapLabelLayerRef.current = firstLabel?.id || null;

            // Tone down basemap labels — lower opacity, but keep state names prominent
            layers.forEach((l) => {
              if (l.type === 'symbol') {
                try {
                  const isStateLabel = l.id.startsWith('Admin1 area/label');
                  map.setPaintProperty(l.id, 'text-opacity', isStateLabel ? 1.0 : 0.8);
                  if (isStateLabel) {
                    map.setPaintProperty(l.id, 'text-color', '#ffffff');
                  }
                } catch (_) {
                  // Some layers may not support these properties
                }
              }
            });

            setMapLoaded(true);
            onMapReady?.();
          });
        });

        basemapStyle.on('BasemapStyleError', () => {
          // Fall back — keep white background
          setMapLoaded(true);
          onMapReady?.();
        });
      } else {
        setMapLoaded(true);
        onMapReady?.();
      }
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

      // Insert fills below basemap labels so terrain/road details show on top
      const beforeLabel = basemapLabelLayerRef.current || undefined;

      map.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'states',
        paint: {
          'fill-color': '#555',
          'fill-opacity': 0.22,
        },
      }, beforeLabel);

      map.addLayer({
        id: 'states-border',
        type: 'line',
        source: 'states',
        paint: {
          'line-color': '#000000',
          'line-width': 0.8,
        },
      }, beforeLabel);

      map.addLayer({
        id: 'states-hover',
        type: 'line',
        source: 'states',
        paint: {
          'line-color': '#aaa',
          'line-width': 2,
        },
        filter: ['==', 'id', ''],
      }, beforeLabel);

      // Selected state highlight — subtle white overlay + white border
      map.addLayer({
        id: 'state-highlight-fill',
        type: 'fill',
        source: 'states',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0,
        },
        filter: ['==', ['id'], ''],
      }, beforeLabel);

      map.addLayer({
        id: 'state-highlight-border',
        type: 'line',
        source: 'states',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 1,
        },
        filter: ['==', ['id'], ''],
      }, beforeLabel);

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

      const beforeLabel = basemapLabelLayerRef.current || undefined;

      map.addLayer({
        id: 'counties-fill',
        type: 'fill',
        source: 'counties',
        paint: {
          'fill-color': '#555',
          'fill-opacity': 0.3,
        },
        layout: { visibility: 'none' },
      }, beforeLabel);

      map.addLayer({
        id: 'counties-border',
        type: 'line',
        source: 'counties',
        paint: {
          'line-color': '#000000',
          'line-width': 0.6,
          'line-opacity': 0.75,
        },
        layout: { visibility: 'none' },
      }, beforeLabel);

      // Hover highlight — white fill boost on hovered county
      map.addLayer({
        id: 'counties-hover-fill',
        type: 'fill',
        source: 'counties',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0.08,
        },
        filter: ['==', ['id'], ''],
      }, beforeLabel);

      // Hover highlight — white border on hovered county
      map.addLayer({
        id: 'counties-hover-border',
        type: 'line',
        source: 'counties',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1,
        },
        filter: ['==', ['id'], ''],
      }, beforeLabel);

      // Labels for selected state (white on colored fills)
      map.addLayer({
        id: 'counties-labels',
        type: 'symbol',
        source: 'counties',
        layout: {
          visibility: 'none',
          'text-field': ['upcase', ['get', 'name']],
          'text-size': 11,
          'text-font': ['Noto Sans Regular'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-letter-spacing': 0.05,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0, 0, 0, 0.7)',
          'text-halo-width': 1.5,
        },
      });

      // Labels for non-selected states (light on dark)
      map.addLayer({
        id: 'counties-labels-bg',
        type: 'symbol',
        source: 'counties',
        layout: {
          visibility: 'none',
          'text-field': ['upcase', ['get', 'name']],
          'text-size': 10,
          'text-font': ['Noto Sans Regular'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-letter-spacing': 0.05,
        },
        paint: {
          'text-color': '#cccccc',
          'text-halo-color': 'rgba(0, 0, 0, 0.7)',
          'text-halo-width': 1.5,
        },
      });

      // County hover — highlight + tooltip
      map.on('mousemove', 'counties-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features?.length > 0) {
          const feat = e.features[0];
          const fips = String(feat.id).padStart(5, '0');
          const name = feat.properties?.name || null;
          map.setFilter('counties-hover-fill', ['==', ['id'], feat.id]);
          map.setFilter('counties-hover-border', ['==', ['id'], feat.id]);
          onCountyHover?.(e, fips, name);
        }
      });

      map.on('mouseleave', 'counties-fill', () => {
        map.getCanvas().style.cursor = '';
        map.setFilter('counties-hover-fill', ['==', ['id'], '']);
        map.setFilter('counties-hover-border', ['==', ['id'], '']);
        onCountyHover?.(null);
      });

      // Re-order dots layers above county fills if they were added earlier
      if (map.getLayer('county-dots-glow')) {
        map.moveLayer('county-dots-glow', 'counties-labels');
      }
      if (map.getLayer('county-dots-layer')) {
        map.moveLayer('county-dots-layer', 'counties-labels');
      }
    }
  }, [mapLoaded, countiesGeo, onCountyHover]);

  // Add county-dots source and layers when dotsData is available
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !dotsData) return;

    if (map.getSource('county-dots')) {
      map.getSource('county-dots').setData(dotsData);
    } else {
      map.addSource('county-dots', {
        type: 'geojson',
        data: dotsData,
      });

      // Place dots above county fills/borders but below labels
      const beforeLayer = map.getLayer('counties-labels') ? 'counties-labels' : undefined;

      // Glow layer — added first (below main dots)
      map.addLayer({
        id: 'county-dots-glow',
        type: 'circle',
        source: 'county-dots',
        paint: {
          'circle-radius': 3,
          'circle-color': '#888',
          'circle-opacity': 0.55,
          'circle-blur': 1.5,
          'circle-stroke-width': 0,
        },
      }, beforeLayer);

      // Main dots layer
      map.addLayer({
        id: 'county-dots-layer',
        type: 'circle',
        source: 'county-dots',
        paint: {
          'circle-radius': 3,
          'circle-color': '#888',
          'circle-opacity': 0.95,
          'circle-stroke-width': 0.3,
          'circle-stroke-color': 'rgba(255,255,255,0.15)',
        },
      }, beforeLayer);

      // Click handler — navigate to state in national view
      map.on('click', 'county-dots-layer', (e) => {
        if (e.features?.length > 0 && !selectedStateRef.current) {
          const feat = e.features[0];
          const stateFips = feat.properties.state_fips;
          const stateAbbr = STATE_FIPS[stateFips];
          if (stateAbbr) {
            onStateClick?.(stateAbbr);
          }
        }
      });

      // Hover handlers — show state tooltip in national view, county tooltip in state view
      map.on('mousemove', 'county-dots-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features?.length > 0) {
          const feat = e.features[0];
          if (selectedStateRef.current) {
            onCountyHover?.(e, feat.properties.fips, feat.properties.name);
          } else {
            const stateFips = feat.properties.state_fips;
            const stateAbbr = STATE_FIPS[stateFips];
            map.setFilter('states-hover', ['==', ['id'], Number(stateFips)]);
            onStateHover?.(e, stateAbbr);
          }
        }
      });

      map.on('mouseleave', 'county-dots-layer', () => {
        map.getCanvas().style.cursor = '';
        if (selectedStateRef.current) {
          onCountyHover?.(null);
        } else {
          map.setFilter('states-hover', ['==', ['id'], '']);
          onStateHover?.(null);
        }
      });
    }
  }, [mapLoaded, dotsData, onStateClick, onStateHover, onCountyHover]);

  // Update dot circle-radius and circle-color when year changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !dotsData || !year) return;
    if (!map.getLayer('county-dots-layer')) return;

    const totalProp = `y${year}_total`;
    const marginProp = `y${year}_margin`;

    // Main dots radius
    map.setPaintProperty('county-dots-layer', 'circle-radius', [
      'interpolate', ['linear'], ['zoom'],
      3, ['max', 1.5, ['*', ['^', ['coalesce', ['get', totalProp], 0], 0.5], 0.007]],
      8, ['max', 4, ['*', ['^', ['coalesce', ['get', totalProp], 0], 0.5], 0.015]],
    ]);

    // Main dots color — brighter, more saturated for glow effect
    const colorExpr = [
      'step', ['coalesce', ['get', marginProp], 0],
      '#e03020',     // Strong R (margin < -15)
      -15, '#e05548', // Lean R
      -5, '#c8c0d0',  // Toss-up
      5, '#6090e0',   // Lean D
      15, '#2060cc',  // Strong D
    ];
    map.setPaintProperty('county-dots-layer', 'circle-color', colorExpr);

    // Glow radius (2.5x main dots)
    if (map.getLayer('county-dots-glow')) {
      map.setPaintProperty('county-dots-glow', 'circle-radius', [
        'interpolate', ['linear'], ['zoom'],
        3, ['max', 3.75, ['*', ['^', ['coalesce', ['get', totalProp], 0], 0.5], 0.0175]],
        8, ['max', 7.5, ['*', ['^', ['coalesce', ['get', totalProp], 0], 0.5], 0.075]],
      ]);

      // Glow color (same as main dots)
      map.setPaintProperty('county-dots-glow', 'circle-color', colorExpr);
    }
  }, [mapLoaded, dotsData, year]);

  // Filter dots to selected state or show all
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !dotsData) return;
    if (!map.getLayer('county-dots-layer')) return;

    // Show all county dots regardless of selected state
    map.setFilter('county-dots-layer', null);
    if (map.getLayer('county-dots-glow')) {
      map.setFilter('county-dots-glow', null);
    }
  }, [mapLoaded, selectedState, dotsData]);

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

  // Update county colors from dotsData (all counties) when drilling in
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedState || !dotsData) return;

    const colorExpr = ['match', ['to-string', ['id']]];
    let hasEntries = false;

    const yearPrefix = `y${year}`;
    for (const feat of dotsData.features) {
      const props = feat.properties;
      const margin = props[`${yearPrefix}_margin`];
      const winner = props[`${yearPrefix}_winner`];
      if (margin != null && winner) {
        const color = getMarginColor(Math.abs(margin), winner);
        colorExpr.push(String(Number(props.fips)), color);
        hasEntries = true;
      }
    }

    if (!hasEntries) return;
    colorExpr.push('#555'); // default

    if (map.getLayer('counties-fill')) {
      map.setPaintProperty('counties-fill', 'fill-color', colorExpr);
      map.setPaintProperty('counties-fill', 'fill-opacity', 0.4);
    }
  }, [mapLoaded, selectedState, dotsData, year]);

  // Show/hide county layer based on selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const visibility = selectedState ? 'visible' : 'none';
    if (map.getLayer('counties-fill')) {
      map.setLayoutProperty('counties-fill', 'visibility', visibility);
      map.setLayoutProperty('counties-border', 'visibility', visibility);

      // Keep county name labels hidden — they overwhelm the visualization
      map.setLayoutProperty('counties-labels', 'visibility', 'none');
      map.setLayoutProperty('counties-labels-bg', 'visibility', 'none');

      if (selectedState) {
        // Show all counties (no filter) — selected state is distinguished by highlight border
        map.setFilter('counties-fill', null);
        map.setFilter('counties-border', null);
      }
    }

    // Adjust state layer when zoomed into a state
    if (map.getLayer('states-fill')) {
      if (selectedState) {
        map.setPaintProperty('states-border', 'line-width', 1.2);
        // White overlay + border on selected state
        const stateFipsNum = Number(STATE_TO_FIPS[selectedState]);
        map.setFilter('state-highlight-fill', ['==', ['id'], stateFipsNum]);
        map.setFilter('state-highlight-border', ['==', ['id'], stateFipsNum]);
      } else {
        map.setPaintProperty('states-border', 'line-width', 0.8);
        map.setFilter('state-highlight-fill', ['==', ['id'], '']);
        map.setFilter('state-highlight-border', ['==', ['id'], '']);
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
