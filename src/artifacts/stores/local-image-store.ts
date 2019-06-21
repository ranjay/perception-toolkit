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
import { typeIsThing } from '../schema/core-schema-org.js';
import { ARArtifact, ARImageTarget } from '../schema/extension-ar-artifacts.js';
import { PerceptionResult } from './artifact-store.js';

export class LocalImageStore {
  private readonly images = new Map<string, PerceptionResult>();

  addImage(artifact: ARArtifact, imageTarget: ARImageTarget): boolean {
    if (!imageTarget.name) {
      return false;
    }

    this.images.set(imageTarget.name, { target: imageTarget, artifact });
    return true;
  }

  getDetectableImages(): DetectableImage[] {
    const allDetectableImages: DetectableImage[] = [];

    for (const { target } of this.images.values()) {
      if (!typeIsThing(target) || target['@type'] !== 'ARImageTarget' || !target.name) {
        continue;
      }
      const detectableImage: DetectableImage = {
        'id': target.name,
        'media': [],
      };

      if (typeIsThing(target.image)) {
        // target.image must be an ImageObject
        if (target.image['@type'] === 'ImageObject') {
          detectableImage.media.push(target.image);
        }
      } else if (target.image) {
        // target.image is a URL, convert it to a MediaObject
        detectableImage.media.push({
          '@type': 'ImageObject',
          'encodingUrl': target.image
        });
      }

      // encoding and associatedMedia as synonyms.  They already contain MediaObjects.
      if (target.hasOwnProperty('encoding')) {
        detectableImage.media = detectableImage.media.concat(target.encoding);
      }
      if (target.hasOwnProperty('associatedMedia')) {
        detectableImage.media = detectableImage.media.concat(target.associatedMedia);
      }

      allDetectableImages.push(detectableImage);
    }

    return allDetectableImages;
  }

  findRelevantArtifacts(detectedImages: DetectedImage[]): PerceptionResult[] {
    const ret = [];
    for (const detectedImage of detectedImages) {
      const nearbyResult = this.images.get(detectedImage.id);

      if (nearbyResult) {
        ret.push(nearbyResult);
      }
    }
    return ret;
  }
}
