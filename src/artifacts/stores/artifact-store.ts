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
import { GeoCoordinates } from '../schema/core-schema-org.js';
import { ARArtifact, ARTargetTypes } from '../schema/extension-ar-artifacts.js';

/*
 * PerceptionState is usually created per-captured video frame, and includes all the currently detected targets.
 */
export interface PerceptionState {
  markers?: Marker[];
  geo?: GeoCoordinates;
  images?: DetectedImage[];
}

/*
 * PerceptionResult combines an ARArtifact result, with the specific ARTargetType that was used to trigger it.
 */
export interface PerceptionResult {
  target?: ARTargetTypes;
  artifact: ARArtifact;
}

export interface ArtifactStore {
  getDetectableImages?(state: PerceptionState): Promise<DetectableImage[]>;
  findRelevantArtifacts?(state: PerceptionState): Promise<PerceptionResult[]>;
}
