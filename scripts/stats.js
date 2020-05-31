const getNewlyAffectedZips = (oldZipCases, newZipCases, zipMeta) => {
  const newZips = Object.entries(newZipCases).reduce((zips, [zip, cases]) => {
    if (
      zip !== "meta" &&
      oldZipCases[zip] === "0" &&
      newZipCases[zip] !== "0"
    ) {
      zips.push({
        zip,
        cases,
        population: zipMeta[zip].population,
        city: zipMeta[zip].city,
      });
    }
    return zips;
  }, []);

  return newZips
    .map(
      ({ zip, cases, population, city }) =>
        `* ${zip} (${city}), ${population} total residents, ${cases} confirmed cases`
    )
    .join("\n");
};

const getZipStats = (zipCases, zipMeta) => {
  const output = Object.values(zipMeta).reduce(
    (accum, { zip, population, city, countyNames }) => {
      const cases = zipCases[zip];

      if (!cases || cases === "0") {
        if (!cases) {
          console.warn('could not find cases for ', zip);
        }

        return {
          ...accum,
          nonAffectedZips: [...accum.nonAffectedZips, zip],
          nonAffectedZipPopulation:
            accum.nonAffectedZipPopulation + parseInt(population),
        };
      }

      return {
        ...accum,
        affectedZips: [...accum.affectedZips, zip],
        affectedZipPopulation:
          accum.affectedZipPopulation + parseInt(population),
        perCapita: [
          ...accum.perCapita,
          {
            zip,
            city,
            countyNames,
            population,
            cases,
            casesPerCapita: 10000 * (cases / population)
          }
        ]
      };
    },
    {
      affectedZips: [],
      affectedZipPopulation: 0,
      nonAffectedZips: [],
      nonAffectedZipPopulation: 0,
      perCapita: []
    }
  );

  return {
    ...output,
    topPerCapita: output.perCapita.sort(({casesPerCapita: casesPerCapitaA}, {casesPerCapita: casesPerCapitaB}) => casesPerCapitaB - casesPerCapitaA).slice(0, 15)
  }
};


/**

temp3.topPerCapita.reduce((accum, {zip, city, population, cases, casesPerCapita}) => {
  accum += `# ${casesPerCapita.toFixed(2)} cases per 10k: ${city} (${zip}), ${cases} cases / ${population} residents\n`;
  return accum;
}, '')

*/