// topoOverrides.js - Handles injection of unrecognized countries from topojson overrides

async function loadTopoOverrides() {
  try {
    const response = await fetch('topoCountryOverrides.json');
    if (!response.ok) throw new Error('Failed to load topoCountryOverrides.json');
    return await response.json();
  } catch (error) {
    console.error('Error loading topo overrides:', error);
    return {};
  }
}

function injectTopoOverrides(overrides, countriesData, nameIndex, features, featureByCCA3, featureByName) {
  features.forEach(f => {
    const name = f.properties && f.properties.name;
    if (name && overrides[name] && !featureByCCA3.has(overrides[name].cca3)) {
      const override = overrides[name];
      const rec = {
        name: override.name,
        cca2: override.flag.replace('.svg', ''),
        cca3: override.cca3,
        region: override.region,
        flagPath: override.flag
      };
      countriesData.push(rec);
      nameIndex.set(normalizeName(rec.name), rec);
      if (!featureByCCA3.has(rec.cca3)) {
        featureByCCA3.set(rec.cca3, f);
      }
      if (!featureByName.has(normalizeName(rec.name))) {
        featureByName.set(normalizeName(rec.name), f);
      }
      if (name && !featureByName.has(normalizeName(name))) {
        featureByName.set(normalizeName(name), f);
      }
    }
  });
}