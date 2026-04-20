// v.1.5.7
function revealCountry(rec) {
  if (revealedCountries.has(rec.name)) return;
  revealedCountries.add(rec.name);
  // award points only during timed mode (50 points per revealed country)
  if (timedModeActive && typeof score === 'number') score += 50;
  const forceStretch = new Set(["RUS", "IRL", "TCD", "CIV"]);
  let feature = getFeature(rec);
  if (!feature) {
    if (rec.cca3 === "BSC") {
      const topoFeature = features.find(d => d.properties && d.properties.name === "Somaliland");
      if (topoFeature) {
        feature = {
          id: "706",
          type: "Feature",
          geometry: topoFeature.geometry,
          properties: {
            name: rec.name,
            iso_a3: rec.cca3
          }
        };
      }
    } else if (rec.cca3 === "NCY") {
      const topoFeature = features.find(d => d.properties && d.properties.name === "N. Cyprus");
      if (topoFeature) {
        feature = {
          id: "196",
          type: "Feature",
          geometry: topoFeature.geometry,
          properties: {
            name: rec.name,
            iso_a3: rec.cca3
          }
        };
      }
    }
    if (!feature) return;
  }
  if (feature.geometry.type === "MultiPolygon") {
    const polys = feature.geometry.coordinates;
    const areas = polys.map(poly => d3.geoArea({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: poly
      }
    }));
    const maxIndex = areas.indexOf(Math.max(...areas));
    if (rec.cca3 === "NLD") feature.geometry.coordinates = [polys[maxIndex]];
  }
  let flagImg = flagCache.get(rec.cca2);

  function brataiKey(name, cca3) {
    if (cca3 === "BSC") return "somaliland";
    if (cca3 === "NCY") return "turkish-cyprus";
    if (cca3 === "COD") return "democratic-republic-of-the-congo";
    if (cca3 === "GEO" || name.toLowerCase().includes('georgia')) return "georgia";
    if (cca3 === "JOR") return "jordan";
    if (cca3 === "CPV" || name.toLowerCase().includes('cape verde') || name.toLowerCase().includes('cabo verde')) return "cabo-verde";
    if (cca3 === "STP" || name.toLowerCase().includes('sao tome')) return "sao-tome-and-principe";
    if (cca3 === "CIV" || name.toLowerCase().includes("côte d'ivoire") || name.toLowerCase().includes("cote d'ivoire")) return "côte-d'ivoire";
    if (cca3 === "FRO" || name.toLowerCase().includes('faroe')) return "faroe-islands";
    if (cca3 === "ALA" || /\b(aland|åland)\b/i.test(name)) return "åland-islands";
    if (cca3 === "SJM" || name.toLowerCase().includes('svalbard') || name.toLowerCase().includes('jan mayen')) return "svalbard-and-jan-mayen";
    // French overseas territories and collectivities
    if (cca3 === "GLP" || name.toLowerCase().includes('guadeloupe')) return "guadeloupe";
    if (cca3 === "MTQ" || name.toLowerCase().includes('martinique')) return "martinique";
    if (cca3 === "GUF" || name.toLowerCase().includes('french guiana')) return "french-guiana";
    if (cca3 === "REU" || name.toLowerCase().includes('réunion') || name.toLowerCase().includes('reunion')) return "réunion";
    if (cca3 === "MYT" || name.toLowerCase().includes('mayotte')) return "mayotte";
    if (cca3 === "BLM" || name.toLowerCase().includes('saint barthélemy')) return "saint-barthélemy";
    if (cca3 === "MAF" || name.toLowerCase().includes('saint martin')) return "saint-martin";
    if (cca3 === "SPM" || name.toLowerCase().includes('saint pierre') || name.toLowerCase().includes('miquelon')) return "saint-pierre-and-miquelon";
    if (cca3 === "WLF" || name.toLowerCase().includes('wallis') || name.toLowerCase().includes('futuna')) return "wallis-and-futuna";
    if (cca3 === "NCL" || name.toLowerCase().includes('new caledonia')) return "new-caledonia";
    if (cca3 === "PYF" || name.toLowerCase().includes('french polynesia')) return "french-polynesia";
    // French Southern and Antarctic Lands (ATF) - keep as france for now
    return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  let flagSrc = `bratai/${rec.flagPath || brataiKey(rec.name, rec.cca3) + '.svg'}`;
  if (!flagImg) {
    flagImg = new Image();
    flagImg.src = flagSrc;
    flagImg.onload = () => flagCache.set(rec.cca2, flagImg);
  }
  if (!window.flagCanvas) {
    window.flagCanvas = document.createElement('canvas');
    window.flagCtx = window.flagCanvas.getContext('2d');
    flagCanvas.style.position = 'absolute';
    flagCanvas.style.top = '0';
    flagCanvas.style.left = '0';
    flagCanvas.style.pointerEvents = 'none';
    document.body.appendChild(flagCanvas);

    let resizeTimeout;
    function resizeFlagCanvas() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const svgNode = d3.select('svg').node();
        const width = svgNode ? svgNode.getBoundingClientRect().width : window.innerWidth;
        const height = svgNode ? svgNode.getBoundingClientRect().height : window.innerHeight;
        flagCanvas.width = width;
        flagCanvas.height = height;
        flagCanvas.style.width = width + 'px';
        flagCanvas.style.height = height + 'px';
      }, 100);
    }
    window.addEventListener('resize', resizeFlagCanvas);
    resizeFlagCanvas();
    
    window.cleanupFlagCanvas = () => {
      if (window.flagCanvas && window.flagCanvas.parentNode) {
        window.flagCanvas.parentNode.removeChild(window.flagCanvas);
        window.flagCanvas = null;
        window.flagCtx = null;
      }
      window.removeEventListener('resize', resizeFlagCanvas);
    };
  }

  function placeImageCover(imgSel, naturalImg, bounds) {
    if (!naturalImg || !naturalImg.width || !naturalImg.height) return;
    const flagRatio = naturalImg.width / naturalImg.height;
    const wBox = bounds[1][0] - bounds[0][0];
    const hBox = bounds[1][1] - bounds[0][1];
    if (!isFinite(wBox) || !isFinite(hBox) || wBox <= 0 || hBox <= 0) return;
    let width, height;
    if (flagRatio > (wBox / hBox)) {
      height = hBox;
      width = height * flagRatio;
    } else {
      width = wBox;
      height = width / flagRatio;
    }
    if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) return;
    imgSel.attr("width", width).attr("height", height).attr("x", bounds[0][0] - (width - wBox) / 2).attr("y", bounds[0][1] - (height - hBox) / 2).attr("preserveAspectRatio", "xMidYMid slice");
  }

  function renderSingleFeature(feature, rec, clipId, stretchOverride = false) {
    let bounds = path.bounds(feature);
    // Validate and sanitize bounds
    if (!bounds || bounds.length !== 2 || 
        !isFinite(bounds[0][0]) || !isFinite(bounds[0][1]) || 
        !isFinite(bounds[1][0]) || !isFinite(bounds[1][1])) {
      // Fallback: use reasonable default bounds if calculation fails
      bounds = [[0, 0], [100, 100]];
    }
    // Calculate the correct flag source for this specific rec
    const recFlagSrc = `bratai/${rec.flagPath || brataiKey(rec.name, rec.cca3) + '.svg'}`;
    const img = mapGroup.append("image")
      .attr("id", `flag-${clipId}`)
      .attr("href", recFlagSrc)
      .attr("clip-path", `url(#${clipId})`)
      .attr("style", "pointer-events:none;")
      .attr("opacity", 0);
    const useStretch = forceStretch.has(rec.cca3) || stretchOverride;

    function applyStretch(imgSel, b) {
      const w = b[1][0] - b[0][0];
      const h = b[1][1] - b[0][1];
      if (isFinite(w) && isFinite(h) && w > 0 && h > 0) {
        imgSel.attr("x", b[0][0]).attr("y", b[0][1]).attr("width", w).attr("height", h).attr("preserveAspectRatio", "none");
      }
    }
    if (flagImg && flagImg.complete && flagImg.naturalWidth) {
      if (useStretch) applyStretch(img, bounds);
      else placeImageCover(img, flagImg, bounds);
    } else {
      const tmp = new Image();
      tmp.onload = function() {
        if (useStretch) applyStretch(img, bounds);
        else placeImageCover(img, tmp, bounds);
        if (img.classed("flag-transitioned")) {
          img.attr("opacity", 1);
        }
      };
      tmp.onerror = function() {
        d3.select(img.node()).remove();
      };
      tmp.src = recFlagSrc;
    }
  }
  
function processMultiPolygon(feature, rec) {
    let svalbardIndex = null;
    let corsicaIndex = null;
    if (rec.cca3 === "NOR") {
      // Distance-based grouping (200km radius) with flood-fill using proper geo distance
      const DISTANCE_KM = 200;
      const EARTH_RADIUS_KM = 6371;
      const polys = feature.geometry.coordinates;
      
      // Calculate centroids
      const items = polys.map((poly, idx) => {
        const lons = poly[0].map(p => p[0]);
        const lats = poly[0].map(p => p[1]);
        return { cx: d3.mean(lons), cy: d3.mean(lats), idx, grouped: false };
      });
      
      // Distance in km using d3.geoDistance (returns radians, convert to km)
      function isNearby(c1, c2) {
        return d3.geoDistance([c1.cx, c1.cy], [c2.cx, c2.cy]) * EARTH_RADIUS_KM <= DISTANCE_KM;
      }
      
      // Flood-fill clustering
      const groups = [];
      items.forEach(startItem => {
        if (startItem.grouped) return;
        const group = [startItem.idx];
        startItem.grouped = true;
        const queue = [startItem];
        while (queue.length > 0) {
          const current = queue.shift();
          items.forEach(other => {
            if (!other.grouped && isNearby(current, other)) {
              group.push(other.idx);
              other.grouped = true;
              queue.push(other);
            }
          });
        }
        groups.push(group);
      });
      
      // Render each group with Norway flag
      groups.forEach((group, gIdx) => {
        const groupFeature = {
          type: "Feature",
          geometry: { type: "MultiPolygon", coordinates: group.map(i => polys[i]) },
          properties: feature.properties
        };
        const clipId = gIdx === 0 ? `clip-${rec.cca3}` : `clip-${rec.cca3}-group${gIdx}`;
        mapGroup.append("clipPath").attr("id", clipId).append("path").attr("d", path(groupFeature));
        renderSingleFeature(groupFeature, rec, clipId);
      });
      return;
    }
    if (rec.cca3 === "FRA") {
      // Identify indices for Corsica and French overseas territories
      let territoryIndices = {};
      feature.geometry.coordinates.forEach((poly, idx) => {
        const lons = poly[0].map(p => p[0]);
        const lats = poly[0].map(p => p[1]);
        const cx = d3.mean(lons), cy = d3.mean(lats);
        // Corsica
        if (cx > 8 && cx < 10 && cy > 41 && cy < 43) territoryIndices.corsica = idx;
        // Guadeloupe
        if (cx > -62 && cx < -60 && cy > 15 && cy < 17) territoryIndices.guadeloupe = idx;
        // Martinique
        if (cx > -62 && cx < -60 && cy > 14 && cy < 15.5) territoryIndices.martinique = idx;
        // French Guiana
        if (cx > -54.5 && cx < -51 && cy > 2 && cy < 6) territoryIndices.frenchguiana = idx;
        // Réunion
        if (cx > 55 && cx < 57 && cy > -22 && cy < -20) territoryIndices.reunion = idx;
        // Mayotte
        if (cx > 44 && cx < 46 && cy > -13.5 && cy < -12) territoryIndices.mayotte = idx;
        // Saint Pierre and Miquelon
        if (cx > -57.5 && cx < -55 && cy > 46.5 && cy < 48) territoryIndices.spm = idx;
        // Saint Barthélemy
        if (cx > -63.2 && cx < -62.5 && cy > 17.8 && cy < 18.2) territoryIndices.blm = idx;
        // Saint Martin
        if (cx > -63.2 && cx < -62.5 && cy > 18 && cy < 18.2) territoryIndices.maf = idx;
        // Wallis and Futuna
        if (cx > -177.5 && cx < -176 && cy > -14.5 && cy < -13) territoryIndices.wlf = idx;
        // New Caledonia
        if (cx > 163 && cx < 168 && cy > -23 && cy < -19) territoryIndices.ncl = idx;
        // French Polynesia
        if (cx > -155 && cx < -148 && cy > -18 && cy < -15) territoryIndices.pyf = idx;
      });
      feature.geometry.coordinates.forEach((poly, idx) => {
        const singleFeature = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: poly
          },
          properties: feature.properties
        };
        const clipId = `clip-${rec.cca3}-part${idx}`;
        mapGroup.append("clipPath").attr("id", clipId).append("path").attr("d", path(singleFeature));
        let customRec = rec;
        let stretchOverride = false;
        if (idx === territoryIndices.corsica) stretchOverride = true;
        if (idx === territoryIndices.guadeloupe) customRec = { ...rec, cca3: "GLP", name: "Guadeloupe" };
        if (idx === territoryIndices.martinique) customRec = { ...rec, cca3: "MTQ", name: "Martinique" };
        if (idx === territoryIndices.frenchguiana) customRec = { ...rec, cca3: "GUF", name: "French Guiana" };
        if (idx === territoryIndices.reunion) customRec = { ...rec, cca3: "REU", name: "Réunion" };
        if (idx === territoryIndices.mayotte) customRec = { ...rec, cca3: "MYT", name: "Mayotte" };
        if (idx === territoryIndices.spm) customRec = { ...rec, cca3: "SPM", name: "Saint Pierre and Miquelon" };
        if (idx === territoryIndices.blm) customRec = { ...rec, cca3: "BLM", name: "Saint Barthélemy" };
        if (idx === territoryIndices.maf) customRec = { ...rec, cca3: "MAF", name: "Saint Martin" };
        if (idx === territoryIndices.wlf) customRec = { ...rec, cca3: "WLF", name: "Wallis and Futuna" };
        if (idx === territoryIndices.ncl) customRec = { ...rec, cca3: "NCL", name: "New Caledonia" };
        if (idx === territoryIndices.pyf) customRec = { ...rec, cca3: "PYF", name: "French Polynesia" };
        renderSingleFeature(singleFeature, customRec, clipId, stretchOverride);
      });
      return;
    }
    
    feature.geometry.coordinates.forEach((poly, idx) => {
      const singleFeature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: poly
        },
        properties: feature.properties
      };
      const clipId = `clip-${rec.cca3}-part${idx}`;
      mapGroup.append("clipPath").attr("id", clipId).append("path").attr("d", path(singleFeature));
      renderSingleFeature(singleFeature, rec, clipId);
    });
  }
if (["USA", "FRA", "NLD", "PRT", "ESP", "TWN", "MLT", "AUS", "NZL", "GNQ", "ZAF", "NOR"].includes(rec.cca3) && feature.geometry.type === "MultiPolygon") processMultiPolygon(feature, rec);
  else {
    const clipId = `clip-${rec.cca3}`;
    mapGroup.append("clipPath").attr("id", clipId).append("path").attr("d", path(feature));
    renderSingleFeature(feature, rec, clipId);
  }
const iso = rec.cca3;
  const countrySel = mapGroup.selectAll("path.country");
  let greenTarget = countrySel.filter(() => false);
  
  if (iso === "BSC" || iso === "NCY") {
    // For BSC/NCY, apply green to ALL countries to test if anything works
    greenTarget = countrySel;
  } else {
    const topoId = topoIdMap[iso];
    greenTarget = countrySel.filter(function(d) {
      if (!d) return false;
      return String(d.id) === topoId || (d.properties || {}).iso_a3 === iso;
    });
  }
  
  if (greenTarget.size() > 0) {
    greenTarget.style("transition", "none").style("fill", "#00ff00").style("opacity", 0).style("transition", "fill 0.45s ease, transform 0.35s ease");
    greenTarget.transition().duration(300).style("opacity", 1);
    greenTarget.classed("revealed", true);
  }
  setTimeout(() => {
    mapGroup.selectAll(`[id^="flag-clip-${iso}"]`).transition().duration(300).style("opacity", 1).on("start", function() {
      d3.select(this).classed("flag-transitioned", true);
    });
  }, 300);
  mapGroup.selectAll(`[id^="flag-clip-${iso}"]`).raise();
}

function nextRound() {
  const submitSpan = document.querySelector("#submit-btn span");
  submitSpan.textContent = "arrow_forward_ios";
  submitSpan.style.fontSize = "24px";
  let remaining;
  if (timedModeActive && gameType === 'countries') {
    // In timed countries mode: pick a random continent per question
    const contChoices = continentOrder.filter(c => c !== 'Antarctic');
    const cont = contChoices[Math.floor(Math.random() * contChoices.length)];
    remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region === cont);
    if (!remaining || remaining.length === 0) {
      // fallback to any non-Antarctic
      remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region !== 'Antarctic');
    }
  } else if (gameMode === "Normal" || gameMode === "Hard") {
    while (noregdip < continentOrder.length) {
      const cont = continentOrder[noregdip];
      remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region === cont);
      if (remaining.length > 0) break;
      noregdip++;
    }
    if (noregdip >= continentOrder.length) {
      endGame();
      return;
    }
  } else {
    remaining = countriesData.filter(c => !revealedCountries.has(c.name) && c.region !== "Antarctic");
  }
  if (!remaining || !remaining.length) {
    endGame();
    return;
  }
  // Pick a country such that the first letter is not the same as lastPromptLetter
  // Find a valid prompt letter with remaining countries
  let validLetters = Array.from(new Set(remaining.map(c => c.name[0].toUpperCase())));
  // Remove lastPromptLetter if possible
  if (validLetters.length > 1 && validLetters.includes(lastPromptLetter)) {
    validLetters = validLetters.filter(l => l !== lastPromptLetter);
  }
  if (validLetters.length === 0) {
    endGame();
    return;
  }
  // Pick a random valid letter
  currentLetter = validLetters[Math.floor(Math.random() * validLetters.length)];
  // Pick a country with that letter
  let rec = remaining.find(c => c.name[0].toUpperCase() === currentLetter);
  if (!rec) {
    endGame();
    return;
  }
  currentContinent = rec.region;
  lastPromptLetter = currentLetter;
  let promptText = `Round ${round}: Name a country starting with "${currentLetter}"`;
  if (gameMode === "Normal" || gameMode === "Hard" || gameMode === "Extreme") {
    promptText = `Round ${round}: Name a country in ${currentContinent} starting with "${currentLetter}"`;
  }
  document.getElementById("prompt").innerText = promptText;
}

function endGame() {
  // If there are skipped countries, revisit them
  if (skippedCountries.length > 0) {
    let revisitIndex = 0;

    function revisitSkipped() {
      if (revisitIndex >= skippedCountries.length) {
        // All skipped done, show results
        finishGame();
        return;
      }
      let item = skippedCountries[revisitIndex];
      if (gameType === "countries") {
        currentContinent = item.continent;
        currentLetter = item.letter;
        let promptText = `SKIPPED: Name a country in ${currentContinent} starting with "${currentLetter}"`;
        document.getElementById("prompt").innerText = promptText;
      } else {
        currentCountry = item;
        let promptText = `SKIPPED: What is the capital of ${currentCountry.country}?`;
        document.getElementById("prompt").innerText = promptText;
      }
      // Wait for user to answer
      let oldSubmit = submitAnswer;
      submitAnswer = function() {
        const rawInput = answerInput.value.trim();
        answerInput.value = "";
        autocompleteList.innerHTML = "";
        if (!rawInput) return;
        if (rawInput.toLowerCase() === "skip") {
          revisitIndex++;
          setTimeout(revisitSkipped, 300);
          return;
        }
        if (gameType === "countries") {
          let rec = nameIndex.get(normalizeName(rawInput));
          if (!rec || rec.name !== item.country.name) {
            showMessage(`Wrong! The answer was ${item.country.name}`, 'error');
            wrongGuesses++;
            revisitIndex++;
            setTimeout(revisitSkipped, 700);
            return;
          }
          showMessage('Correct!', 'check');
          revealCountry(rec);
          revisitIndex++;
          setTimeout(revisitSkipped, 700);
        } else {
          let rec = capitalsIndex.get(normalizeName(rawInput));
          if (!rec || rec.capital !== item.capital) {
            showMessage(`Wrong! The answer was ${item.capital}`, 'error');
            wrongGuesses++;
            revisitIndex++;
            setTimeout(revisitSkipped, 700);
            return;
          }
          showMessage('Correct!', 'check');
          revealCapital(rec);
          revisitIndex++;
          setTimeout(revisitSkipped, 700);
        }
      };
    }
    revisitSkipped();

    function finishGame() {
      clearInterval(timerInterval);
      if (timedModeActive) {
        // Timed mode: show points total
        document.getElementById("results-text").innerHTML = `
              <div>Game Over! (${gameType==="countries"?gameMode+" Countries":"Cities "+gameMode} Mode)</div>
              <div>Total Points: <strong>${score}</strong></div>`;
      } else {
        // Non-timed: show time, wrong attempts, accuracy
        const totalSec = Math.floor(elapsed / 1000);
        const min = Math.floor(totalSec / 60),
          sec = totalSec % 60;
        const correct = round - 1;
        const total = correct + wrongGuesses;
        const percent = total > 0 ? ((correct / total) * 100).toFixed(1) : 100;
        document.getElementById("results-text").innerHTML = `
            <div>Game Over! (${gameType==="countries"?gameMode+" Countries":"Cities "+gameMode} Mode)</div>
            <div>Time: ${min}:${sec.toString().padStart(2,"0")}</div>
               <div>Wrong Attempts: ${wrongGuesses}</div>
               <div>Accuracy: ${percent}%</div>`;
      }
      resultsShown = true;
      document.getElementById("results-screen").style.display = "flex";
      submitAnswer = oldSubmit;
    }
    return;
  }
  // No skipped countries, show results
  clearInterval(timerInterval);
  if (timedModeActive) {
    document.getElementById("results-text").innerHTML = `
      <div>Game Over! (${gameType==="countries"?gameMode+" Countries":"Cities "+gameMode} Mode)</div>
      <div>Total Points: <strong>${score}</strong></div>`;
  } else {
    const totalSec = Math.floor(elapsed / 1000);
    const min = Math.floor(totalSec / 60),
      sec = totalSec % 60;
    const correct = round - 1;
    const total = correct + wrongGuesses;
    const percent = total > 0 ? ((correct / total) * 100).toFixed(1) : 100;
    document.getElementById("results-text").innerHTML = `
      <div>Game Over! (${gameType==="countries"?gameMode+" Countries":"Cities "+gameMode} Mode)</div>
      <div>Time: ${min}:${sec.toString().padStart(2,"0")}</div>
         <div>Wrong Attempts: ${wrongGuesses}</div>
         <div>Accuracy: ${percent}%</div>`;
  }
  document.getElementById("results-screen").style.display = "flex";
  resultsShown = true;
}

function startGame(mode) {
  gameMode = mode;
  // Ensure any timed mode is cancelled when starting a regular game
  timedModeActive = false;
  // fresh run: ensure results overlay can appear later
  resultsShown = false;
  if (timedTimeout) {
    clearTimeout(timedTimeout);
    timedTimeout = null;
  }
  const ac = document.getElementById('autocomplete-list');
  if (ac) ac.style.display = '';
  // reset score for a fresh game
  score = 0;
  document.getElementById("start-screen").style.display = "none";
  round = 1;
  noregdip = 0;
  wrongGuesses = 0;
  revealedCountries.clear();
  revealedCapitals.clear();
  capitalDots.forEach(dot => dot.remove());
  capitalDots = [];
  if (gameType === "countries") {
    startTimer();
    nextRound();
  } else {
    mapGroup.selectAll("path.country").classed("revealed", true);
    capitalsOrder.forEach((rec, i) => {
      const coords = projection([rec.latlng[1], rec.latlng[0]]);
      const dot = mapGroup.append("circle")
        .attr("cx", coords[0]).attr("cy", coords[1])
        .attr("r", 2)
        .attr("class", "capital-dot capital-dot-grey")
        .attr("data-capital", rec.capital)
        .attr("data-country", rec.country);
      capitalDots.push(dot);
    });
    startTimer();
    nextCitiesRound();
  }
}
