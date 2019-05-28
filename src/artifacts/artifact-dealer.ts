/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { flat } from '../utils/flat.js';
import { Marker } from '../../defs/marker.js';
import { generateMarkerId } from '../utils/generate-marker-id.js';
import { ARArtifact, ARTargetTypes, ARContentTypes } from './schema/extension-ar-artifacts.js';
import { GeoCoordinates } from './schema/core-schema-org.js';
import { ArtifactStore } from './stores/artifact-store.js';
import { DetectedImage } from '../../defs/detected-image.js';

export interface NearbyResult {
  target?: ARTargetTypes;
  content?: ARContentTypes;
  artifact: ARArtifact;
}

export interface NearbyResultDelta {
  found: NearbyResult[];
  lost: NearbyResult[];
}

export class ArtifactDealer {
  private readonly artstores: ArtifactStore[] = [];
  private readonly nearbyMarkers = new Map<string, Marker>();
  private readonly nearbyImages = new Map<string, DetectedImage>();
  private nearbyResults = new Set<NearbyResult>();
  private currentGeolocation: GeoCoordinates = {};

  async addArtifactStore(artstore: ArtifactStore): Promise<NearbyResultDelta> {
    this.artstores.push(artstore);
    return this.generateDiffs();
  }

  async updateGeolocation(coords: GeoCoordinates): Promise<NearbyResultDelta> {
    this.currentGeolocation = coords;
    return this.generateDiffs();
  }

  async markerFound(marker: Marker): Promise<NearbyResultDelta> {
    this.nearbyMarkers.set(generateMarkerId(marker.type, marker.value), marker);
    return this.generateDiffs();
  }

  async markerLost(marker: Marker): Promise<NearbyResultDelta> {
    this.nearbyMarkers.delete(generateMarkerId(marker.type, marker.value));
    return this.generateDiffs();
  }

  async imageFound(detectedImage: DetectedImage): Promise<NearbyResultDelta> {
    this.nearbyImages.set(detectedImage.id, detectedImage);
    return this.generateDiffs();
  }

  async imageLost(detectedImage: DetectedImage): Promise<NearbyResultDelta> {
    this.nearbyImages.delete(detectedImage.id);
    return this.generateDiffs();
  }

  // TODO (#34): Change ArtStore's `findRelevantArtifacts` to be async
  // TODO (#33): Replace map+flat with flatMap once it is polyfilled for all platforms.
  private async generateDiffs(): Promise<NearbyResultDelta> {
    // 1. Using current context (geo, markers), ask artstores to compute relevant artifacts
    const pendingNearbyResults: Set<NearbyResult> = new Set(flat(await Promise.all(this.artstores.map((artstore) => {
      return artstore.findRelevantArtifacts(
        Array.from(this.nearbyMarkers.values()),
        this.currentGeolocation,
        Array.from(this.nearbyImages.values())
      );
    }))));

    // 2. Diff with previous list to compute new/old artifacts.
    //    New ones are those which haven't appeared before.
    //    Old ones are those which are no longer nearby.
    //    The remainder (intersection) are not reported.
    const newNearbyResults: NearbyResult[] = [...pendingNearbyResults].filter(a => !this.nearbyResults.has(a));
    const oldNearbyresults: NearbyResult[] = [...this.nearbyResults].filter(a => !pendingNearbyResults.has(a));

    const ret: NearbyResultDelta = {
      found: [],
      lost: []
    };

    // 3. Compute
    for (const { target, artifact } of newNearbyResults) {
      const content = artifact.arContent;
      ret.found.push({ target, content, artifact });
    }

    for (const { target, artifact } of oldNearbyresults) {
      const content = artifact.arContent;
      ret.lost.push({ target, content, artifact });
    }

    // 4. Update current set of nearbyResults.
    this.nearbyResults = pendingNearbyResults;

    return ret;
  }

}
