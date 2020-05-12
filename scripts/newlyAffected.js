const getNewlyAffectedZips = (oldZipCases, newZipCases) => {
  const newZips = Object.entries(newZipCases).reduce((zips, [zip, cases]) => {
	  if (zip !== "meta" && oldZipCases[zip] === '0' && newZipCases[zip] !== '0') {
      zips.push({
        zip,
        cases,
        population: zipMeta[zip].population,
        city: zipMeta[zip].city
      });
    }
    return zips;
  }, []);

  return newZips.map(({zip, cases, population, city}) => `* ${zip} (${city}), ${population} total residents, ${cases} confirmed cases`).join('\n');
}

