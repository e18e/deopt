import { keyLocation, byLocationKey } from './location.js';

class FileLocationGrouper {
  #id;
  #fileGroup;

  constructor(fileGroup) {
    this.#id = 0;
    this.#fileGroup = fileGroup;
  }

  locationsForFileGroup() {
    const { ics, deopts, codes } = this.#fileGroup;
    const { dataByLocation: icsByLocation, locations: icLocations } =
      this.#extractLocations(ics);
    const { dataByLocation: deoptsByLocation, locations: deoptLocations } =
      this.#extractLocations(deopts);
    const { dataByLocation: codesByLocation, locations: codeLocations } =
      this.#extractLocations(codes);

    const sortedIcLocations = Array.from(icLocations).sort(byLocationKey);
    const sortedDeoptLocations = Array.from(deoptLocations).sort(byLocationKey);
    const sortedCodeLocations = Array.from(codeLocations).sort(byLocationKey);
    return {
      icsByLocation,
      deoptsByLocation,
      codesByLocation,
      icLocations: sortedIcLocations,
      deoptLocations: sortedDeoptLocations,
      codeLocations: sortedCodeLocations,
    };
  }

  #extractLocations(dataPoints) {
    const dataByLocation = new Map();
    const locations = new Set();
    for (const dataPoint of dataPoints) {
      const { functionName, line, column } = dataPoint;
      const locationKey = keyLocation({ functionName, line, column });
      locations.add(locationKey);
      dataPoint.id = this.#id++;
      dataByLocation.set(locationKey, dataPoint);
    }
    return { dataByLocation, locations };
  }
}

export function groupByFileAndLocation(groupedByFile) {
  const groupedByFileAndLocation = new Map();
  for (const [file, fileGroup] of groupedByFile) {
    const fileLocationGrouper = new FileLocationGrouper(fileGroup);

    const {
      icsByLocation,
      deoptsByLocation,
      codesByLocation,
      deoptLocations,
      icLocations,
      codeLocations,
    } = fileLocationGrouper.locationsForFileGroup();

    groupedByFileAndLocation.set(
      file,
      Object.assign(fileGroup, {
        ics: icsByLocation,
        deopts: deoptsByLocation,
        codes: codesByLocation,
        deoptLocations,
        icLocations,
        codeLocations,
      }),
    );
  }

  return groupedByFileAndLocation;
}
