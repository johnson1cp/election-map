import { useState, useEffect, useCallback } from 'react';
import MapView from './MapView';
import YearSlider from './YearSlider';
import RaceSelector from './RaceSelector';
import MapLegend from './MapLegend';
import InfoPanel from './InfoPanel';
import Tooltip from './Tooltip';
import { useElectionData } from '../hooks/useElectionData';
import { RACE_TYPES, STATE_NAMES, getElectoralVotes } from '../utils/constants';

export default function ElectionMap() {
  const [year, setYear] = useState(2024);
  const [raceType, setRaceType] = useState(RACE_TYPES.PRESIDENT);
  const [statesGeo, setStatesGeo] = useState(null);
  const [countiesGeo, setCountiesGeo] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const { nationalData, stateData, loading, loadStateData } = useElectionData(raceType);

  // Load states geo data
  useEffect(() => {
    fetch('/data/geo/us-states.json')
      .then((res) => res.json())
      .then(setStatesGeo)
      .catch(console.error);
  }, []);

  const handleStateClick = useCallback((stateAbbr) => {
    setSelectedState(stateAbbr);
    loadStateData(stateAbbr);

    // Load counties geo if not already loaded
    if (!countiesGeo) {
      fetch('/data/geo/us-counties.json')
        .then((res) => res.json())
        .then(setCountiesGeo)
        .catch(console.error);
    }
  }, [countiesGeo, loadStateData]);

  const handleBack = useCallback(() => {
    setSelectedState(null);
  }, []);

  const handleStateHover = useCallback((e, stateAbbr) => {
    if (!e) {
      setTooltip(null);
      return;
    }
    setTooltip({
      position: { x: e.point.x, y: e.point.y },
      data: {
        name: STATE_NAMES[stateAbbr] || stateAbbr,
        stateAbbr,
      },
    });
  }, []);

  const handleCountyHover = useCallback((e, fips, countyName) => {
    if (!e) {
      setTooltip(null);
      return;
    }
    setTooltip({
      position: { x: e.point.x, y: e.point.y },
      data: {
        name: countyName ? `${countyName} County` : `County ${fips}`,
        fips,
      },
    });
  }, []);

  // Enrich tooltip with election data
  const enrichedTooltip = tooltip ? {
    ...tooltip,
    data: {
      ...tooltip.data,
      result: getTooltipResult(tooltip.data, nationalData, stateData, selectedState, year),
    },
  } : null;

  if (loading) {
    return <div className="loading">Loading election data...</div>;
  }

  return (
    <div className="election-map-container">
      <div className="map-header">
        <RaceSelector selected={raceType} onChange={setRaceType} />
      </div>

      <div className="map-main">
        <div className="map-view-container">
          <MapView
            statesGeo={statesGeo}
            countiesGeo={countiesGeo}
            results={nationalData}
            stateData={stateData[selectedState]}
            year={year}
            selectedState={selectedState}
            onStateClick={handleStateClick}
            onStateHover={handleStateHover}
            onCountyHover={handleCountyHover}
          />
          <MapLegend />
        </div>

        <InfoPanel
          year={year}
          selectedState={selectedState}
          results={nationalData}
          stateData={stateData}
          onBack={handleBack}
        />
      </div>

      <YearSlider year={year} onChange={setYear} />
      <Tooltip data={enrichedTooltip?.data} position={enrichedTooltip?.position} />
    </div>
  );
}

function getTooltipResult(data, nationalData, stateData, selectedState, year) {
  if (!data || !nationalData?.[year]) return null;

  if (data.stateAbbr) {
    const stateResult = nationalData[year].states?.[data.stateAbbr];
    if (stateResult) {
      return {
        ...stateResult,
        dem_candidate: stateResult.dem_candidate,
        rep_candidate: stateResult.rep_candidate,
        electoralVotes: getElectoralVotes(data.stateAbbr, year),
      };
    }
  }

  if (data.fips && selectedState && stateData?.[selectedState]?.[year]) {
    return stateData[selectedState][year].counties?.[data.fips] || null;
  }

  return null;
}
