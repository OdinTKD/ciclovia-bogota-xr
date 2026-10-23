import { describe, expect, it, vi } from 'vitest';
import { Group, DirectionalLight, Mesh, MeshStandardMaterial, Texture, InstancedMesh, MeshLambertMaterial } from 'three';
import { createWorld, assetGeometryStats } from '../../src/rendering/scene';

describe('integración de la muestra artística A', () => {
  it('evita cajas de seis caras para ventanas lejanas planas', () => {
    const world = createWorld();
    const windows = world.scene.getObjectByName('environment')!.children.find(node =>
      node instanceof InstancedMesh && (node.material as MeshLambertMaterial).color.getHex() === 0x91bcc4) as InstancedMesh;
    expect(windows.geometry.index!.count / 3).toBe(2);
    world.dispose();
  });
  it('usa y actualiza el vehículo suministrado sin crear una segunda bicicleta', () => {
    const group = new Group(); group.name = 'bicycle';
    const update = vi.fn();
    const world = createWorld({ bicycle: { group, update } });
    expect(world.camera.getObjectByName('bicycle') === group).toBe(true);
    const bicycles: Group[] = [];
    world.scene.traverse(node => { if (node.name === 'bicycle') bicycles.push(node as Group); });
    expect(bicycles).toHaveLength(1);
    world.update({ x: 0, distance: 12, speed: 4, elapsed: 3, weather: 'sun', steeringAngle: .2 }, []);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ steeringAngle: .2, speed: 4 }));
  });

  it('incluye una muestra limitada y conserva margen para el presupuesto de escena', () => {
    const world = createWorld();
    const slice = world.scene.getObjectByName('art-slice');
    expect(slice).toBeDefined();
    expect(slice!.userData.extent).toEqual({ start: 0, end: 40 });
    const inventory = assetGeometryStats(world.scene);
    expect(inventory.triangles).toBeLessThanOrEqual(100_000);
    expect(inventory.drawCalls).toBeLessThanOrEqual(100);
  });

  it('prepara sombras estáticas acotadas y reduce luz directa en lluvia', () => {
    const world = createWorld();
    const sun = world.scene.children.find(node => node instanceof DirectionalLight) as DirectionalLight;
    expect(sun.castShadow).toBe(true);
    expect(sun.shadow.mapSize.x).toBeLessThanOrEqual(1024);
    world.update({ x: 0, distance: 0, speed: 0, elapsed: 0, weather: 'sun' }, []);
    const dryIntensity = sun.intensity;
    world.update({ x: 0, distance: 0, speed: 0, elapsed: 0, weather: 'rain' }, []);
    expect(sun.intensity).toBeLessThan(dryIntensity);
  });

  it('libera recursos de materiales y texturas una sola vez al cerrar la escena', () => {
    const world = createWorld();
    const asphalt = world.scene.getObjectByName('asphalt') as Mesh;
    const material = asphalt.material as MeshStandardMaterial;
    const textureDispose = vi.spyOn(material.map!, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');
    const reflection = new Texture(); reflection.isRenderTargetTexture = true;
    material.envMap = reflection;
    const reflectionDispose = vi.spyOn(reflection, 'dispose');
    world.dispose();
    world.dispose();
    expect(textureDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(reflectionDispose).not.toHaveBeenCalled(); // Its render target owns it.
  });
});
