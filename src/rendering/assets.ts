import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { prepareBlenderBicycle } from './blender-bicycle';

/** Required production asset: startup must report failure rather than hide it. */
export async function loadBicycleAsset(baseUrl: string) {
  try {
    const gltf = await new GLTFLoader().loadAsync(`${baseUrl}assets/models/bicycle-rider.glb`);
    return prepareBlenderBicycle(gltf.scene);
  } catch (error) {
    throw new Error('No se pudo cargar la bicicleta de Blender. Recarga la página para intentarlo de nuevo.', { cause: error });
  }
}
