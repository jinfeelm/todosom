import fs from 'fs';
import path from 'path';

interface SpriteState {
  image: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
}

interface SpriteManifest {
  assetKey: string;
  displayName: string;
  isPlaceholder?: boolean;
  baseSize: { width: number; height: number };
  states: Record<string, SpriteState>;
}

function findManifests(rootDir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(rootDir)) {
    return results;
  }

  const walk = (dir: string): void => {
    const manifestPath = path.join(dir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      results.push(manifestPath);
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name));
      }
    }
  };

  walk(rootDir);
  return results;
}

function validateManifest(manifestPath: string): string[] {
  const errors: string[] = [];
  const dir = path.dirname(manifestPath);
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as SpriteManifest;

  if (!raw.assetKey) errors.push(`${manifestPath}: missing assetKey`);
  if (!raw.displayName) errors.push(`${manifestPath}: missing displayName`);
  if (!raw.baseSize?.width || !raw.baseSize?.height) {
    errors.push(`${manifestPath}: missing baseSize`);
  }
  if (!raw.states || Object.keys(raw.states).length === 0) {
    errors.push(`${manifestPath}: missing states`);
    return errors;
  }

  for (const [stateName, state] of Object.entries(raw.states)) {
    if (!state.image) errors.push(`${manifestPath}: ${stateName} missing image`);
    if (!state.frameWidth || !state.frameHeight) {
      errors.push(`${manifestPath}: ${stateName} missing frame dimensions`);
    }
    if (state.frameCount == null) errors.push(`${manifestPath}: ${stateName} missing frameCount`);
    if (state.fps == null) errors.push(`${manifestPath}: ${stateName} missing fps`);
    if (state.loop == null) errors.push(`${manifestPath}: ${stateName} missing loop`);
    const imagePath = path.join(dir, state.image);
    if (!raw.isPlaceholder && !fs.existsSync(imagePath)) {
      errors.push(`${manifestPath}: missing file ${state.image}`);
    }
  }

  return errors;
}

function main(): void {
  const petsDir = path.join(process.cwd(), 'src/assets/pets');
  const effectsDir = path.join(process.cwd(), 'src/assets/effects');

  const manifests = [
    ...findManifests(petsDir),
    ...findManifests(effectsDir),
  ];

  const allErrors = manifests.flatMap(validateManifest);

  if (allErrors.length > 0) {
    console.error('Asset manifest validation failed:');
    for (const err of allErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`Validated ${manifests.length} manifest(s).`);
}

main();
