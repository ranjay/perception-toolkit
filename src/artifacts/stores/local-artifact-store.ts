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

import { DetectableImage, DetectedImage } from '../../../defs/detected-image.js';
import { Marker } from '../../../defs/marker.js';
import { NearbyResult } from '../artifact-dealer.js';
import { Barcode, GeoCoordinates, Thing, typeIsThing } from '../schema/core-schema-org.js';
import { ARArtifact, ARImageTarget, ARTargetTypes } from '../schema/extension-ar-artifacts.js';
import { ArtifactStore } from './artifact-store.js';
import { LocalImageStore } from './local-image-store.js';
import { LocalMarkerStore } from './local-marker-store.js';

export class LocalArtifactStore implements ArtifactStore {
  private readonly markerStore = new LocalMarkerStore();
  private readonly imageStore = new LocalImageStore();

  addArtifact(artifact: ARArtifact): number {
    if (!artifact.arTarget) {
      return 0;
    }

    let targets: ARTargetTypes[];
    if (Array.isArray(artifact.arTarget)) {
      targets = artifact.arTarget;
    } else {
      targets = [artifact.arTarget];
    }

    let totalAdded = 0;
    for (const target of targets) {
      if (!typeIsThing(target)) {
        continue;
      }
      switch (target['@type']) {
        case 'Barcode':
          if (this.markerStore.addMarker(artifact, target)) {
            totalAdded++;
          }
          break;

        case 'ARImageTarget':
          if (this.imageStore.addImage(artifact, target)) {
            totalAdded++;
          }
          break;

        default:
          break; // We ignore types we don't support, and move on
      }
    }
    return totalAdded;
  }

  async findRelevantArtifacts(nearbyMarkers: Marker[], geo: GeoCoordinates, detectedImages: DetectedImage[]
      ): Promise<NearbyResult[]> {
    return [
      ...this.markerStore.findRelevantArtifacts(nearbyMarkers),
      ...this.imageStore.findRelevantArtifacts(detectedImages),
    ];
  }

  async getDetectableImages(): Promise<DetectableImage[]> {
    return this.imageStore.getDetectableImages();
  }
}
