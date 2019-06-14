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

import { DetectedImage } from '../../../defs/detected-image.js';
import { Marker } from '../../../defs/marker.js';
import { ArtifactDealer, ProbableTargets } from '../../../src/artifacts/artifact-dealer.js';
import { ArtifactLoader } from '../../artifacts/artifact-loader.js';
import { ARArtifact } from '../../artifacts/schema/extension-ar-artifacts.js';
import { ArtifactStore, PerceptionResult, PerceptionState } from '../../artifacts/stores/artifact-store.js';
import { LocalArtifactStore } from '../../artifacts/stores/local-artifact-store.js';
import { generateMarkerId } from '../../utils/generate-marker-id.js';

// TODO: Move this to config manager
export type ShouldLoadArtifactsFromCallback = ((url: URL) => boolean) | string[];

export interface PerceptionStateChangeRequest extends PerceptionState {
  shouldLoadArtifactsFrom?: ShouldLoadArtifactsFromCallback;
}
export interface PerceptionStateChangeResponse extends ProbableTargets {
  found: PerceptionResult[];
  lost: PerceptionResult[];
  newTargets: Array<Marker | DetectedImage>;
}

/**
 * @hidden
 *
 * MeaningMaker binds the Artifacts components with the rest of the Perception Toolkit.
 * It provides a good set of default behaviours, but can be replaced with alternative
 * strategies in advanced cases.
 *
 * Things MeaningMaker adds in addition to just exposing `src/artficts/`:
 * * Creates a default Artifact Loader, Store, and Dealer.
 * * Automatically loads Artifacts from embedding Document on init.
 * * Attempts to index Pages when Markers are URLs.
 * * Makes sure to only index content from supported domains/URLs.
 */
export class MeaningMaker {
  // TODO: this should probably a set # of frames, i.e. N * ms-between-captures-in-passive-mode
  private _lastSeenTimeBuffer = 2000; // ms

  private readonly artloader = new ArtifactLoader();
  private readonly artstore = new LocalArtifactStore();
  private readonly artdealer = new ArtifactDealer();
  private prevPerceptionResults = new Set<PerceptionResult>();
  private artifactsForUrl = new Map<string, ARArtifact[]>();
  private lastSeenMarkers = new Map<string, { marker: Marker, timestamp: number }>();
  private lastSeenImages = new Map<string, { image: DetectedImage, timestamp: number }>();

  constructor() {
    this.addArtifactStore(this.artstore);
  }

  /**
   * Load artifact content for initial set.
   */
  async init() {
    const artifacts = await this.artloader.fromElement(document, document.URL);
    this.artifactsForUrl.set(document.URL, artifacts);
    this.saveArtifacts(artifacts);
  }

  /**
   * Get/Set the amount of time (in ms) to wait after a target is last seen (i.e. included in `PerceptionState`
   * argument of `updatePerceptionState`), will it actually be considered lost.
   *
   * This is used so we do not spuriously lose/find targets whenever they are not detected in a few frame captures.
   */
  get lastSeenTimeBuffer()           { return this._lastSeenTimeBuffer; }
  set lastSeenTimeBuffer(ms: number) { this._lastSeenTimeBuffer = ms; }

  /**
   * Add another ArtifactStore to the ArtifactDealer.
   */
  addArtifactStore(store: ArtifactStore) {
    this.artdealer.addArtifactStore(store);
  }

  /**
   * Load artifact content from Url, unconditionally.
   *
   * Usually this is used only for loading Urls which were explicitly configured by developer, on startup.
   * See `loadArtifactsFromSupportedUrl` (below) for the more common case.
   */
  async loadArtifactsFromUrl(url: URL): Promise<ARArtifact[]> {
    if (this.artifactsForUrl.has(url.toString())) {
      return this.artifactsForUrl.get(url.toString()) as ARArtifact[];
    }
    const artifacts = await this.artloader.fromUrl(url);
    this.saveArtifacts(artifacts);
    this.artifactsForUrl.set(url.toString(), artifacts);
    return artifacts;
  }

  /**
   * Load artifact content from url, only if Url is deemed appropriate (by config options).
   *
   * Usually this is used for Urls which not expected, but discovered (e.g. from URL-based Markers).
   *
   * By default, we restrict to same-origin, but you can pass a custom fn or list of domains.
   */
  async loadArtifactsFromSupportedUrl(url: URL,
                                      shouldLoadArtifactsFrom?: ShouldLoadArtifactsFromCallback) {
    // If there's no callback provided, match to current origin.
    if (!shouldLoadArtifactsFrom) {
      shouldLoadArtifactsFrom = (url: URL) => url.origin === window.location.origin;
    } else if (Array.isArray(shouldLoadArtifactsFrom)) {
      // If an array of strings, remap it.
      const origins = shouldLoadArtifactsFrom;
      shouldLoadArtifactsFrom = (url: URL) => !!origins.find(o => o === url.origin);
    }

    if (!shouldLoadArtifactsFrom(url)) {
      return [];
    }

    return this.loadArtifactsFromUrl(url);
  }

  /*
   * Returns the full set of potential images which are worthy of detection at this moment.
   * Each DetectableImage has one unique id, and also a list of potential Media which encodes it.
   * It is up to the caller to select the correct media encoding.
   */
  async updatePerceptionState(request: PerceptionStateChangeRequest): Promise<PerceptionStateChangeResponse>  {
    const newTargets = [];

    // First, update lastSeen times for all the targets.  Keep track of new targets.
    const now = performance.now();
    for (const marker of request.markers || []) {
      const markerId = generateMarkerId(marker);
      if (!this.lastSeenMarkers.has(markerId)) {
        newTargets.push(marker);
      }
      this.lastSeenMarkers.set(markerId, { marker, timestamp: now });
    }
    for (const image of request.images || []) {
      const imageId = image.id;
      if (!this.lastSeenMarkers.has(imageId)) {
        newTargets.push(image);
      }
      this.lastSeenImages.set(imageId, { image, timestamp: now });
    }

    // Now, remove all the target that we haven't seen for a while
    for (const [markerId, { timestamp }] of this.lastSeenMarkers.entries()) {
      if (now - timestamp > this._lastSeenTimeBuffer) {
        this.lastSeenMarkers.delete(markerId);
      }
    }
    for (const [imageId, { timestamp }] of this.lastSeenImages.entries()) {
      if (now - timestamp > this.lastSeenTimeBuffer) {
        this.lastSeenImages.delete(imageId);
      }
    }

    // Check if markers are URLs worth indexing
    await Promise.all((request.markers || [])
        .map((marker) => this.checkMarkerIsDynamic(marker, request.shouldLoadArtifactsFrom)));

    // Perception state includes all the markers/images we have seen recently.
    const state: PerceptionState = {
      markers: Array.from(this.lastSeenMarkers.values(), ({ marker }) => marker),
      geo: request.geo,
      images: Array.from(this.lastSeenImages.values(), ({ image }) => image)
    };

    const nearbyResults = await this.artdealer.getPerceptionResults(state);
    const uniqueNearbyResults = new Set(nearbyResults);

    // Diff with previous list to compute new/old artifacts.
    //  - New ones are those which haven't appeared before.
    //  - Old ones are those which are no longer nearby.
    //  - The remainder (intersection) are not reported.
    const found: PerceptionResult[] = [...uniqueNearbyResults].filter(a => !this.prevPerceptionResults.has(a));
    const lost: PerceptionResult[] = [...this.prevPerceptionResults].filter(a => !uniqueNearbyResults.has(a));

    // Update current set of nearbyResults.
    this.prevPerceptionResults = uniqueNearbyResults;

    const ret: PerceptionStateChangeResponse = {
      found,
      lost,
      newTargets,
      ...await this.artdealer.predictPerceptionTargets(request)
    };

    return ret;
  }

  /*
   * If this marker is a URL, try loading artifacts from that URL
   *
   * `shouldLoadArtifactsFrom` is called if marker is a URL value.  If it returns `true`, MeaningMaker will index that
   * URL and extract Artifacts, if it has not already done so.
   *
   * returns `NearbyResultDelta` which can be used to update UI.
   */
  private async checkMarkerIsDynamic(marker: Marker, shouldLoadArtifactsFrom?: ShouldLoadArtifactsFromCallback) {
    try {
      // Attempt to convert markerValue to URL.  This will throw if markerValue isn't a valid URL.
      // Do not supply a base url argument, since we do not want to support relative URLs,
      // and because that would turn lots of normal string values into valid relative URLs.
      const url = new URL(marker.value);
      await this.loadArtifactsFromSupportedUrl(url, shouldLoadArtifactsFrom);
    } catch (_) {
      // Do nothing if this isn't a valid URL
    }
  }

  private saveArtifacts(artifacts: ARArtifact[]) {
    for (const artifact of artifacts) {
      this.artstore.addArtifact(artifact);
    }
  }
}
