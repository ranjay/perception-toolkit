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

import { ArtifactLoader } from './artifact-loader.js';

describe('ArtifactLoader', () => {
  let artLoader: ArtifactLoader;

  beforeEach(() => {
    artLoader = new ArtifactLoader();
  });

  it('passes JSON to ArtifactDecoder', async () => {
    const result = await artLoader.fromJson({
      '@type': 'ARArtifact',
      'arTarget': {},
      'arContent': {},
    });
    assert.isArray(result);
    assert.lengthOf(result, 1);
    assert.containsAllKeys(result[0], ['@type', 'arTarget', 'arContent']);
  });

  it('decodes inline script', async () => {
    const html = `
      <!doctype html>
      <html>
      <head>
      <script type="application/ld+json">
      {
        "@type": "ARArtifact",
        "arTarget": {},
        "arContent": {}
      }
      </script>
      </head>
      </html>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const result = await artLoader.fromElement(doc, 'Fake URL');
    assert.isArray(result);
    assert.lengthOf(result, 1);
    assert.containsAllKeys(result[0], ['@type', 'arTarget', 'arContent']);
  });

  it('decodes nested inline script', async () => {
    const html = `
      <!doctype html>
      <html>
      <head>
      </head>
      <body>
        <div><p>
          <script type="application/ld+json">
          {
            "@type": "ARArtifact",
            "arTarget": {},
            "arContent": {}
          }
          </script>
          </p></div>
        </body>
      </html>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const result = await artLoader.fromElement(doc, 'Fake URL');
    assert.isArray(result);
    assert.lengthOf(result, 1);
    assert.containsAllKeys(result[0], ['@type', 'arTarget', 'arContent']);
  });

  it('decodes mulitple inline scripts', async () => {
    const html = `
      <!doctype html>
      <html>
      <head>
      <script type="application/ld+json">
      {
        "@type": "ARArtifact",
        "arTarget": {},
        "arContent": {}
      }
      </script>
      </head>
      <body>
        <div><p>
          <script type="application/ld+json">
          {
            "@type": "ARArtifact",
            "arTarget": {},
            "arContent": {}
          }
          </script>
          </p></div>
        </body>
      </html>
    `;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const result = await artLoader.fromElement(doc, 'Fake URL');
    assert.isArray(result);
    assert.lengthOf(result, 2);
  });

  it('discovers artifacts from HTML pages, by URL', async () => {
    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts = await artLoader.fromHtmlUrl(url);
    assert.isArray(artifacts);
    assert.lengthOf(artifacts, 1);
  });

  it('discovers artifacts from JSON-LD documents, by URL', async () => {
    const url = new URL('/base/test-assets/test-json.jsonld', window.location.href);
    const artifacts = await artLoader.fromJsonUrl(url);
    assert.isArray(artifacts);
    assert.lengthOf(artifacts, 1);
  });

  it('discovers artifacts from HTML pages, using URLs of unknown content type', async () => {
    const url = new URL('/base/test-assets/dow.location.href');
    const artifacts = await artLoader.fromUrl(url);
    assert.isArray(artifacts);
    assert.lengthOf(artifacts, 1);
  });
  
  it('discovers artifacts from HTML pages, using URLs of unknown content type', async () => {
    const url = new URL('/base/test-assets/test-json.jsonld', window.location.href);
    const artifacts = await artLoader.fromUrl(url);
    assert.isArray(artifacts);
    assert.lengthOf(artifacts, 1);
  });
});
