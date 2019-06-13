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

const { assert } = chai;

import { LocalArtifactStore } from './local-artifact-store.js';
import { ARArtifact, ARTargetTypes, ARImageTarget } from '../schema/extension-ar-artifacts.js';
import { Barcode } from '../schema/core-schema-org.js';

describe('LocalArtifactStore', () => {
  let localArtifactStore: LocalArtifactStore;

  beforeEach(() => {
    localArtifactStore = new LocalArtifactStore();
  });

  it('accepts barcodes', () => {
    const barcode: Barcode = { '@type': 'Barcode', 'text': 'Barcode Value' };
    const artifact: ARArtifact = {
      arTarget: barcode,
      arContent: 'Fake URL'
    };
    assert.doesNotThrow(() => {
      const totalAdded = localArtifactStore.addArtifact(artifact);
      assert.equal(totalAdded, 1);
    });
  });

  it('accepts images', async () => {
    const image: ARImageTarget = { '@type': 'ARImageTarget', 'name': 'ID1', 'image': 'Fake URL' };
    const artifact: ARArtifact = {
      arTarget: image,
      arContent: 'Fake URL'
    };
    assert.doesNotThrow(async () => {
      const totalAdded = localArtifactStore.addArtifact(artifact);
      assert.equal(totalAdded, 1);

      const detectableImages = await localArtifactStore.getDetectableImages();
      assert.isArray(detectableImages);
      assert.lengthOf(detectableImages, 1);
    });
  });

  it('ignores malformed inputs', () => {
    assert.doesNotThrow(() => {
      const totalAdded = localArtifactStore.addArtifact({});
      assert.equal(totalAdded, 0);
    });
  });

  it('accepts artifact with list of targets', () => {
    const artifact: ARArtifact = {
      arTarget: [
        { '@type': 'Barcode', 'text': 'Barcode1' },
        { '@type': 'Barcode', 'text': 'Barcode2' },
        { '@type': 'ARImageTarget', 'name': 'ID1', 'image': 'Fake URL' },
        { '@type': 'ARImageTarget', 'name': 'ID2', 'image': 'Fake URL' },
      ],
      arContent: 'Fake URL'
    };
    assert.doesNotThrow(() => {
      const totalAdded = localArtifactStore.addArtifact(artifact);
      assert.equal(totalAdded, (artifact.arTarget as ARTargetTypes[]).length);
    });
  });

  it('accepts artifact with some unsupported targets', () => {
    const artifact: ARArtifact = {
      arTarget: [
        { '@type': 'Barcode', 'text': 'Barcode1' },
        { '@type': 'Unsupported' },
      ],
      arContent: 'Fake URL'
    };
    assert.doesNotThrow(() => {
      const totalAdded = localArtifactStore.addArtifact(artifact);
      assert.equal(totalAdded, 1);
    });
  });

  describe('FindRelevantMarkers', () => {
    beforeEach(() => {
      localArtifactStore.addArtifact({
        arTarget: { '@type': 'Barcode', 'text': 'Barcode Value' },
        arContent: 'Fake URL'
      });
      localArtifactStore.addArtifact({
        arTarget: { '@type': 'ARImageTarget', 'name': 'ID1', 'image': 'Fake URL' },
        arContent: 'Fake URL'
      });
    });

    it('finds barcodes', async () => {
      const results = await localArtifactStore.findRelevantArtifacts({
        markers: [{
          type: 'qrcode',
          value: 'Barcode Value'
        }]
      });
      assert.lengthOf(results, 1);
    });

    it('finds images', async () => {
      const results = await localArtifactStore.findRelevantArtifacts({
        images: [{
          id: 'ID1'
        }]
      });
      assert.lengthOf(results, 1);
    });

    it('can find both barcodes and images at once', async () => {
      const results = await localArtifactStore.findRelevantArtifacts({
        markers: [{
          type: 'qrcode',
          value: 'Barcode Value'
        }],
        images: [{
          id: 'ID1'
        }]
      });
      assert.lengthOf(results, 2);
    });
  });
});
