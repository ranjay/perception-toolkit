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
      const result = await artDealer.markerFound({
        type: 'qrcode',
        value: 'Unknown Marker'
      });
      assert.isArray(result.found);
      assert.isEmpty(result.found);
      assert.isArray(result.lost);
      assert.isEmpty(result.lost);
    });

    it('Finds known barcodes', async () => {
      for (const value of ['Barcode1', 'Barcode2', 'Barcode3', 'Barcode4', 'Barcode5']) {
        const result = await artDealer.markerFound({
          type: 'qrcode',
          value
        });
        assert.isArray(result.found);
        assert.lengthOf(result.found, 1);
        assert.equal((result.found[0].target as Barcode).text, value);

        assert.isArray(result.lost);
        assert.isEmpty(result.lost);
      }
    });

    it('Finds known images', async () => {
      for (const id of ['Id1', 'Id2', 'Id3']) {
        const result = await artDealer.imageFound({ id });
        assert.isArray(result.found);
        assert.lengthOf(result.found, 1);
        assert.equal((result.found[0].target as ARImageTarget).name, id);

        assert.isArray(result.lost);
        assert.isEmpty(result.lost);
      }
    });

    it('Loses known markers', async () => {
      await artDealer.markerFound({
        type: 'qrcode',
        value: 'Barcode1'
      });
      const result = await artDealer.markerLost({
        type: 'qrcode',
        value: 'Barcode1'
      });
      assert.isArray(result.found);
      assert.isEmpty(result.found);

      assert.isArray(result.lost);
      assert.lengthOf(result.lost, 1);
      assert.equal((result.lost[0].target as Barcode).text, 'Barcode1');
    });

    it('Loses known images', async () => {
      await artDealer.imageFound({ id: 'Id1' });
      const result = await artDealer.imageLost({ id: 'Id1' });
      assert.isArray(result.found);
      assert.isEmpty(result.found);

      assert.isArray(result.lost);
      assert.lengthOf(result.lost, 1);
      assert.equal((result.lost[0].target as ARImageTarget).name, 'Id1');
    });

    it('Ignores geolocation', async () => {
      const result = await artDealer.updateGeolocation({});
      assert.isArray(result.found);
      assert.isEmpty(result.found);
      assert.isArray(result.lost);
      assert.isEmpty(result.lost);
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

      const result1 = await artDealer.markerFound({
        type: 'qrcode',
        value: 'Barcode1'
      });
      assert.isArray(result1.found);
      assert.lengthOf(result1.found, 1);
      assert.equal((result1.found[0].target as Barcode).text, 'Barcode1');

      assert.isArray(result1.lost);
      assert.isEmpty(result1.lost);

      const result2 = await artDealer.markerFound({
        type: 'qrcode',
        value: 'Barcode2'
      });
      assert.isArray(result2.found);
      assert.lengthOf(result2.found, 1);
      assert.equal((result2.found[0].target as Barcode).text, 'Barcode2');

      assert.isArray(result2.lost);
      assert.isEmpty(result2.lost);
    });
  });
});
