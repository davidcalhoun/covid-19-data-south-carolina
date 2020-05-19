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
  return Object.values(zipMeta).reduce(
    (accum, { zip, population }) => {
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
      };
    },
    {
      affectedZips: [],
      affectedZipPopulation: 0,
      nonAffectedZips: [],
      nonAffectedZipPopulation: 0,
    }
  );
};
