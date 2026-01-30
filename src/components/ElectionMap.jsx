import { useState, useEffect, useCallback } from 'react';
import MapView from './MapView';
import YearSlider from './YearSlider';
import RaceSelector from './RaceSelector';
import MapLegend from './MapLegend';
import InfoPanel from './InfoPanel';
import Tooltip from './Tooltip';
import { useElectionData } from '../hooks/useElectionData';
import { RACE_TYPES, STATE_NAMES, getElectoralVotes, PREDICTION_YEARS, PRESIDENTIAL_YEARS, SENATE_YEARS } from '../utils/constants';

export default function ElectionMap() {
  const [year, setYear] = useState(2024);
  const [raceType, setRaceType] = useState(RACE_TYPES.PRESIDENT);
  const [statesGeo, setStatesGeo] = useState(null);
  const [countiesGeo, setCountiesGeo] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [dotsData, setDotsData] = useState(null);

  const { nationalData, stateData, loading, loadStateData } = useElectionData(raceType);

  // Load states geo data
  useEffect(() => {
    fetch('/data/geo/us-states.json')
      .then((res) => res.json())
      .then(setStatesGeo)
      .catch(console.error);
  }, []);

  // Load county dots data
  useEffect(() => {
    fetch('/data/results/presidential/county-dots.json')
      .then((res) => res.json())
      .then(setDotsData)
      .catch(console.error);
  }, []);

  // Auto-switch to Senate when a prediction year is selected
  const isPredictionYear = PREDICTION_YEARS.includes(year);
  useEffect(() => {
    if (isPredictionYear && raceType !== RACE_TYPES.SENATE) {
      setRaceType(RACE_TYPES.SENATE);
    }
  }, [year, isPredictionYear, raceType]);

  const handleStateClick = useCallback((stateAbbr) => {
    setSelectedState(stateAbbr);
    setSelectedCounty(null); // Clear county selection when changing state
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
    setSelectedCounty(null);
  }, []);

  const handleCountyClick = useCallback((fips, countyName) => {
    if (!fips) {
      setSelectedCounty(null);
      return;
    }
    setSelectedCounty({ fips, name: countyName });
  }, []);

  const handleClearCounty = useCallback(() => {
    setSelectedCounty(null);
  }, []);

  const handleBackToResults = useCallback(() => {
    setYear(2024);
    setSelectedState(null);
    setSelectedCounty(null);
  }, []);

  const handleSwitchToPresident = useCallback(() => {
    setRaceType(RACE_TYPES.PRESIDENT);
    // Find closest presidential year
    const presYears = PRESIDENTIAL_YEARS;
    const closestYear = presYears.reduce((prev, curr) =>
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
    );
    setYear(closestYear);
    setSelectedState(null);
    setSelectedCounty(null);
  }, [year]);

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
        <RaceSelector selected={raceType} onChange={setRaceType} isPredictionYear={isPredictionYear} />
      </div>

      <div className="map-main">
        <div className="map-view-container">
          <MapView
            statesGeo={statesGeo}
            countiesGeo={countiesGeo}
            dotsData={dotsData}
            results={nationalData}
            stateData={stateData[selectedState]}
            year={year}
            raceType={raceType}
            selectedState={selectedState}
            selectedCounty={selectedCounty}
            onStateClick={handleStateClick}
            onStateHover={handleStateHover}
            onCountyHover={handleCountyHover}
            onCountyClick={handleCountyClick}
          />
          <MapLegend />
        </div>

        <InfoPanel
          year={year}
          raceType={raceType}
          selectedState={selectedState}
          selectedCounty={selectedCounty}
          results={nationalData}
          stateData={stateData}
          onBack={handleBack}
          onClearCounty={handleClearCounty}
          isPredictionYear={isPredictionYear}
          onBackToResults={handleBackToResults}
          onSwitchToPresident={handleSwitchToPresident}
        />
      </div>

      <YearSlider
        year={year}
        onChange={setYear}
        years={raceType === RACE_TYPES.SENATE ? SENATE_YEARS : PRESIDENTIAL_YEARS}
      />
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
