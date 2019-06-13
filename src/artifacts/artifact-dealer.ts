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
import { ArtifactStore, PerceptionResult, PerceptionState } from './stores/artifact-store.js';

export interface ProbableTargets {
  detectableImages: DetectableImage[];
}

export class ArtifactDealer {
  private readonly artstores: ArtifactStore[] = [];

  async addArtifactStore(artstore: ArtifactStore) {
    this.artstores.push(artstore);
  }

  async predictPerceptionTargets(request: PerceptionState): Promise<ProbableTargets> {
    const allStoreResults = await Promise.all(this.artstores.map((artstore) => {
      if (!artstore.getDetectableImages) {
        return [];
      }
      return artstore.getDetectableImages(request);
    }));
    return { detectableImages: flat(allStoreResults) };
  }

  async getPerceptionResults(context: PerceptionState): Promise<PerceptionResult[]> {
    // Using current context (geo, markers), ask artstores to compute relevant artifacts
    const allStoreResults = await Promise.all(this.artstores.map((artstore) => {
      if (!artstore.findRelevantArtifacts) {
        return [];
      }
      return artstore.findRelevantArtifacts(context);
    }));

    return flat(allStoreResults);
  }

}
