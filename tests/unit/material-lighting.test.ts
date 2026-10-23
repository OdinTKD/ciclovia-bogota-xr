import { it, expect } from 'vitest';
import { Scene, Mesh, BoxGeometry, MeshStandardMaterial, MeshLambertMaterial, Texture } from 'three';
import { applyMaterialLighting, applyRenderQuality } from '../../src/rendering/material-lighting';

it('reserva reflejos de entorno a metal y vidrio, sin sombrear dos veces superficies mates', () => {
  const scene = new Scene(), reflection = new Texture();
  const metal = new MeshStandardMaterial({ metalness: .72 });
  const cloth = new MeshStandardMaterial({ metalness: 0, roughness: .78 });
  const ground = new MeshStandardMaterial({ metalness: 0, roughness: .34 });
  scene.add(new Mesh(new BoxGeometry(), [metal, cloth, ground]));
  applyMaterialLighting(scene, reflection);
  expect(scene.environment).toBeNull();
  expect(metal.envMap).toBe(reflection);
  expect(metal.envMapIntensity).toBe(.35);
  expect(cloth.envMap).toBeNull();
  expect(ground.envMap).toBeNull();
});

it('al llegar al ratio mínimo usa luz difusa y conserva texturas, color y geometría', () => {
  const scene = new Scene(), reflection = new Texture();
  const material = new MeshStandardMaterial({ metalness: .72 });
  const mesh = new Mesh(new BoxGeometry(), material); scene.add(mesh);
  const renderer = { shadowMap: { enabled: true } };
  applyRenderQuality(renderer, scene, reflection, .75);
  expect(renderer.shadowMap.enabled).toBe(true); expect(material.envMap).toBe(reflection);
  applyRenderQuality(renderer, scene, reflection, .375);
  expect(renderer.shadowMap.enabled).toBe(false); expect(material.envMap).toBeNull();
  expect(mesh.material).toBeInstanceOf(MeshLambertMaterial);
  expect(mesh.material.color).toBe(material.color); expect(mesh.visible).toBe(true);
  applyRenderQuality(renderer, scene, reflection, 1);
  expect(renderer.shadowMap.enabled).toBe(true); expect(material.envMap).toBe(reflection);
  expect(mesh.material).toBe(material);
});
