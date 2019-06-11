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

import { DetectableImage } from '../../defs/detected-image.js';
import { flat } from '../utils/flat.js';
import { ArtifactStore, PerceptionContext, PerceptionResult } from './stores/artifact-store.js';

export interface PerceptionResultDelta {
  found: PerceptionResult[];
  lost: PerceptionResult[];
}

export interface NextFrameContext {
  detectableImages: DetectableImage[];
}

export class ArtifactDealer {
  private readonly artstores: ArtifactStore[] = [];
  private prevPerceptionResults = new Set<PerceptionResult>();

  async addArtifactStore(artstore: ArtifactStore) {
    this.artstores.push(artstore);
  }

  async getNextFrameContext(request: PerceptionContext): Promise<NextFrameContext> {
    const allStoreResults = await Promise.all(this.artstores.map((artstore) => {
      if (!artstore.getDetectableImages) {
        return [];
      }
      return artstore.getDetectableImages();
    }));
    return { detectableImages: flat(allStoreResults) };
  }

  async perceive(context: PerceptionContext): Promise<PerceptionResultDelta> {
    // Using current context (geo, markers), ask artstores to compute relevant artifacts
    const allStoreResults = await Promise.all(this.artstores.map((artstore) => {
      if (!artstore.findRelevantArtifacts) {
        return [];
      }
      return artstore.findRelevantArtifacts(context);
    }));
    const uniqueNearbyResults: Set<PerceptionResult> = new Set(flat(allStoreResults));

    // Diff with previous list to compute new/old artifacts.
    //  - New ones are those which haven't appeared before.
    //  - Old ones are those which are no longer nearby.
    //  - The remainder (intersection) are not reported.
    const newNearbyResults: PerceptionResult[] =
        [...uniqueNearbyResults].filter(a => !this.prevPerceptionResults.has(a));
    const oldNearbyresults: PerceptionResult[] =
        [...this.prevPerceptionResults].filter(a => !uniqueNearbyResults.has(a));

    const ret: PerceptionResultDelta = {
      found: [...newNearbyResults],
      lost: [...oldNearbyresults]
    };

    // Update current set of nearbyResults.
    this.prevPerceptionResults = uniqueNearbyResults;

    return ret;
  }

}
