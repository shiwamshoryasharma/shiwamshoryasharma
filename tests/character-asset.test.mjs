import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bytes = readFileSync(new URL('../assets/wayfarer.glb', import.meta.url));
const jsonLength = bytes.readUInt32LE(12);
const asset = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());

test('the shipped character is a self-contained GLB within the hero download budget', () => {
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.ok(bytes.length < 2_000_000);
  assert.ok(asset.buffers.every(buffer => !buffer.uri));
  assert.ok((asset.images || []).every(image => !image.uri));
  assert.ok(asset.meshes.length <= 50);
});

test('the shipped character retains the pivots required by browser animation', () => {
  for (const name of ['Head', 'ArmL', 'ArmR', 'EyeL', 'EyeR', 'Companion']) {
    assert.equal(asset.nodes.filter(node => node.name === name).length, 1, name);
  }
});
