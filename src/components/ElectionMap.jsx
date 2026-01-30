import { useState, useEffect, useCallback } from 'react';
import MapView from './MapView';
import YearSlider from './YearSlider';
import RaceSelector from './RaceSelector';
import MapLegend from './MapLegend';
import InfoPanel from './InfoPanel';
import Tooltip from './Tooltip';
import { useElectionData } from '../hooks/useElectionData';
import { RACE_TYPES, STATE_NAMES, STATE_FIPS, getElectoralVotes, PREDICTION_YEARS, PRESIDENTIAL_YEARS, SENATE_YEARS, HOUSE_YEARS } from '../utils/constants';

export default function ElectionMap() {
  const [year, setYear] = useState(2024);
  const [raceType, setRaceType] = useState(RACE_TYPES.PRESIDENT);
  const [statesGeo, setStatesGeo] = useState(null);
  const [countiesGeo, setCountiesGeo] = useState(null);
  const [districtsGeo, setDistrictsGeo] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [dotsData, setDotsData] = useState(null);
  const [showCountyView, setShowCountyView] = useState(false);
  const [nvCountyData, setNvCountyData] = useState(null);
  const [nvCountiesGeo, setNvCountiesGeo] = useState(null);

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

  // Load congressional districts geo data when House is selected
  useEffect(() => {
    if (raceType === RACE_TYPES.HOUSE && !districtsGeo) {
      fetch('/data/geo/us-districts-118.json')
        .then((res) => res.json())
        .then(setDistrictsGeo)
        .catch(console.error);
    }
  }, [raceType, districtsGeo]);

  // Load NV county data for House races when NV is selected
  useEffect(() => {
    if (raceType === RACE_TYPES.HOUSE && selectedState === 'NV' && !nvCountyData) {
      Promise.all([
        fetch('/data/results/house/nv-county-results.json').then(r => r.json()),
        fetch('/data/geo/nv-counties.json').then(r => r.json())
      ]).then(([data, geo]) => {
        setNvCountyData(data);
        setNvCountiesGeo(geo);
      }).catch(console.error);
    }
  }, [raceType, selectedState, nvCountyData]);

  // Auto-switch to Senate when a prediction year is selected
  const isPredictionYear = PREDICTION_YEARS.includes(year);
  useEffect(() => {
    if (isPredictionYear && raceType !== RACE_TYPES.SENATE) {
      setRaceType(RACE_TYPES.SENATE);
    }
  }, [year, isPredictionYear, raceType]);

  const handleStateClick = useCallback((stateAbbr) => {
    // For House races, if clicking on the already-selected state, ignore
    // (let the district click handler handle it)
    if (raceType === RACE_TYPES.HOUSE && selectedState === stateAbbr) {
      return;
    }

    setSelectedState(stateAbbr);
    setSelectedCounty(null); // Clear county selection when changing state
    setSelectedDistrict(null); // Clear district selection when changing state

    // For House races, we don't need county data
    if (raceType === RACE_TYPES.HOUSE) {
      return;
    }

    loadStateData(stateAbbr);

    // Load counties geo if not already loaded
    if (!countiesGeo) {
      fetch('/data/geo/us-counties.json')
        .then((res) => res.json())
        .then(setCountiesGeo)
        .catch(console.error);
    }
  }, [countiesGeo, loadStateData, raceType, selectedState]);

  const handleBack = useCallback(() => {
    if (showCountyView) {
      // If county view is open, close it first
      setShowCountyView(false);
    } else if (selectedDistrict) {
      // If district selected, go back to state view
      setSelectedDistrict(null);
    } else {
      // Otherwise go back to national
      setSelectedState(null);
      setSelectedCounty(null);
    }
  }, [selectedDistrict, showCountyView]);

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

  const handleDistrictClick = useCallback((districtId, stateAbbr) => {
    if (selectedDistrict === districtId) {
      // Clicking same district clears selection, goes back to state view
      setSelectedDistrict(null);
      setShowCountyView(false);
    } else if (selectedState === stateAbbr) {
      // Same state, select this district
      setSelectedDistrict(districtId);
      setShowCountyView(false); // Reset county view when changing districts
    } else {
      // Different state - just select the state first (show district list)
      setSelectedState(stateAbbr);
      setSelectedDistrict(null);
      setShowCountyView(false);
    }
  }, [selectedState, selectedDistrict]);

  const handleClearDistrict = useCallback(() => {
    setSelectedDistrict(null);
    setShowCountyView(false);
  }, []);

  const handleToggleCountyView = useCallback(() => {
    setShowCountyView(prev => !prev);
  }, []);

  const handleBackToResults = useCallback(() => {
    setYear(2024);
    setSelectedState(null);
    setSelectedCounty(null);
    setSelectedDistrict(null);
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
    setSelectedDistrict(null);
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

  const handleDistrictHover = useCallback((e, districtId, props) => {
    if (!e) {
      setTooltip(null);
      return;
    }
    const stateFips = districtId.substring(0, 2);
    const districtNum = districtId.substring(2);
    const stateAbbr = STATE_FIPS[stateFips];
    setTooltip({
      position: { x: e.point.x, y: e.point.y },
      data: {
        name: `${stateAbbr}-${parseInt(districtNum, 10) || 'AL'}`,
        districtId,
        stateAbbr,
      },
    });
  }, []);

  // Enrich tooltip with election data
  const enrichedTooltip = tooltip ? {
    ...tooltip,
    data: {
      ...tooltip.data,
      result: getTooltipResult(tooltip.data, nationalData, stateData, selectedState, year, raceType, showCountyView, selectedDistrict, nvCountyData),
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
            districtsGeo={districtsGeo}
            dotsData={dotsData}
            results={nationalData}
            stateData={stateData[selectedState]}
            year={year}
            raceType={raceType}
            selectedState={selectedState}
            selectedCounty={selectedCounty}
            selectedDistrict={selectedDistrict}
            onStateClick={handleStateClick}
            onStateHover={handleStateHover}
            onCountyHover={handleCountyHover}
            onCountyClick={handleCountyClick}
            onDistrictClick={handleDistrictClick}
            onDistrictHover={handleDistrictHover}
            showCountyView={showCountyView}
            nvCountiesGeo={nvCountiesGeo}
            nvCountyData={nvCountyData}
          />
          <MapLegend />
        </div>

        <InfoPanel
          year={year}
          raceType={raceType}
          selectedState={selectedState}
          selectedCounty={selectedCounty}
          selectedDistrict={selectedDistrict}
          results={nationalData}
          stateData={stateData}
          onBack={handleBack}
          onClearCounty={handleClearCounty}
          onClearDistrict={handleClearDistrict}
          isPredictionYear={isPredictionYear}
          onBackToResults={handleBackToResults}
          onSwitchToPresident={handleSwitchToPresident}
          onDistrictClick={handleDistrictClick}
          showCountyView={showCountyView}
          onToggleCountyView={handleToggleCountyView}
          nvCountyData={nvCountyData}
        />
      </div>

      <YearSlider
        year={year}
        onChange={setYear}
        years={raceType === RACE_TYPES.SENATE ? SENATE_YEARS : raceType === RACE_TYPES.HOUSE ? HOUSE_YEARS : PRESIDENTIAL_YEARS}
      />
      <Tooltip data={enrichedTooltip?.data} position={enrichedTooltip?.position} />
    </div>
  );
}

function getTooltipResult(data, nationalData, stateData, selectedState, year, raceType, showCountyView, selectedDistrict, nvCountyData) {
  if (!data || !nationalData?.[year]) return null;

  // NV county tooltip when in county view mode for House
  if (showCountyView && selectedDistrict?.startsWith('32') && data.name && nvCountyData?.[year]?.[selectedDistrict]?.counties) {
    // data.name is the county name from the tooltip
    const countyName = data.name.replace(' County', ''); // in case it has " County" suffix
    const countyData = nvCountyData[year][selectedDistrict].counties[countyName];
    if (countyData) {
      return {
        ...countyData,
        isHouseCounty: true,
        countyName: countyName,
      };
    }
  }

  // District tooltip for House races
  if (data.districtId && raceType === RACE_TYPES.HOUSE) {
    const district = nationalData[year].districts?.[data.districtId];
    if (district) {
      return {
        ...district,
        isDistrict: true,
      };
    }
  }

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
