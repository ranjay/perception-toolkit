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

import { LocalArtifactStore } from './stores/local-artifact-store.js';

const { assert } = chai;

import { ArtifactDealer } from './artifact-dealer.js';
import { Barcode } from './schema/core-schema-org.js';
import { ARImageTarget } from './schema/extension-ar-artifacts.js';

describe('ArtifactDealer', () => {
  let artDealer: ArtifactDealer;

  beforeEach(() => {
    artDealer = new ArtifactDealer();
  });

  it('supports adding stores', () => {
    artDealer.addArtifactStore(new LocalArtifactStore());
  });

  describe('Adding and Finding', () => {
    beforeEach(() => {
      const store = new LocalArtifactStore();
      artDealer.addArtifactStore(store);

      store.addArtifact({
        arTarget: { '@type': 'Barcode', 'text': 'Barcode1' },
        arContent: 'Fake URL'
      });
      store.addArtifact({
        arTarget: [
          { '@type': 'Barcode', 'text': 'Barcode2' },
          { '@type': 'Unsupported' },
        ],
        arContent: 'Fake URL'
      });
      store.addArtifact({
        arTarget: [
          { '@type': 'Barcode', 'text': 'Barcode3' },
          { '@type': 'Barcode', 'text': 'Barcode4' },
          { '@type': 'Barcode', 'text': 'Barcode5' },
        ],
        arContent: 'Fake URL'
      });
      store.addArtifact({
        arTarget: {
          '@type': 'ARImageTarget',
          'name': 'Id1',
          'image': 'Fake URL'
        },
        arContent: 'Fake URL'
      });
      store.addArtifact({
        arTarget: {
          '@type': 'ARImageTarget',
          'name': 'Id2',
          'image': {
            '@type': 'ImageObject',
            'contentUrl': 'FakeUrl'
          }
        },
        arContent: 'Fake URL'
      });
      store.addArtifact({
        arTarget: {
          '@type': 'ARImageTarget',
          'name': 'Id3',
          'encoding': [{
            '@type': 'ImageObject',
            'contentUrl': 'FakeUrl'
          }]
        },
        arContent: 'Fake URL'
      });
    });

    it('Ignores unknown markers', async () => {
      const result = await artDealer.getPerceptionResults({
        markers: [{
          type: 'qrcode',
          value: 'Unknown Marker'
        }]
      });
      assert.isArray(result);
      assert.isEmpty(result);
    });

    it('Finds known barcodes', async () => {
      const markers = [];
      await Promise.all(['Barcode1', 'Barcode2', 'Barcode3', 'Barcode4', 'Barcode5'].map(async (value, i) => {
        markers.push({
          type: 'qrcode',
          value
        });
        const result = await artDealer.getPerceptionResults({ markers: Array.from(markers) });
        assert.isArray(result);
        assert.lengthOf(result, i + 1);
        assert.equal((result[i].target as Barcode).text, value);
      }));
    });

    it('Finds known images', async () => {
      const images = [];
      await Promise.all(['Id1', 'Id2', 'Id3'].map(async (id, i) => {
        images.push({ id });
        const result = await artDealer.getPerceptionResults({ images: Array.from(images) });
        assert.isArray(result);
        assert.lengthOf(result, i + 1);
        assert.equal((result[i].target as ARImageTarget).name, id);
      }));
    });

    it('Ignores geolocation', async () => {
      const result = await artDealer.getPerceptionResults({ geo: {} });
      assert.isArray(result);
      assert.isEmpty(result);
    });
  });

  describe('Multiple Stores', () => {
    it('supports adding multiple stores', async () => {
      const store1 = new LocalArtifactStore();
      const store2 = new LocalArtifactStore();
      artDealer.addArtifactStore(store1);
      artDealer.addArtifactStore(store2);

      store1.addArtifact({
        arTarget: { '@type': 'Barcode', 'text': 'Barcode1' },
        arContent: 'Fake URL'
      });
      store2.addArtifact({
        arTarget: { '@type': 'Barcode', 'text': 'Barcode2' },
        arContent: 'Fake URL'
      });

      const result1 = await artDealer.getPerceptionResults({
        markers: [{
          type: 'qrcode',
          value: 'Barcode1'
        }]
      });
      assert.isArray(result1);
      assert.lengthOf(result1, 1);
      assert.equal((result1[0].target as Barcode).text, 'Barcode1');

      const result2 = await artDealer.getPerceptionResults({
        markers: [{
          type: 'qrcode',
          value: 'Barcode2'
        }]
      });
      assert.isArray(result2);
      assert.lengthOf(result2, 1);
      assert.equal((result2[0].target as Barcode).text, 'Barcode2');
    });
  });
});
